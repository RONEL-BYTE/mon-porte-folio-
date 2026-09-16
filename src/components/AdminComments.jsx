import { useEffect, useState } from "react";
import "./AdminComments.css";
import { apiFetch } from "../services/api";

function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const chargerCommentaires = async () => {
    try {
      const response = await apiFetch("/api/comments");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerCommentaires();
  }, []);

  const supprimerCommentaire = async (id) => {
    if (!window.confirm("Supprimer ce commentaire ?")) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/comments/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setComments((anciens) =>
          anciens.filter((commentaire) => commentaire.id !== id)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="admin-comments-loading">Chargement...</div>;
  }

  return (
    <div className="admin-comments">

      <div className="admin-comments-header">
        <div>
          <span className="admin-section-label">MODÉRATION</span>
          <h1>Commentaires</h1>
          <p>
            Gérez les commentaires laissés sur vos publications.
          </p>
        </div>

        <div className="comments-total">
          <strong>{comments.length}</strong>
          <span>commentaires</span>
        </div>
      </div>

      <div className="comments-admin-list">

        {comments.length === 0 ? (
          <div className="no-admin-comments">
            <span>💬</span>
            <h3>Aucun commentaire</h3>
            <p>
              Les commentaires de vos publications apparaîtront ici.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <article
              className="admin-comment-card"
              key={comment.id}
            >
              <div className="admin-comment-avatar">
                {comment.author_name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="admin-comment-content">

                <div className="admin-comment-top">
                  <div>
                    <h3>{comment.author_name}</h3>

                    <span>
                      {new Date(
                        comment.created_at
                      ).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <span
                    className={
                      comment.approved
                        ? "comment-approved"
                        : "comment-hidden"
                    }
                  >
                    {comment.approved
                      ? "Visible"
                      : "Masqué"}
                  </span>
                </div>

                <p className="admin-comment-text">
                  {comment.content}
                </p>

                <div className="admin-comment-actions">


                  <button
  className="toggle-comment"
  onClick={async () => {
    try {
      const response = await apiFetch(
        `/api/comments/${comment.id}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved: !comment.approved,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setComments((anciens) =>
          anciens.map((c) =>
            c.id === comment.id
              ? {
                  ...c,
                  approved: data.comment.approved,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }}
>
  {comment.approved ? "🚫 Masquer" : "👁 Afficher"}
</button>

                  <button
                    className="delete-comment"
                    onClick={() =>
                      supprimerCommentaire(comment.id)
                    }
                  >
                    🗑 Supprimer
                  </button>

                </div>

              </div>
            </article>
          ))
        )}

      </div>
    </div>
  );
}

export default AdminComments;