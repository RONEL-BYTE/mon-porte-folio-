import { useEffect, useState } from "react";
import "./Hero.css";
import { apiFetch } from "../services/api";

function Hero() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projectCount, setProjectCount] = useState(0);

  // Année de début d'apprentissage
  const learningStartYear = 2023;

  // ===============================
  // CALCUL DES ANNÉES D'APPRENTISSAGE
  // ===============================
  const currentYear = new Date().getFullYear();
  const yearsLearning = currentYear - learningStartYear;

  useEffect(() => {
    // ===============================
    // RÉCUPÉRER LE PROFIL
    // ===============================
    apiFetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
      })
      .catch((error) => {
        console.error("Erreur récupération profil :", error);
      });

    // ===============================
    // RÉCUPÉRER LES SKILLS
    // ===============================
    apiFetch("/api/skills")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sortedSkills = [...data]
            .sort((a, b) => (b.level || 0) - (a.level || 0))
            .slice(0, 3);

          setSkills(sortedSkills);
        }
      })
      .catch((error) => {
        console.error("Erreur récupération skills :", error);
      });

    // ===============================
    // RÉCUPÉRER LES PROJETS
    // ===============================
    apiFetch("/api/projects")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectCount(data.length);
        }
      })
      .catch((error) => {
        console.error("Erreur récupération projets :", error);
      });
  }, []);

  return (
    <section id="home" className="stitch-hero">

      <div className="hero-container">

        {/* CONTENU GAUCHE */}
        <div className="hero-content">

          <div className="hero-status">
            <span className="status-dot"></span>

            {profile?.availability ||
              "Available for new projects"}
          </div>

          <h1>
            Hi, I'm
            <span>
              {" "}
              {profile?.name || "Ronel Ngompe"}.
            </span>
          </h1>

          <h2>
            {profile?.profession ||
              "Full-Stack Developer"}
          </h2>

          <p className="hero-description">
            {profile?.description ||
              "I build modern digital experiences that combine thoughtful design, clean code, and scalable technology."}
          </p>

          <div className="hero-buttons">

            <a
              href="#projects"
              className="hero-primary-button"
            >
              View My Work
              <span>→</span>
            </a>

            <a
              href="#contact"
              className="hero-secondary-button"
            >
              Let's Talk
              <span>↗</span>
            </a>

          </div>

          {/* RÉSEAUX SOCIAUX */}
          <div className="hero-socials">

            <span>Find me on</span>

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

        {/* VISUEL DROITE */}
        <div className="hero-visual">

          <div className="hero-image-wrapper">

            <div className="hero-image-frame">

              <img
                src={
                  profile?.photo_url ||
                  "/public/projects/photo-ronel.jpeg"
                }
                alt={
                  profile?.name ||
                  "Ronel Ngompe"
                }
              />

            </div>

            {/* BADGES TECHNOLOGIES DYNAMIQUES */}

            {skills[0] && (
              <div className="tech-badge react-badge">
                <span>
                  {skills[0].icon || "⚡"}
                </span>

                {skills[0].name}
              </div>
            )}

            {skills[1] && (
              <div className="tech-badge js-badge">
                <span>
                  {skills[1].icon || "⚡"}
                </span>

                {skills[1].name}
              </div>
            )}

            {skills[2] && (
              <div className="tech-badge python-badge">
                <span>
                  {skills[2].icon || "⚡"}
                </span>

                {skills[2].name}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* STATISTIQUES DYNAMIQUES */}
      <div className="hero-stats">

        {/* PROJECTS */}
        <div className="hero-stat">
          <strong>{projectCount}+</strong>
          <span>Projects</span>
        </div>

        {/* YEARS LEARNING */}
        <div className="hero-stat">
          <strong>{yearsLearning}+</strong>
          <span>Years Learning</span>
        </div>

        {/* COMMITMENT */}
        <div className="hero-stat">
          <strong>100%</strong>
          <span>Commitment</span>
        </div>

      </div>

    </section>
  );
}

export default Hero;