import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./AdminPublications.css";
import { apiFetch } from "../services/api";

function AdminPublications() {
  const [publications, setPublications] = useState([]);
  const [projects, setProjects] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [projectId, setProjectId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =====================================================
  // CHARGER LES PUBLICATIONS
  // =====================================================

  const loadPublications = async () => {
    try {
      const response = await apiFetch(
        "/api/publications"
      );

      const data = await response.json();

      setPublications(data);
    } catch (error) {
      console.error(
        "Erreur chargement publications :",
        error
      );
    }
  };

  // =====================================================
  // CHARGER LES PROJETS
  // =====================================================

  const loadProjects = async () => {
    try {
      const response = await apiFetch(
        "/api/projects"
      );

      const data = await response.json();

      setProjects(data);
    } catch (error) {
      console.error(
        "Erreur chargement projets :",
        error
      );
    }
  };

  // =====================================================
  // AU CHARGEMENT
  // =====================================================

  useEffect(() => {
    loadPublications();
    loadProjects();
  }, []);

  // =====================================================
  // CREER UNE PUBLICATION
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage("Le titre et le contenu sont obligatoires.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const technologiesArray = technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech !== "");

      const response = await apiFetch(
        "/api/publications",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl.trim() || null,
            video_url: videoUrl.trim() || null,
            technologies: technologiesArray,
            project_id: projectId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la création"
        );
      }

      setMessage("Publication créée avec succès.");

      // Réinitialiser le formulaire
      setTitle("");
      setContent("");
      setImageUrl("");
      setVideoUrl("");
      setTechnologies("");
      setProjectId("");

      // Fermer le formulaire
      setShowForm(false);

      // Recharger les publications
      loadPublications();

    } catch (error) {
      console.error(error);

      setMessage(
        error.message || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SUPPRIMER UNE PUBLICATION
  // =====================================================

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette publication ?"
    );

    if (!confirmation) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/publications/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de supprimer"
        );
      }

      loadPublications();

    } catch (error) {
      console.error(error);

      setMessage(
        error.message || "Erreur lors de la suppression."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // =====================================================
  // RENDU
  // =====================================================

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}

      <AdminSidebar />

      {/* CONTENU PRINCIPAL */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-page-header">

          <div>
            <span className="admin-eyebrow">
              CONTENT MANAGEMENT
            </span>

            <h1>Publications</h1>

            <p>
              Créez et gérez les publications de votre
              portfolio.
            </p>
          </div>

          <button
            className="add-project-button"
            onClick={() => {
              setShowForm(!showForm);
              setMessage("");
            }}
          >
            {showForm ? "× Fermer" : "+ Nouvelle publication"}
          </button>

        </header>

        {/* MESSAGE */}

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {/* =================================================
            FORMULAIRE
        ================================================= */}

        {showForm && (
          <form
            className="publication-form"
            onSubmit={handleSubmit}
          >

            <div className="form-title">
              <div>
                <span>CRÉER DU CONTENU</span>
                <h2>Nouvelle publication</h2>
              </div>
            </div>

            {/* TITRE */}

            <div className="form-group">
              <label htmlFor="title">
                Titre
              </label>

              <input
                id="title"
                type="text"
                placeholder="Ex : Mon nouveau projet React"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            {/* CONTENU */}

            <div className="form-group">
              <label htmlFor="content">
                Contenu
              </label>

              <textarea
                id="content"
                placeholder="Écrivez votre publication..."
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
              />
            </div>

            {/* IMAGE */}

            <div className="form-group">
              <label htmlFor="image">
                URL de l'image
              </label>

              <input
                id="image"
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) =>
                  setImageUrl(e.target.value)
                }
              />
            </div>

            {/* VIDEO */}

            <div className="form-group">
              <label htmlFor="video">
                URL de la vidéo
                <small> (optionnel)</small>
              </label>

              <input
                id="video"
                type="url"
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) =>
                  setVideoUrl(e.target.value)
                }
              />
            </div>

            {/* TECHNOLOGIES */}

            <div className="form-group">
              <label htmlFor="technologies">
                Technologies
              </label>

              <input
                id="technologies"
                type="text"
                placeholder="React, JavaScript, CSS"
                value={technologies}
                onChange={(e) =>
                  setTechnologies(e.target.value)
                }
              />

              <small>
                Séparez les technologies avec des virgules.
              </small>
            </div>

            {/* PROJET */}

            <div className="form-group">
              <label htmlFor="project">
                Projet associé
              </label>

              <select
                id="project"
                value={projectId}
                onChange={(e) =>
                  setProjectId(e.target.value)
                }
              >
                <option value="">
                  Aucun projet
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BOUTONS */}

            <div className="form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="publish-button"
                disabled={loading}
              >
                {loading
                  ? "Publication..."
                  : "Publier"}
              </button>

            </div>

          </form>
        )}

        {/* =================================================
            LISTE
        ================================================= */}

        <section className="publications-admin-section">

          <div className="section-heading">

            <div>
              <h2>Mes publications</h2>

              <p>
                {publications.length} publication
                {publications.length > 1 ? "s" : ""}
              </p>
            </div>

          </div>

          {publications.length === 0 ? (

            <div className="empty-publications">

              <div className="empty-icon">
                ✦
              </div>

              <h3>
                Aucune publication
              </h3>

              <p>
                Commencez par créer votre première
                publication.
              </p>

              <button
                onClick={() => setShowForm(true)}
              >
                + Créer une publication
              </button>

            </div>

          ) : (

            <div className="publication-grid">

              {publications.map((publication) => (

                <article
                  className="publication-admin-card"
                  key={publication.id}
                >

                  {/* IMAGE */}

                  {publication.image_url && (
                    <div className="publication-image">

                      <img
                        src={publication.image_url}
                        alt={publication.title}
                      />

                    </div>
                  )}

                  {/* CONTENU */}

                  <div className="publication-card-content">

                    <div className="publication-meta">
                      <span>
                        {formatDate(
                          publication.created_at
                        )}
                      </span>

                      <span className="published-status">
                        Publiée
                      </span>
                    </div>

                    <h3>
                      {publication.title}
                    </h3>

                    <p>
                      {publication.content}
                    </p>

                    {/* TECHNOLOGIES */}

                    {publication.technologies &&
                      publication.technologies.length >
                        0 && (

                        <div className="publication-technologies">

                          {publication.technologies.map(
                            (tech) => (
                              <span key={tech}>
                                {tech}
                              </span>
                            )
                          )}

                        </div>
                      )}

                    {/* PROJET */}

                    {publication.project_id && (
                      <div className="linked-project">
                        Projet associé
                      </div>
                    )}

                    {/* STATS */}

                    <div className="publication-stats">

                      <span>
                        ♡ {publication.likes || 0}
                      </span>

                      <span>
                        ◉ {publication.views || 0}
                      </span>

                    </div>

                    {/* SUPPRESSION */}

                    <button
                      className="delete-publication"
                      onClick={() =>
                        handleDelete(publication.id)
                      }
                    >
                      Supprimer
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default AdminPublications;