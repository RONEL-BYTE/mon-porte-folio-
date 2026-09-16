import { useEffect, useState } from "react";
import "./Projects.css";
import { apiFetch } from "../services/api";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date");
  const [liked, setLiked] = useState([]);
  const [viewed, setViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerProjets = async () => {
      try {
        setLoading(true);

        const response = await apiFetch("/api/projects");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erreur lors du chargement des projets"
          );
        }

        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Erreur récupération projets :", error);
      } finally {
        setLoading(false);
      }
    };

    chargerProjets();
  }, []);

  const technologies = [
    ...new Set(
      projects.flatMap((project) =>
        Array.isArray(project.technologies) ? project.technologies : []
      )
    ),
  ].sort((a, b) => a.localeCompare(b));

  // =========================
  // LIKE
  // =========================
  const handleLike = async (id) => {
    if (liked.includes(id)) return;

    try {
      const response = await apiFetch(
        `/api/projects/${id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors du like");
      }

      setLiked((current) => [...current, id]);

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === id
            ? { ...project, likes: data.likes }
            : project
        )
      );
    } catch (error) {
      console.error("Erreur like projet :", error);
    }
  };

  // =========================
  // VUE
  // =========================
  const handleView = async (id) => {
    // Évite de compter plusieurs fois le même projet
    // pendant cette session
    if (viewed.includes(id)) return;

    try {
      const response = await apiFetch(
        `/api/projects/${id}/view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la vue");
      }

      setViewed((current) => [...current, id]);

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === id
            ? { ...project, views: data.views }
            : project
        )
      );
    } catch (error) {
      console.error("Erreur vue projet :", error);
    }
  };

  // =========================
  // FILTRE
  // =========================
  let filteredProjects =
    filter === "all"
      ? [...projects]
      : projects.filter((project) =>
          project.technologies?.some(
            (tech) => tech.toLowerCase() === filter.toLowerCase()
          )
        );

  // =========================
  // TRI
  // =========================
  filteredProjects.sort((a, b) => {
    if (sort === "likes") {
      return (b.likes || 0) - (a.likes || 0);
    }

    if (sort === "views") {
      return (b.views || 0) - (a.views || 0);
    }

    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <section id="projects" className="projects-section">
      <div className="projects-container">

        <div className="projects-header">
          <div>
            <div className="projects-label">
              <span>01 // Portfolio</span>
              <i></i>
            </div>

            <h2>Featured Projects</h2>

            <p>
              A selection of high-performance projects I've designed and
              engineered.
            </p>
          </div>

          <div className="projects-controls">

            <div className="project-filters">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              {technologies.map((technology) => (
                <button
                  key={technology}
                  className={filter === technology ? "active" : ""}
                  onClick={() => setFilter(technology)}
                >
                  {technology}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="project-sort"
            >
              <option value="date">Latest</option>
              <option value="likes">Popular</option>
              <option value="views">Most viewed</option>
            </select>

          </div>
        </div>

        <div className="projects-grid">

          {loading ? (
            <p>Chargement des projets...</p>
          ) : filteredProjects.length === 0 ? (
            <p>Aucun projet disponible.</p>
          ) : (
            filteredProjects.map((project) => {

              const isLiked = liked.includes(project.id);

              return (
                <article
                  className="project-card"
                  key={project.id}
                >

                  <div className="project-image">

                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.name}
                      />
                    ) : (
                      <div className="project-no-image">
                        Image indisponible
                      </div>
                    )}

                    <div className="project-image-overlay"></div>

                    {project.published && (
                      <span className="project-badge">
                        FEATURED
                      </span>
                    )}

                    <button
                      className={`like-button ${
                        isLiked ? "liked" : ""
                      }`}
                      onClick={() => handleLike(project.id)}
                      disabled={isLiked}
                      aria-label={
                        isLiked
                          ? "Projet déjà liké"
                          : "Liker le projet"
                      }
                    >
                      ♥
                      <span>{project.likes || 0}</span>
                    </button>

                  </div>

                  <div className="project-content">

                    <h3>{project.name}</h3>

                    <p>
                      {project.description ||
                        "Projet développé par Ronel."}
                    </p>

                    <div className="project-technologies">

                      {Array.isArray(project.technologies) &&
                        project.technologies.map((tech) => (
                          <span key={tech}>
                            {tech}
                          </span>
                        ))}

                    </div>

                    <div className="project-actions">

                      <a
                        href={
                          project.netlify_url ||
                          project.github_url ||
                          "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-details"
                        onClick={() => handleView(project.id)}
                      >
                        View Details <span>→</span>
                      </a>

                      <span className="project-view-count">
                        👁 {project.views || 0}
                      </span>

                      <div className="project-links">

                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                          >
                            &lt;/&gt;
                          </a>
                        )}

                        {project.netlify_url && (
                          <a
                            href={project.netlify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Live Demo"
                          >
                            ↗
                          </a>
                        )}

                      </div>

                    </div>

                  </div>

                </article>
              );
            })
          )}

        </div>

        <div className="projects-footer">
          <a href="#projects">
            View all projects <span>→</span>
          </a>
        </div>

      </div>
    </section>
  );
}

export default Projects;