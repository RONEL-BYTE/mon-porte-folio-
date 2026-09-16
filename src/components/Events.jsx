import { useEffect, useState } from "react";
import "./Events.css";
import { apiFetch } from "../services/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RÉCUPÉRER LES ÉVÉNEMENTS
  // ============================================================

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiFetch("/api/events");

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des événements");
        }

        const data = await response.json();

        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur Events :", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date)
      .toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <section id="events" className="events-section">

      {/* HEADER */}

      <div className="events-header">

        <div>

          <div className="stitch-section-label">
            <span>04 // Events & Activities</span>
            <i></i>
          </div>

          <h2>Events & Activities</h2>

          <p>
            Conferences, workshops, meetups, and moments from my developer
            journey.
          </p>

        </div>

        <a href="#events" className="events-view-all">
          View all events <span>→</span>
        </a>

      </div>


      {/* CONTENU */}

      {loading ? (

        <div className="events-loading">
          Loading events...
        </div>

      ) : events.length === 0 ? (

        <div className="events-empty">
          <h3>No events yet</h3>

          <p>
            New events and activities will appear here soon.
          </p>
        </div>

      ) : (

        <div className="events-grid">

          {events.map((event) => (

            <article
              className="event-card"
              key={event.id}
            >

              {/* IMAGE */}

              <div className="event-image">

                {event.image_url ? (

                  <img
                    src={event.image_url}
                    alt={event.title}
                  />

                ) : (

                  <div className="event-image-placeholder">
                    EVENT
                  </div>

                )}

                <span className="event-date">
                  {formatDate(event.event_date)}
                </span>

              </div>


              {/* CONTENU */}

              <div className="event-content">

                <span className="event-type">
                  EVENT
                </span>

                <h3>
                  {event.title}
                </h3>

                <p>
                  {event.description ||
                    "No description available."}
                </p>


                <div className="event-footer">

                  <span>
                    📍 Cameroon
                  </span>

                  <span>
                    →
                  </span>

                </div>

              </div>

            </article>

          ))}

        </div>

      )}

    </section>
  );
}

export default Events;