import { useEffect, useState } from "react";
import "./Skills.css";
import { apiFetch } from "../services/api";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await apiFetch("/api/skills");
        const data = await response.json();

        setSkills(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur chargement skills :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const categories = skills.reduce((acc, skill) => {
    const category = skill.category || "Autres";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(skill);

    return acc;
  }, {});

  return (
    <section className="stitch-skills" id="skills">

      <div className="stitch-skills-header">
        <div>
          <span className="skills-label">
            SKILLS & TECHNOLOGIES
          </span>

          <h2>Compétences & technologies</h2>

          <p>
            Les technologies que j'utilise pour créer
            des expériences digitales modernes.
          </p>
        </div>

        <div className="skills-status">
          {loading ? "SYNCING..." : "LIVE DATA"}
        </div>
      </div>

      {loading ? (
        <div className="proficiency-card">
          Chargement des compétences...
        </div>
      ) : skills.length === 0 ? (
        <div className="proficiency-card">
          Aucune compétence disponible.
        </div>
      ) : (
        <div className="skills-layout">

          <div className="proficiency-card">

            <div className="proficiency-header">
              <div>
                <span>Technical Proficiency</span>

                <small>
                  Skills synchronisées depuis le dashboard
                </small>
              </div>

              <span className="proficiency-type">
                {skills.length} SKILLS
              </span>
            </div>

            <div className="skill-bars">

              {skills.map((skill) => (
                <div className="skill-row" key={skill.id}>

                  <div className="skill-info">
                    <strong>{skill.name}</strong>
                    <span>{skill.level}%</span>
                  </div>

                  <div className="skill-track">
                    <div
                      className="stitch-skill-progress"
                      style={{
                        width: `${skill.level}%`
                      }}
                    />
                  </div>

                </div>
              ))}

            </div>
          </div>

          <div className="skills-categories">

            {Object.entries(categories).map(
              ([category, categorySkills], index) => (
                <div
                  className="skill-category"
                  key={category}
                >

                  <div className="skill-category-top">
                    <span className="category-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="category-arrow">
                      ↗
                    </span>
                  </div>

                  <h3>{category}</h3>

                  <p>
                    Technologies et outils utilisés
                    dans mes projets.
                  </p>

                  <div className="category-tech">
                    {categorySkills.map((skill) => (
                      <span key={skill.id}>
                        {skill.name}
                      </span>
                    ))}
                  </div>

                </div>
              )
            )}

          </div>

        </div>
      )}

    </section>
  );
}

export default Skills;