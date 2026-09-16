import { useEffect, useState } from "react";
import "./About.css";
import { getProfile } from "../services/profileService";

function About() {
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

  if (!profile) {
    return (
      <section id="about" className="about-section">
        <div className="about-container">
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="about-section">
      <div className="about-container">

        {/* TITRE */}
        <div className="about-heading">
          <div className="stitch-section-label">
            <span>05 // About Me</span>
            <i></i>
          </div>

          <h2>
            Building with
            <br />
            <span>purpose.</span>
          </h2>
        </div>

        {/* CONTENU */}
        <div className="about-content">

          <div className="about-intro">

            <p className="about-large-text">
              {profile.bio ||
                "I'm a Full-Stack Developer focused on building modern digital experiences."}
            </p>

            <p>
              {profile.description ||
                "I enjoy turning ideas into functional web applications, from intuitive interfaces to reliable backend systems."}
            </p>

          </div>

          {/* PRINCIPES */}
          <div className="about-details">

            <div className="about-detail">
              <span>01</span>

              <div>
                <h3>Clean Development</h3>
                <p>
                  Writing maintainable and organized code with modern
                  development practices.
                </p>
              </div>
            </div>

            <div className="about-detail">
              <span>02</span>

              <div>
                <h3>User Experience</h3>
                <p>
                  Creating responsive interfaces that are simple,
                  intuitive and enjoyable to use.
                </p>
              </div>
            </div>

            <div className="about-detail">
              <span>03</span>

              <div>
                <h3>Continuous Growth</h3>
                <p>
                  Always learning new technologies and improving my
                  development skills.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* INFORMATIONS */}
        <div className="about-bottom">

          <span>
            Based in {profile.location || "Cameroon"}
          </span>

          <span>
            {profile.availability || "Available for new projects"}
          </span>

        </div>

      </div>
    </section>
  );
}

export default About;