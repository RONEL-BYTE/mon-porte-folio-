

import { useEffect, useState } from "react";
import "./Publications.css";
import { apiFetch } from "../services/api";

function Publications() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LIKES
  // ============================================================

  const [likedPublications, setLikedPublications] = useState(() => {
    const saved = localStorage.getItem("likedPublications");

    return saved ? JSON.parse(saved) : [];
  });

  // ============================================================
  // COMMENTAIRES
  // ============================================================

  // Stocke les commentaires par publication
  const [comments, setComments] = useState({});

  // Permet de savoir quels commentaires sont ouverts
  const [commentOpen, setCommentOpen] = useState({});

  // Nom saisi par le visiteur
  const [commentNames, setCommentNames] = useState({});

  // Texte du commentaire
  const [commentTexts, setCommentTexts] = useState({});

  // Chargement des commentaires
  const [commentLoading, setCommentLoading] = useState({});

  // ============================================================
  // CHARGER LES PUBLICATIONS
  // ============================================================

  useEffect(() => {
    chargerPublications();
  }, []);

  const chargerPublications = async () => {
    try {
      const response = await apiFetch("/api/publications");

      if (!response.ok) {
        throw new Error("Erreur API");
      }

      const data = await response.json();

      setPublications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des publications :",
        error
      );

      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ENREGISTRER UNE VUE
  // ============================================================

  const enregistrerVue = async (publicationId) => {
    try {
      const vuesEnregistrees = JSON.parse(
        sessionStorage.getItem("publicationsVues") || "[]"
      );

      // Si déjà vue pendant cette session
      if (vuesEnregistrees.includes(publicationId)) {
        return;
      }

      const response = await apiFetch(
        `/api/publications/${publicationId}/view`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer la vue");
      }

      const data = await response.json();

      if (!data.success) {
        return;
      }

      // Mettre à jour le compteur
      setPublications((anciennesPublications) =>
        anciennesPublications.map((publication) =>
          publication.id === publicationId
            ? {
                ...publication,
                views: data.views,
              }
            : publication
        )
      );

      // Mémoriser la vue
      const nouvellesVues = [
        ...vuesEnregistrees,
        publicationId,
      ];

      sessionStorage.setItem(
        "publicationsVues",
        JSON.stringify(nouvellesVues)
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement de la vue :",
        error
      );
    }
  };

  // ============================================================
  // ENREGISTRER LES VUES APRÈS LE CHARGEMENT
  // ============================================================

  useEffect(() => {
    if (publications.length === 0) {
      return;
    }

    publications.forEach((publication) => {
      enregistrerVue(publication.id);
    });
  }, [publications.length]);

  // ============================================================
  // LIKE
  // ============================================================

  const likerPublication = async (publicationId) => {
    // Déjà likée
    if (likedPublications.includes(publicationId)) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/publications/${publicationId}/like`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible d'ajouter le like");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Erreur lors du like"
        );
      }

      // Mettre à jour le compteur
      setPublications((anciennesPublications) =>
        anciennesPublications.map((publication) =>
          publication.id === publicationId
            ? {
                ...publication,
                likes: data.likes,
              }
            : publication
        )
      );

      // Ajouter la publication aux publications likées
      const nouvellesPublicationsLikees = [
        ...likedPublications,
        publicationId,
      ];

      setLikedPublications(nouvellesPublicationsLikees);

      // Sauvegarder dans le navigateur
      localStorage.setItem(
        "likedPublications",
        JSON.stringify(nouvellesPublicationsLikees)
      );
    } catch (error) {
      console.error(
        "Erreur lors du Like :",
        error
      );
    }
  };

  // ============================================================
  // CHARGER LES COMMENTAIRES
  // ============================================================

  const chargerCommentaires = async (publicationId) => {
    try {
      setCommentLoading((anciens) => ({
        ...anciens,
        [publicationId]: true,
      }));

      const response = await apiFetch(
        `/api/publications/${publicationId}/comments`
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les commentaires"
        );
      }

      const data = await response.json();

      setComments((anciens) => ({
        ...anciens,
        [publicationId]: Array.isArray(data)
          ? data
          : [],
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des commentaires :",
        error
      );

      setComments((anciens) => ({
        ...anciens,
        [publicationId]: [],
      }));
    } finally {
      setCommentLoading((anciens) => ({
        ...anciens,
        [publicationId]: false,
      }));
    }
  };

  // ============================================================
  // OUVRIR / FERMER LES COMMENTAIRES
  // ============================================================

  const afficherCommentaires = (publicationId) => {
    const actuellementOuvert =
      commentOpen[publicationId];

    setCommentOpen((anciens) => ({
      ...anciens,
      [publicationId]: !actuellementOuvert,
    }));

    // Charger les commentaires uniquement à la première ouverture
    if (
      !actuellementOuvert &&
      !comments[publicationId]
    ) {
      chargerCommentaires(publicationId);
    }
  };

  // ============================================================
  // AJOUTER UN COMMENTAIRE
  // ============================================================

  const ajouterCommentaire = async (publicationId) => {
    const authorName =
      commentNames[publicationId]?.trim() || "";

    const content =
      commentTexts[publicationId]?.trim() || "";

    // Vérifier le nom
    if (!authorName) {
      alert("Veuillez entrer votre nom.");
      return;
    }

    // Vérifier le commentaire
    if (!content) {
      alert("Veuillez écrire un commentaire.");
      return;
    }

    try {
      const response = await apiFetch(
        `/api/publications/${publicationId}/comments`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            author_name: authorName,
            content: content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Impossible d'ajouter le commentaire"
        );
      }

      // Ajouter immédiatement le commentaire à l'écran
      setComments((anciens) => ({
        ...anciens,

        [publicationId]: [
          ...(anciens[publicationId] || []),
          data.comment,
        ],
      }));
setPublications((anciennesPublications) =>
  anciennesPublications.map((publication) =>
    publication.id === publicationId
      ? {
          ...publication,
          comment_count:
            (publication.comment_count || 0) + 1,
        }
      : publication
  )
);
      // Vider le nom
      setCommentNames((anciens) => ({
        ...anciens,
        [publicationId]: "",
      }));


      // Vider le commentaire
      setCommentTexts((anciens) => ({
        ...anciens,
        [publicationId]: "",
      }));
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout du commentaire :",
        error
      );

      alert(
        "Impossible d'ajouter le commentaire."
      );
    }
  };

  // ============================================================
  // PARTAGER
  // ============================================================

  const partagerPublication = async (publication) => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: publication.title,
          text: publication.content,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);

        alert(
          "Lien copié dans le presse-papiers !"
        );
      }
    } catch (error) {
      console.log(
        "Partage annulé :",
        error
      );
    }
  };

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <section
      id="publications"
      className="stitch-publications"
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="publications-header">
        <div>
          <div className="stitch-section-label">
            <span>03 // Activity Stream</span>
            <i></i>
          </div>

          <h2>Latest Publications</h2>

          <p>
            Thoughts, technical discoveries, and
            updates from my development journey.
          </p>
        </div>

        <a
          href="#publications"
          className="publications-view-all"
        >
          View all publications
          <span>→</span>
        </a>
      </div>

      {/* ======================================================
          CHARGEMENT
      ====================================================== */}

      {loading && (
        <div className="publication-loading">
          Chargement des publications...
        </div>
      )}

      {/* ======================================================
          AUCUNE PUBLICATION
      ====================================================== */}

      {!loading &&
        publications.length === 0 && (
          <div className="publication-empty">
            <p>
              Aucune publication pour le moment.
            </p>
          </div>
        )}

      {/* ======================================================
          LISTE DES PUBLICATIONS
      ====================================================== */}

      {!loading &&
        publications.length > 0 && (
          <div className="publication-feed">
            {publications.map((publication) => {
              const dejaLikee =
                likedPublications.includes(
                  publication.id
                );

              const publicationComments =
                comments[publication.id] || [];

              const commentairesOuverts =
                commentOpen[publication.id];

              return (
                <article
                  className="publication-card"
                  key={publication.id}
                >
                  {/* ==================================================
                      AUTEUR
                  ================================================== */}

                  <div className="publication-author">
                    <div className="publication-avatar">
                      RN
                    </div>

                    <div className="publication-author-info">
                      <div>
                        <strong>
                          Ronel Ngompe
                        </strong>

                        <span className="publication-role">
                          Full-Stack Developer
                        </span>
                      </div>

                      <small>
                        {new Date(
                          publication.created_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}
                      </small>
                    </div>
                  </div>

                  {/* ==================================================
                      CONTENU
                  ================================================== */}

                  <div className="publication-content">
                    {/* TITRE */}

                    {publication.title && (
                      <h3>
                        {publication.title}
                      </h3>
                    )}

                    {/* TEXTE */}

                    <p className="publication-text">
                      {publication.content}
                    </p>

                    {/* IMAGE */}

                    {publication.image_url && (
                      <div className="publication-image-wrapper">
                        <img
                          src={publication.image_url}
                          alt={
                            publication.title ||
                            "Publication"
                          }
                          className="publication-image"
                        />
                      </div>
                    )}

                    {/* VIDEO */}

                    {publication.video_url && (
                      <div className="publication-video">
                        <video
                          src={publication.video_url}
                          controls
                          preload="metadata"
                        />
                      </div>
                    )}

                    {/* TECHNOLOGIES */}

                    {publication.technologies &&
                      publication.technologies.length >
                        0 && (
                        <div className="publication-tags">
                          {publication.technologies.map(
                            (technology, index) => (
                              <span key={index}>
                                {technology}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="publication-actions">
                    <div className="publication-reactions">
                      {/* LIKE */}

                      <button
                        type="button"
                        onClick={() =>
                          likerPublication(
                            publication.id
                          )
                        }
                        disabled={dejaLikee}
                        className={
                          dejaLikee
                            ? "liked-button"
                            : ""
                        }
                        aria-label="J'aime"
                      >
                        {dejaLikee
                          ? "♥"
                          : "♡"}

                        <span>
                          {publication.likes || 0}
                        </span>
                      </button>

                      {/* VUES */}

                      <button
                        type="button"
                        aria-label="Nombre de vues"
                      >
                        👁️

                        <span>
                          {publication.views || 0}
                        </span>
                      </button>

                      {/* COMMENTAIRES */}

                      <button
                        type="button"
                        onClick={() =>
                          afficherCommentaires(
                            publication.id
                          )
                        }
                        aria-label="Commentaires"
                      >
                        💬

                        <span>
                          {publicationComments.length}
                        </span>
                      </button>

                      {/* PARTAGER */}

                      <button
                        type="button"
                        onClick={() =>
                          partagerPublication(
                            publication
                          )
                        }
                        aria-label="Partager"
                      >
                        ↗

                        <span>
                          Share
                        </span>
                      </button>
                    </div>

                    {/* BOOKMARK */}

                    <button
                      type="button"
                      className="bookmark-button"
                      aria-label="Bookmark publication"
                    >
                      ♡
                    </button>
                  </div>

                  {/* ==================================================
                      COMMENTAIRES
                  ================================================== */}

                  {commentairesOuverts && (
                    <div className="publication-comments">
                      <h4>
                        Commentaires
                      </h4>

                      {/* CHARGEMENT */}

                      {commentLoading[
                        publication.id
                      ] && (
                        <p className="comments-loading">
                          Chargement des commentaires...
                        </p>
                      )}

                      {/* LISTE */}

                      {!commentLoading[
                        publication.id
                      ] &&
                        publicationComments.length ===
                          0 && (
                          <p className="comments-empty">
                            Aucun commentaire pour le moment.
                          </p>
                        )}

                      {!commentLoading[
                        publication.id
                      ] &&
                        publicationComments.length >
                          0 && (
                          <div className="comments-list">
                            {publicationComments.map(
                              (comment) => (
                                <div
                                  className="comment-item"
                                  key={comment.id}
                                >
                                  <div className="comment-avatar">
                                    {comment.author_name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div className="comment-body">
                                    <strong>
                                      {
                                        comment.author_name
                                      }
                                    </strong>

                                    <p>
                                      {comment.content}
                                    </p>

                                    <small>
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleDateString(
                                        "fr-FR"
                                      )}
                                    </small>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                      {/* FORMULAIRE */}

                      <div className="comment-form">
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={
                            commentNames[
                              publication.id
                            ] || ""
                          }
                          onChange={(e) =>
                            setCommentNames(
                              (anciens) => ({
                                ...anciens,
                                [publication.id]:
                                  e.target.value,
                              })
                            )
                          }
                        />

                        <textarea
                          placeholder="Écrire un commentaire..."
                          rows="3"
                          value={
                            commentTexts[
                              publication.id
                            ] || ""
                          }
                          onChange={(e) =>
                            setCommentTexts(
                              (anciens) => ({
                                ...anciens,
                                [publication.id]:
                                  e.target.value,
                              })
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            ajouterCommentaire(
                              publication.id
                            )
                          }
                        >
                          Publier le commentaire
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
    </section>
  );
}

export default Publications;