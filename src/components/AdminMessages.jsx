import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./AdminMessages.css";
import { apiFetch } from "../services/api";

const API_URL = "/api/messages";

function formatMessageDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Impossible de charger les messages");
      }

      setMessages(data.messages || []);
    } catch (requestError) {
      console.error("Erreur récupération messages :", requestError);
      setError(requestError.message || "Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markAsRead = async (messageId) => {
    try {
      setActionError("");

      const response = await apiFetch(`${API_URL}/${messageId}/read`, {
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Impossible de marquer le message");
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? { ...message, read: true } : message
        )
      );
      setSelectedMessage((currentMessage) =>
        currentMessage?.id === messageId
          ? { ...currentMessage, read: true }
          : currentMessage
      );
    } catch (requestError) {
      console.error("Erreur lecture message :", requestError);
      setActionError(requestError.message || "Action impossible");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Supprimer ce message ?")) {
      return;
    }

    try {
      setActionError("");

      const response = await apiFetch(`${API_URL}/${messageId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Impossible de supprimer le message");
      }

      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== messageId)
      );
      setSelectedMessage((currentMessage) =>
        currentMessage?.id === messageId ? null : currentMessage
      );
    } catch (requestError) {
      console.error("Erreur suppression message :", requestError);
      setActionError(requestError.message || "Action impossible");
    }
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
  };

  const unreadCount = messages.filter((message) => !message.read).length;

  return (
    <div className="admin-messages-layout">
      <AdminSidebar />

      <main className="admin-messages-page">
        <header className="admin-messages-header">
          <div>
            <span className="admin-messages-label">COMMUNICATION</span>
            <h1>Messages</h1>
            <p>Retrouvez les demandes envoyées depuis votre portfolio.</p>
          </div>

          <div className="messages-total">
            <strong>{unreadCount}</strong>
            <span>non lu{unreadCount > 1 ? "s" : ""}</span>
          </div>
        </header>

        {actionError && (
          <div className="messages-alert messages-alert-error" role="alert">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="messages-state">Chargement des messages...</div>
        ) : error ? (
          <div className="messages-state messages-state-error" role="alert">
            <strong>Impossible de charger les messages</strong>
            <p>{error}</p>
            <button type="button" onClick={loadMessages}>
              Réessayer
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-state">
            <span className="messages-state-icon">✉</span>
            <strong>Aucun message</strong>
            <p>Les demandes de contact apparaîtront ici.</p>
          </div>
        ) : (
          <section className="messages-list" aria-label="Liste des messages">
            {messages.map((message) => (
              <article
                className={`message-card ${message.read ? "" : "message-card-unread"}`}
                key={message.id}
              >
                <div className="message-card-marker" aria-hidden="true" />

                <div className="message-card-content">
                  <div className="message-card-header">
                    <div>
                      <div className="message-sender-line">
                        <h2>{message.name}</h2>
                        {!message.read && <span className="unread-badge">Nouveau</span>}
                      </div>
                      <a href={`mailto:${message.email}`}>{message.email}</a>
                    </div>
                    <time dateTime={message.created_at}>
                      {formatMessageDate(message.created_at)}
                    </time>
                  </div>

                  <h3>{message.subject}</h3>
                  <p className="message-preview">{message.message}</p>

                  <div className="message-actions">
                    <button
                      className="message-open-button"
                      type="button"
                      onClick={() => openMessage(message)}
                    >
                      Lire le message
                    </button>
                    {!message.read && (
                      <button
                        className="message-read-button"
                        type="button"
                        onClick={() => markAsRead(message.id)}
                      >
                        Marquer comme lu
                      </button>
                    )}
                    <button
                      className="message-delete-button"
                      type="button"
                      onClick={() => deleteMessage(message.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {selectedMessage && (
        <div
          className="message-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedMessage(null)}
        >
          <section
            className="message-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-header">
              <div>
                <span className="admin-messages-label">MESSAGE REÇU</span>
                <h2 id="message-modal-title">{selectedMessage.subject}</h2>
              </div>
              <button
                className="message-close-button"
                type="button"
                aria-label="Fermer le message"
                onClick={() => setSelectedMessage(null)}
              >
                ×
              </button>
            </div>

            <div className="message-modal-meta">
              <strong>{selectedMessage.name}</strong>
              <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
              <time dateTime={selectedMessage.created_at}>
                {formatMessageDate(selectedMessage.created_at)}
              </time>
            </div>

            <p className="message-full-content">{selectedMessage.message}</p>

            <div className="message-modal-actions">
              {!selectedMessage.read && (
                <button
                  className="message-read-button"
                  type="button"
                  onClick={() => markAsRead(selectedMessage.id)}
                >
                  Marquer comme lu
                </button>
              )}
              <button
                className="message-delete-button"
                type="button"
                onClick={() => deleteMessage(selectedMessage.id)}
              >
                Supprimer
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminMessages;
