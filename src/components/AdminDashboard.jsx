import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { apiFetch } from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  // ============================================================
  // ÉTAT DES STATISTIQUES
  // ============================================================

  const [stats, setStats] = useState({
    projects: 0,
    publications: 0,
    comments: 0,
    likes: 0,
    views: 0,
    messagesUnread: 0
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);


  // ============================================================
  // RÉCUPÉRER LES DONNÉES DU DASHBOARD
  // ============================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // ------------------------------------------
        // STATISTIQUES
        // ------------------------------------------

        const statsResponse = await apiFetch(
          "/api/admin/stats"
        );

        const statsData = await statsResponse.json();

        if (statsData.success) {
          setStats(statsData.stats);
        }


        // ------------------------------------------
        // PROJETS
        // ------------------------------------------

        const projectsResponse = await apiFetch(
          "/api/projects"
        );

        const projectsData = await projectsResponse.json();

        if (Array.isArray(projectsData)) {
          setProjects(projectsData);
        }

        // ------------------------------------------
        // MESSAGES NON LUS
        // ------------------------------------------

        const messagesResponse = await apiFetch(
          "/api/messages"
        );

        const messagesData = await messagesResponse.json();

        if (messagesData.success && Array.isArray(messagesData.messages)) {
          setStats((current) => ({
            ...current,
            messagesUnread: messagesData.messages.filter(
              (message) => !message.read
            ).length
          }));
        }

      } catch (error) {
        console.error(
          "Erreur récupération dashboard :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  // ============================================================
  // DÉCONNEXION
  // ============================================================

  const handleLogout = async () => {
    try {
      await apiFetch("/api/admin/logout", { method: "POST" });
    } finally {
      navigate("/admin");
    }
  };


  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="admin-dashboard">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-logo">
          <div className="admin-logo-icon">
            RN
          </div>

          <div>
            <h2>Ronel Admin</h2>
            <span>Portfolio Dashboard</span>
          </div>
        </div>


        {/* MENU */}

        <nav className="admin-nav">

          <button
            className="sidebar-link active"
            onClick={() => navigate("/admin/dashboard")}
          >
            <span>📊</span>
            Dashboard
          </button>


          <button
            className="sidebar-link"
            onClick={() => navigate("/admin/projects")}
          >
            <span>💼</span>
            Projets
          </button>


          <button
            className="sidebar-link"
            onClick={() => navigate("/admin/publications")}
          >
            <span>📝</span>
            Publications
          </button>


          <button
            className="sidebar-link"
            onClick={() => navigate("/admin/comments")}
          >
            <span>💬</span>
            Commentaires
          </button>


          <button
            className="sidebar-link"
            onClick={() => navigate("/admin/messages")}
          >
            <span>✉️</span>
            Messages
            {stats.messagesUnread > 0 && (
              <strong className="sidebar-badge">
                {stats.messagesUnread}
              </strong>
            )}
          </button>


          <button
            className="sidebar-link"
            onClick={() => navigate("/admin/skills")}
          >
            <span>⚡</span>
            Compétences
          </button>
           <button
  className="sidebar-link"
  onClick={() => navigate("/admin/profile")}
>
  👤 Mon profil
</button>
        </nav>


        {/* BAS SIDEBAR */}

        <div className="sidebar-bottom">

          <button
            className="sidebar-link"
            onClick={() => navigate("/")}
          >
            <span>🌐</span>
            Voir le portfolio
          </button>


          <button
            className="sidebar-link logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            Déconnexion
          </button>

        </div>

      </aside>


      {/* ======================================================
          CONTENU PRINCIPAL
      ====================================================== */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Bienvenue dans votre espace d'administration.
            </p>
          </div>


          <div className="admin-user">

            <div className="admin-avatar">
              RN
            </div>

            <div>
              <strong>Ronel Ngompe</strong>
              <span>Administrateur</span>
            </div>

          </div>

        </header>


        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <section className="stats-grid">


          {/* PROJETS */}

          <div className="stat-card">

            <div className="stat-icon">
              💼
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Projets
              </span>

              <strong>
                {loading ? "..." : stats.projects}
              </strong>

            </div>

          </div>


          {/* MESSAGES NON LUS */}

          <div
            className="stat-card stat-card-clickable"
            onClick={() => navigate("/admin/messages")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate("/admin/messages");
              }
            }}
          >

            <div className="stat-icon">
              ✉️
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Messages non lus
              </span>

              <strong>
                {loading ? "..." : stats.messagesUnread}
              </strong>

            </div>

          </div>


          {/* VUES */}

          <div className="stat-card">

            <div className="stat-icon">
              👁️
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Vues
              </span>

              <strong>
                {loading ? "..." : stats.views}
              </strong>

            </div>

          </div>


          {/* LIKES */}

          <div className="stat-card">

            <div className="stat-icon">
              ❤️
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Likes
              </span>

              <strong>
                {loading ? "..." : stats.likes}
              </strong>

            </div>

          </div>


          {/* PUBLICATIONS */}

          <div className="stat-card">

            <div className="stat-icon">
              📝
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Publications
              </span>

              <strong>
                {loading ? "..." : stats.publications}
              </strong>

            </div>

          </div>

        </section>


        {/* ==================================================
            ACTIONS RAPIDES
        ================================================== */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <h2>Actions rapides</h2>

              <p>
                Gérez rapidement votre portfolio.
              </p>
            </div>

          </div>


          <div className="quick-actions">


            <button
              className="quick-action"
              onClick={() => navigate("/admin/projects")}
            >
              <span>➕</span>

              <div>
                <strong>
                  Ajouter un projet
                </strong>

                <small>
                  Synchroniser GitHub / Netlify
                </small>
              </div>

            </button>


            <button
              className="quick-action"
              onClick={() => navigate("/admin/publications")}
            >
              <span>📝</span>

              <div>
                <strong>
                  Nouvelle publication
                </strong>

                <small>
                  Publier une actualité
                </small>
              </div>

            </button>


            <button
              className="quick-action"
              onClick={() => navigate("/admin/comments")}
            >
              <span>💬</span>

              <div>
                <strong>
                  Modérer les commentaires
                </strong>

                <small>
                  Voir et gérer les commentaires
                </small>
              </div>

            </button>


            <button
              className="quick-action"
              onClick={() => navigate("/admin/skills")}
            >
              <span>⚡</span>

              <div>
                <strong>
                  Gérer les compétences
                </strong>

                <small>
                  Technologies et niveaux
                </small>
              </div>

            </button>

          </div>

        </section>


        {/* ==================================================
            PROJETS RÉCENTS
        ================================================== */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <h2>Projets récents</h2>

              <p>
                Les derniers projets synchronisés.
              </p>
            </div>


            <button
              className="view-all-btn"
              onClick={() => navigate("/admin/projects")}
            >
              Voir tous
            </button>

          </div>


          <div className="recent-projects">

            {loading ? (

              <div className="empty-state">
                Chargement des projets...
              </div>

            ) : projects.length === 0 ? (

              <div className="empty-state">
                Aucun projet disponible.
              </div>

            ) : (

              projects.slice(0, 5).map((project) => (

                <div
                  className="recent-project"
                  key={project.id}
                >

                  {/* IMAGE */}

                  <div className="recent-project-image">

                    {project.image_url ? (

                      <img
                        src={project.image_url}
                        alt={project.name}
                      />

                    ) : (

                      <div className="project-placeholder">
                        💻
                      </div>

                    )}

                  </div>


                  {/* INFOS */}

                  <div className="recent-project-info">

                    <h3>
                      {project.name}
                    </h3>

                    <p>
                      {project.description ||
                        "Aucune description"}
                    </p>


                    {/* TECHNOLOGIES */}

                    <div className="project-techs">

                      {(project.technologies || [])
                        .slice(0, 4)
                        .map((tech, index) => (

                          <span key={index}>
                            {tech}
                          </span>

                        ))}

                    </div>

                  </div>


                  {/* LIENS */}

                  <div className="recent-project-actions">

                    {project.github_url && (

                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </a>

                    )}

                    {project.netlify_url && (

                      <a
                        href={project.netlify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live
                      </a>

                    )}

                  </div>

                </div>

              ))

            )}

          </div>

        </section>


        {/* ==================================================
            ACTIVITÉ RÉCENTE
        ================================================== */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <h2>Activité récente</h2>

              <p>
                Résumé de l'activité de votre portfolio.
              </p>
            </div>

          </div>


          <div className="activity-list">


            {/* PROJETS */}

            <div className="activity-item">

              <div className="activity-icon">
                💼
              </div>

              <div>

                <strong>
                  {stats.projects} projet
                  {stats.projects > 1 ? "s" : ""}
                </strong>

                <p>
                  actuellement enregistré
                  {stats.projects > 1 ? "s" : ""}
                  dans le portfolio.
                </p>

              </div>

            </div>


            {/* PUBLICATIONS */}

            <div className="activity-item">

              <div className="activity-icon">
                📝
              </div>

              <div>

                <strong>
                  {stats.publications} publication
                  {stats.publications > 1 ? "s" : ""}
                </strong>

                <p>
                  publiée
                  {stats.publications > 1 ? "s" : ""}
                  sur le portfolio.
                </p>

              </div>

            </div>


            {/* COMMENTAIRES */}

            <div className="activity-item">

              <div className="activity-icon">
                💬
              </div>

              <div>

                <strong>
                  {stats.comments} commentaire
                  {stats.comments > 1 ? "s" : ""}
                </strong>

                <p>
                  commentaire
                  {stats.comments > 1 ? "s" : ""}
                  enregistré
                  {stats.comments > 1 ? "s" : ""}.
                </p>

              </div>

            </div>


            {/* VUES */}

            <div className="activity-item">

              <div className="activity-icon">
                👁️
              </div>

              <div>

                <strong>
                  {stats.views} vue
                  {stats.views > 1 ? "s" : ""}
                </strong>

                <p>
                  vue
                  {stats.views > 1 ? "s" : ""}
                  enregistrée
                  {stats.views > 1 ? "s" : ""}.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;