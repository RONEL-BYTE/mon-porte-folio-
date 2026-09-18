// ============================================================
// IMPORTS
// ============================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { body, param, validationResult } = require("express-validator");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_URL et SUPABASE_KEY sont obligatoires");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire");
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const frontendUrl = frontendUrls[0] || "http://localhost:5173";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.set("trust proxy", isProduction ? 1 : 0);

if (isProduction && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY est obligatoire en production");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY est obligatoire côté serveur");
}


// ============================================================
// MIDDLEWARES
// ============================================================

const allowedOrigins = new Set(
  isProduction
    ? frontendUrls
    : [...frontendUrls, "http://localhost:5173", "http://127.0.0.1:5173"]
);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin non autorisée"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload && typeof payload.message === "string" &&
        /(column|relation|constraint|violates|PGRST|fetch failed|timeout|permission denied|invalid input syntax)/i
          .test(payload.message)) {
      return originalJson({
        ...payload,
        message: "Erreur lors du traitement de la requête",
      });
    }

    return originalJson(payload);
  };

  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives. Réessayez plus tard." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Trop de messages. Réessayez plus tard." },
});

const publicCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Trop de commentaires. Réessayez plus tard." },
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Trop de requêtes. Réessayez plus tard." },
});

const rejectUnsafePayload = (value) => {
  if (!value || typeof value !== "object") return false;

  return Object.entries(value).some(([key, nestedValue]) => {
    if (["__proto__", "prototype", "constructor"].includes(key)) return true;
    if (typeof nestedValue === "string" && nestedValue.length > 10000) return true;
    return typeof nestedValue === "object" && rejectUnsafePayload(nestedValue);
  });
};

app.use((req, res, next) => {
  if (rejectUnsafePayload(req.body)) {
    return res.status(400).json({ success: false, message: "Données invalides" });
  }

  return next();
});

// ============================================================
// SUPABASE
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const adminCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

const signAdminToken = (admin) => jwt.sign(
  { sub: String(admin.id), username: admin.username, role: "admin" },
  process.env.JWT_SECRET,
  { expiresIn: "8h", issuer: "portfolio-api", audience: "portfolio-admin" }
);

const requireAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentification requise" });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "portfolio-api",
      audience: "portfolio-admin",
    });
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Authentification requise" });
  }
};

const requireCsrf = (req, res, next) => {
  const csrfCookie = req.cookies.csrf_token;
  const csrfHeader = req.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie.length !== csrfHeader.length ||
      !crypto.timingSafeEqual(Buffer.from(csrfCookie), Buffer.from(csrfHeader))) {
    return res.status(403).json({ success: false, message: "Requête non autorisée" });
  }

  return next();
};

const validationMiddleware = (validations) => [
  ...validations,
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Données invalides" });
    }

    return next();
  },
];

const validatePayload = (req, res, next) => {
  const bodyValue = req.body || {};

  for (const [key, value] of Object.entries(bodyValue)) {
    if (typeof value === "string" && value.length > 5000) {
      return res.status(400).json({ success: false, message: "Données invalides" });
    }

    if (["image_url", "video_url", "project_url", "github_url", "netlify_url",
      "linkedin_url", "whatsapp_url", "telegram_url", "instagram_url", "tiktok_url"]
      .includes(key) && value &&
      (!/^https?:\/\//i.test(value) || value.length > 2048)) {
      return res.status(400).json({ success: false, message: "URL invalide" });
    }
  }

  return next();
};

const adminMutation = [requireAdmin, requireCsrf, sensitiveLimiter, validatePayload];

const isSupabaseNetworkError = (error) => {
  const details = `${error?.message || ""} ${error?.details || ""}`;

  return details.includes("fetch failed") ||
    details.includes("ConnectTimeoutError") ||
    details.includes("UND_ERR_CONNECT_TIMEOUT");
};


// ============================================================
// ROUTE TEST
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Portfolio Ronel fonctionne 🚀"
  });
});


// ============================================================
// ======================= PROJECTS ============================
// ============================================================

// GET tous les projets
app.get("/api/projects", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération projets :", error);

      return res.status(500).json({
        success: false,
        message: "Erreur récupération projets"
      });
    }

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// POST créer un projet
// ============================================================

app.post("/api/projects", ...adminMutation, async (req, res) => {
  try {
    const {
      name,
      description,
      github_url,
      netlify_url,
      image_url,
      technologies
    } = req.body;

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name,
          description,
          github_url,
          netlify_url,
          image_url,
          technologies
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur création projet :", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      project: data
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// DELETE projet
// ============================================================

app.delete("/api/projects/:id", ...adminMutation, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression projet :", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: "Projet supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= LIKE PROJET =========================
// ============================================================

app.post("/api/projects/:id/like", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      data: project,
      error: getError
    } = await supabase
      .from("projects")
      .select("likes")
      .eq("id", id)
      .single();

    if (getError || !project) {
      return res.status(404).json({
        success: false,
        message: "Projet introuvable"
      });
    }

    const newLikes = (project.likes || 0) + 1;

    const {
      data,
      error
    } = await supabase
      .from("projects")
      .update({
        likes: newLikes
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur like projet :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      likes: data.likes
    });

  } catch (error) {

    console.error(
      "Erreur serveur like projet :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= VUE PROJET ===========================
// ============================================================

app.post("/api/projects/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      data: project,
      error: getError
    } = await supabase
      .from("projects")
      .select("views")
      .eq("id", id)
      .single();

    if (getError || !project) {
      return res.status(404).json({
        success: false,
        message: "Projet introuvable"
      });
    }

    const newViews = (project.views || 0) + 1;

    const {
      data,
      error
    } = await supabase
      .from("projects")
      .update({
        views: newViews
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur vue projet :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      views: data.views
    });

  } catch (error) {

    console.error(
      "Erreur serveur vue projet :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= GITHUB =============================
// ============================================================

app.get("/api/github/test", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {
    const repo =
      "https://github.com/RONEL-BYTE/site-vitrine-pour-un-restorent";

    const parts = repo
      .replace("https://github.com/", "")
      .split("/");

    const owner = parts[0];
    const repoName = parts[1];

    const githubResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    const languagesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/languages`
    );

    res.json({
      success: true,
      repository: githubResponse.data,
      languages: languagesResponse.data
    });

  } catch (error) {
    console.error(
      "Erreur GitHub :",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Erreur GitHub"
    });
  }
});


// ============================================================
// SYNCHRONISATION GITHUB
// ============================================================

app.post("/api/projects/sync", ...adminMutation, async (req, res) => {
  try {
    const { github_url } = req.body;

    if (!github_url) {
      return res.status(400).json({
        success: false,
        message: "URL GitHub obligatoire"
      });
    }

    const parts = github_url
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

    const owner = parts[0];
    const repoName = parts[1];

    const githubResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    const languagesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/languages`
    );

    const technologies = Object.keys(
      languagesResponse.data || {}
    );

    const project = {
      name: githubResponse.data.name,
      description: githubResponse.data.description,
      github_url: githubResponse.data.html_url,
      netlify_url: null,
      image_url: null,
      technologies
    };

    const { data, error } = await supabase
      .from("projects")
      .upsert(
        [project],
        {
          onConflict: "github_url"
        }
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur synchronisation GitHub :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      project: data
    });

  } catch (error) {
    console.error(
      "Erreur GitHub sync :",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Erreur synchronisation GitHub"
    });
  }
});


// ============================================================
// ======================= NETLIFY =============================
// ============================================================

app.get("/api/netlify/test", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.netlify.com/api/v1/sites",
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`
        }
      }
    );

    res.json({
      success: true,
      sites: response.data
    });

  } catch (error) {
    console.error(
      "Erreur Netlify :",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Erreur Netlify"
    });
  }
});


// ============================================================
// RECHERCHE SITE NETLIFY
// ============================================================

app.get("/api/netlify/site", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL Netlify obligatoire"
      });
    }

    const response = await axios.get(
      "https://api.netlify.com/api/v1/sites",
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`
        }
      }
    );

    const sites = response.data;

    const site = sites.find(
      (site) =>
        site.url === url ||
        site.ssl_url === url ||
        site.name === url ||
        `https://${site.name}.netlify.app` === url ||
        `http://${site.name}.netlify.app` === url
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site Netlify introuvable"
      });
    }

    res.json({
      success: true,
      site
    });

  } catch (error) {
    console.error(
      "Erreur recherche Netlify :",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Erreur Netlify"
    });
  }
});


// ============================================================
// SYNCHRONISATION NETLIFY + GITHUB
// ============================================================

app.post("/api/projects/sync-netlify", ...adminMutation, async (req, res) => {
  try {
    const { netlify_url } = req.body;

    if (!netlify_url) {
      return res.status(400).json({
        success: false,
        message: "URL Netlify obligatoire"
      });
    }

    const netlifyResponse = await axios.get(
      "https://api.netlify.com/api/v1/sites",
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`
        }
      }
    );

    const sites = netlifyResponse.data;

    const site = sites.find(
      (site) =>
        site.url === netlify_url ||
        site.ssl_url === netlify_url ||
        `https://${site.name}.netlify.app` === netlify_url ||
        `http://${site.name}.netlify.app` === netlify_url
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site Netlify introuvable"
      });
    }

    const repoUrl =
      site.build_settings?.repo_url ||
      site.repo_url ||
      null;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Aucun repository GitHub associé à ce site Netlify"
      });
    }

    const parts = repoUrl
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

    const owner = parts[0];
    const repoName = parts[1];

    const githubResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    const languagesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/languages`
    );

    const technologies = Object.keys(
      languagesResponse.data || {}
    );

    const project = {
      name: githubResponse.data.name,
      description:
        githubResponse.data.description ||
        "Projet développé par Ronel Ngompe",

      github_url: githubResponse.data.html_url,

      netlify_url:
        site.ssl_url ||
        site.url,

      image_url:
        site.screenshot_url ||
        null,

      technologies,

      published: true
    };

    const { data, error } = await supabase
      .from("projects")
      .upsert(
        [project],
        {
          onConflict: "github_url"
        }
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur sauvegarde projet :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      project: data
    });

  } catch (error) {
    console.error(
      "Erreur synchronisation Netlify :",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Erreur synchronisation Netlify"
    });
  }
});


// ============================================================
// ======================= ADMIN LOGIN =========================
// ============================================================

app.get("/api/admin/csrf", (req, res) => {
  const token = createCsrfToken();

  res.cookie("csrf_token", token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({ success: true });
});

app.get("/api/admin/session", requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin.sub,
      username: req.admin.username,
    },
  });
});

app.post(
  "/api/admin/login",
  loginLimiter,
  validationMiddleware([
    body("username").isString().trim().isLength({ min: 1, max: 80 }),
    body("password").isString().isLength({ min: 1, max: 200 }),
  ]),
  async (req, res) => {
  try {
    const username = req.body.username.trim().toLowerCase();
    const { password } = req.body;

    const {
      data,
      error
    } = await supabase
      .from("admins")
      .select("id, username, password")
      .eq("username", username)
      .single();

    const passwordMatches = data && !error
      ? await bcrypt.compare(password, data.password)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    const token = signAdminToken(data);
    const csrfToken = createCsrfToken();

    res.cookie("admin_token", token, adminCookieOptions);
    res.cookie("csrf_token", csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: adminCookieOptions.maxAge,
      path: "/",
    });

    res.json({
      success: true,
      message: "Connexion réussie",
      admin: { id: data.id, username: data.username },
    });

  } catch (error) {
    console.error("ERREUR LOGIN :", error.message);

    res.status(500).json({
      success: false,
      message: "Impossible de traiter la connexion",
    });
  }
  }
);

app.post("/api/admin/logout", requireAdmin, requireCsrf, (req, res) => {
  res.clearCookie("admin_token", adminCookieOptions);
  res.clearCookie("csrf_token", { ...adminCookieOptions, httpOnly: false });
  res.json({ success: true, message: "Déconnexion réussie" });
});


// ============================================================
// ======================= ADMIN STATS =========================
// ============================================================

app.get("/api/admin/stats", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {

    const {
      count: projectCount,
      error: projectError
    } = await supabase
      .from("projects")
      .select("*", {
        count: "exact",
        head: true
      });

    if (projectError) {
      console.error(
        "Erreur projets stats :",
        projectError
      );
    }


    const {
      data: publications,
      error: publicationError
    } = await supabase
      .from("publications")
      .select("likes, views");

    if (publicationError) {
      console.error(
        "Erreur publications stats :",
        publicationError
      );
    }


    const totalLikes =
      (publications || []).reduce(
        (total, publication) =>
          total + (publication.likes || 0),
        0
      );


    const totalViews =
      (publications || []).reduce(
        (total, publication) =>
          total + (publication.views || 0),
        0
      );


    const publicationCount =
      publications?.length || 0;


    const {
      count: commentCount,
      error: commentError
    } = await supabase
      .from("comments")
      .select("*", {
        count: "exact",
        head: true
      });

    if (commentError) {
      console.error(
        "Erreur commentaires stats :",
        commentError
      );
    }


    res.json({
      success: true,

      stats: {
        projects: projectCount || 0,
        publications: publicationCount,
        comments: commentCount || 0,
        likes: totalLikes,
        views: totalViews
      }
    });

  } catch (error) {

    console.error(
      "Erreur stats admin :",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Erreur récupération statistiques"
    });
  }
});


// ============================================================
// ======================= PUBLICATIONS ========================
// ============================================================

// GET publications
app.get("/api/publications", async (req, res) => {
  try {

    const {
      data: publications,
      error
    } = await supabase
      .from("publications")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(
        "Erreur récupération publications :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }


    const {
      data: comments,
      error: commentsError
    } = await supabase
      .from("comments")
      .select("id, publication_id");

    if (commentsError) {
      console.error(
        "Erreur récupération commentaires :",
        commentsError
      );
    }


    const publicationsWithComments =
      publications.map((publication) => {

        const commentCount =
          (comments || []).filter(
            (comment) =>
              comment.publication_id === publication.id
          ).length;

        return {
          ...publication,
          comment_count: commentCount
        };
      });


    res.json(publicationsWithComments);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// CRÉER PUBLICATION
// ============================================================

app.post("/api/publications", ...adminMutation, async (req, res) => {
  try {

    const {
      title,
      content,
      image_url,
      video_url,
      technologies,
      project_url
    } = req.body;

    const { data, error } = await supabase
      .from("publications")
      .insert([
        {
          title,
          content,
          image_url,
          video_url,
          technologies,
          project_url
        }
      ])
      .select()
      .single();

    if (error) {

      console.error(
        "Erreur création publication :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      publication: data
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// DELETE PUBLICATION
// ============================================================

app.delete("/api/publications/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const { error } = await supabase
      .from("publications")
      .delete()
      .eq("id", id);

    if (error) {

      console.error(
        "Erreur suppression publication :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: "Publication supprimée"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= LIKES ===============================
// ============================================================

app.post("/api/publications/:id/like", async (req, res) => {
  try {

    const { id } = req.params;

    const {
      data: publication,
      error: getError
    } = await supabase
      .from("publications")
      .select("likes")
      .eq("id", id)
      .single();

    if (getError || !publication) {

      return res.status(404).json({
        success: false,
        message: "Publication introuvable"
      });
    }

    const newLikes =
      (publication.likes || 0) + 1;

    const {
      data,
      error
    } = await supabase
      .from("publications")
      .update({
        likes: newLikes
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {

      console.error(
        "Erreur like :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      likes: data.likes
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= VUES ================================
// ============================================================

app.post("/api/publications/:id/view", async (req, res) => {
  try {

    const { id } = req.params;

    const {
      data: publication,
      error: getError
    } = await supabase
      .from("publications")
      .select("views")
      .eq("id", id)
      .single();

    if (getError || !publication) {

      return res.status(404).json({
        success: false,
        message: "Publication introuvable"
      });
    }

    const newViews =
      (publication.views || 0) + 1;

    const {
      data,
      error
    } = await supabase
      .from("publications")
      .update({
        views: newViews
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {

      console.error(
        "Erreur vue :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      views: data.views
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= COMMENTS ============================
// ============================================================

// PUBLIC : commentaires approuvés
app.get(
  "/api/publications/:publicationId/comments",
  async (req, res) => {
    try {

      const { publicationId } = req.params;

      const {
        data,
        error
      } = await supabase
        .from("comments")
        .select("id, author_name, content, created_at")
        .eq("publication_id", publicationId)
        .eq("approved", true)
        .order("created_at", {
          ascending: false
        });

      if (error) {

        console.error(
          "Erreur commentaires publics :",
          error
        );

        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      res.json(data);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// PUBLIC : ajouter commentaire
app.post(
  "/api/publications/:publicationId/comments",
  publicCommentLimiter,
  validationMiddleware([
    param("publicationId").isString().trim().isLength({ min: 1, max: 80 }),
    body("author_name").isString().trim().isLength({ min: 2, max: 120 }),
    body("content").isString().trim().isLength({ min: 2, max: 3000 }),
  ]),
  async (req, res) => {
    try {

      const { publicationId } = req.params;

      const {
        author_name,
        content
      } = req.body;

      if (!author_name || !content) {

        return res.status(400).json({
          success: false,
          message:
            "Nom et commentaire obligatoires"
        });
      }

      const {
        data,
        error
      } = await supabase
        .from("comments")
        .insert([
          {
            publication_id: publicationId,
            author_name,
            content,
            approved: true
          }
        ])
        .select()
        .single();

      if (error) {

        console.error(
          "Erreur ajout commentaire :",
          error
        );

        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      res.json({
        success: true,
        comment: data
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ============================================================
// ADMIN : TOUS LES COMMENTAIRES
// ============================================================

app.get("/api/comments", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {

    const {
      data,
      error
    } = await supabase
      .from("comments")
      .select(`
        id,
        publication_id,
        author_name,
        content,
        approved,
        created_at
      `)
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(
        "Erreur admin commentaires :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ADMIN : MODIFIER VISIBILITÉ COMMENTAIRE
// ============================================================

app.patch(
  "/api/comments/:id/visibility",
  ...adminMutation,
  async (req, res) => {
    try {

      const { id } = req.params;
      const { approved } = req.body;

      const {
        data,
        error
      } = await supabase
        .from("comments")
        .update({
          approved
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {

        console.error(
          "Erreur modification commentaire :",
          error
        );

        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      res.json({
        success: true,
        comment: data
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ============================================================
// ADMIN : SUPPRIMER COMMENTAIRE
// ============================================================

app.delete("/api/comments/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      error
    } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) {

      console.error(
        "Erreur suppression commentaire :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: "Commentaire supprimé"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= SKILLS ==============================
// ============================================================

// GET
app.get("/api/skills", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("created_at", {
        ascending: true
      });

    if (error) {
      console.error(
        "Erreur GET skills :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération des compétences"
      });
    }

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// POST
app.post("/api/skills", ...adminMutation, async (req, res) => {
  try {

    const {
      name,
      category,
      level,
      icon
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom de la compétence est obligatoire"
      });
    }

    const { data, error } = await supabase
      .from("skills")
      .insert([
        {
          name,
          category: category || null,
          level: level || 50,
          icon: icon || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur POST skill :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Impossible d'ajouter la compétence"
      });
    }

    res.status(201).json({
      success: true,
      message: "Compétence ajoutée",
      skill: data
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// PATCH
app.patch("/api/skills/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      category,
      level,
      icon
    } = req.body;

    const { data, error } = await supabase
      .from("skills")
      .update({
        name,
        category,
        level,
        icon
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Erreur PATCH skill :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Impossible de modifier la compétence"
      });
    }

    res.json({
      success: true,
      message: "Compétence modifiée",
      skill: data
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// DELETE
app.delete("/api/skills/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Erreur DELETE skill :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Impossible de supprimer la compétence"
      });
    }

    res.json({
      success: true,
      message: "Compétence supprimée"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= EVENTS ==============================
// ============================================================

// GET
app.get("/api/events", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", {
        ascending: true
      });

    if (error) {
      console.error(
        "ERREUR GET EVENTS :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération des événements"
      });
    }

    res.json(data);

  } catch (error) {

    console.error(
      "ERREUR SERVEUR EVENTS :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// POST
app.post("/api/events", ...adminMutation, async (req, res) => {
  try {

    const {
      title,
      description,
      image_url,
      event_date
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Le titre est obligatoire"
      });
    }

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          image_url,
          event_date
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "ERREUR CREATE EVENT :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la création de l'événement"
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Événement créé avec succès",
      event: data
    });

  } catch (error) {

    console.error(
      "ERREUR SERVEUR CREATE EVENT :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// PATCH
app.patch("/api/events/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      title,
      description,
      image_url,
      event_date
    } = req.body;

    const { data, error } = await supabase
      .from("events")
      .update({
        title,
        description,
        image_url,
        event_date
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "ERREUR UPDATE EVENT :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la modification"
      });
    }

    res.json({
      success: true,
      message:
        "Événement modifié avec succès",
      event: data
    });

  } catch (error) {

    console.error(
      "ERREUR SERVEUR UPDATE EVENT :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// DELETE
app.delete("/api/events/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "ERREUR DELETE EVENT :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la suppression"
      });
    }

    res.json({
      success: true,
      message:
        "Événement supprimé avec succès"
    });

  } catch (error) {

    console.error(
      "ERREUR SERVEUR DELETE EVENT :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// ======================= PROFILE =============================
// ============================================================

// GET — récupérer le profil
app.get("/api/profile", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .order("id", {
        ascending: true
      })
      .limit(1)
      .single();

    if (error) {

      console.error(
        "ERREUR GET PROFILE :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération du profil"
      });
    }

    res.json(data);

  } catch (error) {

    console.error(
      "ERREUR SERVEUR PROFILE :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// POST — créer le profil
// ============================================================

app.post("/api/profile", ...adminMutation, async (req, res) => {
  try {

    const {
      name,
      profession,
      bio,
      description,
      location,
      availability,
      photo_url,
      github_url,
      linkedin_url,
      whatsapp_url,
      telegram_url,
      instagram_url,
      tiktok_url
    } = req.body;

    const { data, error } = await supabase
      .from("profile")
      .insert([
        {
          name,
          profession,
          bio,
          description,
          location,
          availability,
          photo_url,
          github_url,
          linkedin_url,
          whatsapp_url,
          telegram_url,
          instagram_url,
          tiktok_url
        }
      ])
      .select()
      .single();

    if (error) {

      console.error(
        "ERREUR CREATE PROFILE :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Profil créé avec succès",
      profile: data
    });

  } catch (error) {

    console.error(
      "ERREUR SERVEUR CREATE PROFILE :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ============================================================
// PATCH — modifier le profil
// ============================================================

app.patch("/api/profile/:id", ...adminMutation, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      profession,
      bio,
      description,
      location,
      availability,
      photo_url,
      github_url,
      linkedin_url,
      whatsapp_url,
      telegram_url,
      instagram_url,
      tiktok_url
    } = req.body;


    console.log(
      "PROFILE UPDATE REÇU :",
      {
        id,
        name,
        profession,
        github_url,
        linkedin_url,
        whatsapp_url,
        telegram_url,
        instagram_url,
        tiktok_url
      }
    );


    const { data, error } = await supabase
      .from("profile")
      .update({
        name,
        profession,
        bio,
        description,
        location,
        availability,
        photo_url,

        // RÉSEAUX SOCIAUX
        github_url,
        linkedin_url,
        whatsapp_url,
        telegram_url,
        instagram_url,
        tiktok_url,

        updated_at:
          new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();


    if (error) {

      console.error(
        "ERREUR UPDATE PROFILE :",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }


    console.log(
      "PROFILE UPDATE RÉUSSI :",
      data
    );


    res.json({
      success: true,
      message:
        "Profil modifié avec succès",
      profile: data
    });

  } catch (error) {

    console.error(
      "ERREUR SERVEUR UPDATE PROFILE :",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// ===============================
// CONTACT
// ===============================

// ===============================
// CONTACT
// ===============================

app.post(
  "/api/contact",
  contactLimiter,
  validationMiddleware([
    body("name").isString().trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail().isLength({ max: 254 }),
    body("subject").isString().trim().isLength({ min: 2, max: 200 }),
    body("message").isString().trim().isLength({ min: 2, max: 5000 }),
  ]),
  async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires",
      });
    }

    let error;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      ({ error } = await supabase
        .from("messages")
        .insert([
          {
            name,
            email,
            subject,
            message,
          },
        ]));

      if (!error || !isSupabaseNetworkError(error) || attempt === 2) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (error) {
      console.error("Erreur enregistrement message :", error);

      return res.status(isSupabaseNetworkError(error) ? 503 : 500).json({
        success: false,
        message: isSupabaseNetworkError(error)
          ? "Supabase est temporairement inaccessible. Réessayez dans quelques secondes."
          : "Impossible d'enregistrer le message",
      });
    }

    res.status(201).json({
      success: true,
      message: "Message envoyé avec succès",
    });

  } catch (error) {
    console.error("Erreur serveur contact :", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
  }
);

// ============================================================
// ======================= MESSAGES ADMIN =====================
// ============================================================

app.get("/api/messages", requireAdmin, sensitiveLimiter, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, name, email, subject, message, created_at, read")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération messages :", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      messages: data,
    });
  } catch (error) {
    console.error("Erreur serveur messages :", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.delete("/api/messages/:id", ...adminMutation, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression message :", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Message supprimé",
    });
  } catch (error) {
    console.error("Erreur serveur suppression message :", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.patch("/api/messages/:id/read", ...adminMutation, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("id", id)
      .select("id, read")
      .single();

    if (error) {
      console.error("Erreur lecture message :", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: data,
    });
  } catch (error) {
    console.error("Erreur serveur lecture message :", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});
// ============================================================
// 404
// ============================================================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "Route introuvable"
  });

});

app.use((error, req, res, next) => {
  console.error("Erreur API :", error.message);

  if (res.headersSent) return next(error);

  const status = error.message === "Origin non autorisée" ? 403 : 500;
  res.status(status).json({
    success: false,
    message: status === 403 ? "Origine non autorisée" : "Erreur serveur",
  });
});


// ============================================================
// DÉMARRAGE SERVEUR
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  );

});
