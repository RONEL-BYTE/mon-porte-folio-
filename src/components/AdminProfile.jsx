import { useEffect, useState } from "react";
import "./AdminProfile.css";
import { apiFetch } from "../services/api";

function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // RÉCUPÉRER LE PROFIL
  // ============================================================

  useEffect(() => {
    apiFetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur récupération profil :", error);
        setLoading(false);
      });
  }, []);

  // ============================================================
  // MODIFICATION DES CHAMPS
  // ============================================================

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================================
  // ENREGISTRER
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/profile/${profile.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la mise à jour"
        );
      }

      setProfile(data);

      setMessage("Profil mis à jour avec succès ✅");

    } catch (error) {
      console.error("Erreur :", error);

      setMessage(
        "Erreur lors de la mise à jour du profil ❌"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="admin-profile-page">
        <div className="profile-loading">
          Chargement du profil...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================

  if (!profile) {
    return (
      <div className="admin-profile-page">
        <div className="profile-error">
          Impossible de récupérer le profil.
        </div>
      </div>
    );
  }

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <div className="admin-profile-page">

      {/* HEADER */}
      <div className="admin-profile-header">

        <div>
          <span className="admin-page-label">
            PROFILE // SETTINGS
          </span>

          <h1>Mon profil</h1>

          <p>
            Modifie les informations affichées sur ton
            portfolio.
          </p>
        </div>

      </div>


      {/* MESSAGE */}
      {message && (
        <div className="profile-message">
          {message}
        </div>
      )}


      {/* FORMULAIRE */}
      <form
        className="admin-profile-form"
        onSubmit={handleSubmit}
      >

        {/* ====================================================
            INFORMATIONS GÉNÉRALES
        ==================================================== */}

        <div className="profile-card">

          <h2>Informations générales</h2>

          <div className="form-grid">

            {/* NOM */}
            <div className="form-group">

              <label>Nom</label>

              <input
                type="text"
                name="name"
                value={profile.name || ""}
                onChange={handleChange}
                placeholder="Ronel Ngompe"
              />

            </div>


            {/* PROFESSION */}
            <div className="form-group">

              <label>Profession</label>

              <input
                type="text"
                name="profession"
                value={profile.profession || ""}
                onChange={handleChange}
                placeholder="Full-Stack Developer"
              />

            </div>


            {/* BIO */}
            <div className="form-group full">

              <label>Bio</label>

              <textarea
                name="bio"
                rows="4"
                value={profile.bio || ""}
                onChange={handleChange}
                placeholder="Présente-toi brièvement..."
              />

            </div>


            {/* DESCRIPTION */}
            <div className="form-group full">

              <label>Description</label>

              <textarea
                name="description"
                rows="5"
                value={profile.description || ""}
                onChange={handleChange}
                placeholder="Décris ton parcours et ta manière de travailler..."
              />

            </div>


            {/* LOCALISATION */}
            <div className="form-group">

              <label>Localisation</label>

              <input
                type="text"
                name="location"
                value={profile.location || ""}
                onChange={handleChange}
                placeholder="Cameroon"
              />

            </div>


            {/* DISPONIBILITÉ */}
            <div className="form-group">

              <label>Disponibilité</label>

              <input
                type="text"
                name="availability"
                value={profile.availability || ""}
                onChange={handleChange}
                placeholder="Available for new projects"
              />

            </div>


            {/* PHOTO */}
            <div className="form-group full">

              <label>URL de la photo</label>

              <input
                type="text"
                name="photo_url"
                value={profile.photo_url || ""}
                onChange={handleChange}
                placeholder="/projects/photo-ronel.jpeg"
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            RÉSEAUX SOCIAUX
        ==================================================== */}

        <div className="profile-card profile-socials">

          <h2>Réseaux sociaux</h2>

          <p className="socials-description">
            Ajoute les liens vers tes différents réseaux.
            Ils pourront ensuite être utilisés automatiquement
            sur ton portfolio.
          </p>

          <div className="form-grid">

            {/* GITHUB */}
            <div className="form-group">

              <label>GitHub</label>

              <input
                type="url"
                name="github_url"
                value={profile.github_url || ""}
                onChange={handleChange}
                placeholder="https://github.com/RONEL-BYTE"
              />

            </div>


            {/* LINKEDIN */}
            <div className="form-group">

              <label>LinkedIn</label>

              <input
                type="url"
                name="linkedin_url"
                value={profile.linkedin_url || ""}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/in/..."
              />

            </div>


            {/* WHATSAPP */}
            <div className="form-group">

              <label>WhatsApp</label>

              <input
                type="url"
                name="whatsapp_url"
                value={profile.whatsapp_url || ""}
                onChange={handleChange}
                placeholder="https://wa.me/237XXXXXXXXX"
              />

            </div>


            {/* TELEGRAM */}
            <div className="form-group">

              <label>Telegram</label>

              <input
                type="url"
                name="telegram_url"
                value={profile.telegram_url || ""}
                onChange={handleChange}
                placeholder="https://t.me/tonpseudo"
              />

            </div>


            {/* INSTAGRAM */}
            <div className="form-group">

              <label>Instagram</label>

              <input
                type="url"
                name="instagram_url"
                value={profile.instagram_url || ""}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
              />

            </div>


            {/* TIKTOK */}
            <div className="form-group">

              <label>TikTok</label>

              <input
                type="url"
                name="tiktok_url"
                value={profile.tiktok_url || ""}
                onChange={handleChange}
                placeholder="https://tiktok.com/@..."
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            BOUTON
        ==================================================== */}

        <button
          type="submit"
          className="save-profile-btn"
          disabled={saving}
        >
          {saving
            ? "Enregistrement..."
            : "Enregistrer les modifications"}
        </button>

      </form>

    </div>
  );
}

export default AdminProfile;