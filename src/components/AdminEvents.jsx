import { useEffect, useState } from "react";
import "./AdminEvents.css";
import { apiFetch } from "../services/api";

function AdminEvents() {
  const [events, setEvents] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    event_date: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // RÉCUPÉRER LES ÉVÉNEMENTS
  // ============================================================

  const loadEvents = async () => {
    try {
      const response = await apiFetch("/api/events");
      const data = await response.json();

      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération événements :", error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ============================================================
  // GÉRER LES CHAMPS
  // ============================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ============================================================
  // AJOUTER / MODIFIER
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Le titre est obligatoire");
      return;
    }

    setLoading(true);

    try {
      const url = editingId
        ? `/api/events/${editingId}`
        : "/api/events";

      const method = editingId ? "PATCH" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Une erreur est survenue");
        return;
      }

      alert(
        editingId
          ? "Événement modifié avec succès"
          : "Événement ajouté avec succès"
      );

      setForm({
        title: "",
        description: "",
        image_url: "",
        event_date: ""
      });

      setEditingId(null);

      loadEvents();

    } catch (error) {
      console.error("Erreur événement :", error);
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MODIFIER
  // ============================================================

  const handleEdit = (event) => {
    setEditingId(event.id);

    setForm({
      title: event.title || "",
      description: event.description || "",
      image_url: event.image_url || "",
      event_date: event.event_date
        ? event.event_date.slice(0, 16)
        : ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // ============================================================
  // ANNULER MODIFICATION
  // ============================================================

  const cancelEdit = () => {
    setEditingId(null);

    setForm({
      title: "",
      description: "",
      image_url: "",
      event_date: ""
    });
  };

  // ============================================================
  // SUPPRIMER
  // ============================================================

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cet événement ?"
    );

    if (!confirmation) return;

    try {
      const response = await apiFetch(
        `/api/events/${id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erreur lors de la suppression");
        return;
      }

      loadEvents();

    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Erreur de connexion au serveur");
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "Date non définie";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="admin-events">

      {/* HEADER */}

      <div className="admin-events-header">
        <div>
          <span className="admin-events-label">
            ADMINISTRATION
          </span>

          <h1>
            {editingId
              ? "Modifier l'événement"
              : "Ajouter un événement"}
          </h1>

          <p>
            Gérez les événements affichés sur votre portfolio.
          </p>
        </div>
      </div>


      {/* FORMULAIRE */}

      <div className="admin-events-form-card">

        <form onSubmit={handleSubmit}>

          <div className="admin-form-group">
            <label>Titre</label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex : Hackathon 2026"
            />
          </div>


          <div className="admin-form-group">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Décrivez l'événement..."
              rows="5"
            />
          </div>


          <div className="admin-form-row">

            <div className="admin-form-group">
              <label>Image</label>

              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>


            <div className="admin-form-group">
              <label>Date</label>

              <input
                type="datetime-local"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
              />
            </div>

          </div>


          <div className="admin-event-form-actions">

            <button
              type="submit"
              disabled={loading}
              className="admin-event-submit"
            >
              {loading
                ? "Enregistrement..."
                : editingId
                ? "Enregistrer les modifications"
                : "Ajouter l'événement"}
            </button>


            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="admin-event-cancel"
              >
                Annuler
              </button>
            )}

          </div>

        </form>

      </div>


      {/* LISTE */}

      <div className="admin-events-list">

        <div className="admin-events-list-header">
          <h2>Mes événements</h2>

          <span>
            {events.length} événement
            {events.length > 1 ? "s" : ""}
          </span>
        </div>


        {events.length === 0 ? (

          <div className="admin-events-empty">
            <h3>Aucun événement</h3>

            <p>
              Ajoutez votre premier événement avec le formulaire
              ci-dessus.
            </p>
          </div>

        ) : (

          <div className="admin-events-grid">

            {events.map((event) => (

              <article
                className="admin-event-card"
                key={event.id}
              >

                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="admin-event-image"
                  />
                ) : (
                  <div className="admin-event-image-placeholder">
                    EVENT
                  </div>
                )}


                <div className="admin-event-content">

                  <span className="admin-event-date">
                    {formatDate(event.event_date)}
                  </span>

                  <h3>{event.title}</h3>

                  <p>
                    {event.description ||
                      "Aucune description."}
                  </p>


                  <div className="admin-event-actions">

                    <button
                      onClick={() => handleEdit(event)}
                      className="admin-event-edit"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="admin-event-delete"
                    >
                      Supprimer
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminEvents;