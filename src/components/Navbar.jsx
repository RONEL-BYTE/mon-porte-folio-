import { useEffect, useState } from "react";
import "./Navbar.css";
import { getProfile } from "../services/profileService";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((error) => {
        console.error("Erreur récupération profil :", error);
      });
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="stitch-navbar">

      <div className="navbar-container">

        {/* BRAND */}
        <a href="#home" className="navbar-brand" onClick={closeMenu}>

          <img
            src="/public/projects/logo-ronel.png"
            alt={profile?.name || "Ronel Ngompe"}
            className="navbar-logo"
          />

          <div className="navbar-identity">

            <span className="navbar-name">
              {profile?.name || "Ronel Ngompe"}
            </span>

            <span className="navbar-role">
              {profile?.profession || "Full-Stack Developer"}
            </span>

          </div>

        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="navbar-menu">

          <a href="#home" className="active">Home</a>
          <a href="#projects">Projects</a>
          <a href="#publications">Publications</a>
          <a href="#skills">Skills</a>
          <a href="#events">Events</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>

        </nav>

        {/* RIGHT SIDE */}
        <div className="navbar-actions">

          {/* RÉSEAUX SOCIAUX */}
          <div className="navbar-socials">

            {profile?.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                ⌘
              </a>
            )}

            {profile?.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                in
              </a>
            )}

            {profile?.telegram_url && (
              <a
                href={profile.telegram_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
              >
                ➤
              </a>
            )}

          </div>

          {/* CONTACT */}
          <a href="#contact" className="navbar-contact">
            Let's work together
          </a>

          {/* AVATAR */}
          <div className="navbar-avatar">

            <img
              src={
                profile?.photo_url ||
                "/public/projects/photo-ronel.jpeg"
              }
              alt={profile?.name || "Ronel Ngompe"}
            />

            <span></span>

          </div>

        </div>

        {/* MOBILE BUTTON */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>

        <a href="#home" onClick={closeMenu}>Home</a>
        <a href="#projects" onClick={closeMenu}>Projects</a>
        <a href="#publications" onClick={closeMenu}>Publications</a>
        <a href="#skills" onClick={closeMenu}>Skills</a>
        <a href="#events" onClick={closeMenu}>Events</a>
        <a href="#about" onClick={closeMenu}>About</a>
        <a href="#contact" onClick={closeMenu}>Contact</a>

      </div>

    </header>
  );
}

export default Navbar;