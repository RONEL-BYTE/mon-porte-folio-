import { useEffect, useState } from "react";
import "./Contact.css";
import { getProfile } from "../services/profileService";
import { apiFetch } from "../services/api";

function Contact() {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((error) => {
        console.error("Erreur récupération profil :", error);
      });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus("sending");

    try {
      const response = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi");
      }

      setStatus("success");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Erreur formulaire contact :", error);
      setStatus(error.message || "error");
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">

        <div className="contact-heading">

          <div className="stitch-section-label">
            <span>06 // Get in Touch</span>
            <i></i>
          </div>

          <h2>
            Let's build
            <br />
            <span>something great.</span>
          </h2>

          <p>
            Have a project in mind, a question, or just want to connect?
            Feel free to reach out.
          </p>

        </div>

        <div className="contact-content">

          <div className="contact-info">

            <div className="contact-info-item">
              <span className="contact-label">EMAIL</span>

              <a href="mailto:ronelngompe@gmail.com">
                ronelngompe@gmail.com
              </a>
            </div>

            <div className="contact-info-item">
              <span className="contact-label">LOCATION</span>

              <p>
                {profile?.location || "Cameroon"}
              </p>
            </div>

            <div className="contact-socials">

              <span className="contact-label">
                SOCIAL
              </span>

              <div className="social-links">

                {profile?.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    GH
                  </a>
                )}

                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    LI
                  </a>
                )}

                {profile?.whatsapp_url && (
                  <a
                    href={profile.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    WA
                  </a>
                )}

                {profile?.telegram_url && (
                  <a
                    href={profile.telegram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                  >
                    TG
                  </a>
                )}

              </div>

            </div>

          </div>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="name">YOUR NAME</label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">EMAIL ADDRESS</label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

            </div>

            <div className="form-group">
              <label htmlFor="subject">SUBJECT</label>

              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Project inquiry"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">MESSAGE</label>

              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell me about your project..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="contact-submit"
              disabled={status === "sending"}
            >
              {status === "sending"
                ? "SENDING..."
                : "SEND MESSAGE"}

              <span>→</span>
            </button>

            {status === "success" && (
              <p className="contact-success">
                Message sent successfully ✓
              </p>
            )}

            {status !== "success" && status !== "sending" && status !== "" && (
              <p className="contact-error">
                {status === "error"
                  ? "Unable to send the message. Please try again."
                  : status}
              </p>
            )}

          </form>

        </div>

      </div>
    </section>
  );
}

export default Contact;