import { useEffect, useState } from "react";
import "./AdminSkills.css";
import { apiFetch } from "../services/api";

function AdminSkills() {
  const [skills, setSkills] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    level: 50,
    icon: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===============================
  // RÉCUPÉRER LES SKILLS
  // ===============================
  const fetchSkills = async () => {
    try {
      const response = await apiFetch("/api/skills");
      const data = await response.json();

      setSkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération skills :", error);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // ===============================
  // GÉRER LE FORMULAIRE
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "level" ? Number(value) : value
    });
  };

  // ===============================
  // AJOUTER / MODIFIER
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Le nom de la compétence est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      const url = editingId
        ? `/api/skills/${editingId}`
        : "/api/skills";

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
        alert(data.message || "Une erreur est survenue.");
        return;
      }

      // Réinitialiser
      setForm({
        name: "",
        category: "",
        level: 50,
        icon: ""
      });

      setEditingId(null);

      await fetchSkills();

    } catch (error) {
      console.error("Erreur :", error);
      alert("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // MODIFIER
  // ===============================
  const handleEdit = (skill) => {
    setEditingId(skill.id);

    setForm({
      name: skill.name || "",
      category: skill.category || "",
      level: skill.level || 50,
      icon: skill.icon || ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // ===============================
  // SUPPRIMER
  // ===============================
  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette compétence ?"
    );

    if (!confirmation) return;

    try {
      const response = await apiFetch(
        `/api/skills/${id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erreur lors de la suppression.");
        return;
      }

      await fetchSkills();

    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  // ===============================
  // ANNULER MODIFICATION
  // ===============================
  const cancelEdit = () => {
    setEditingId(null);

    setForm({
      name: "",
      category: "",
      level: 50,
      icon: ""
    });
  };

  return (
    <div className="admin-skills">

      {/* HEADER */}
      <div className="skills-header">
        <div>
          <h1>Compétences</h1>
          <p>
            Gérez vos compétences et vos technologies depuis cette interface.
          </p>
        </div>
      </div>

      {/* FORMULAIRE */}
      <div className="skills-form-card">

        <h2>
          {editingId
            ? "Modifier la compétence"
            : "Ajouter une compétence"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">
              <label>Nom</label>

              <input
                type="text"
                name="name"
                placeholder="Ex : React"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Catégorie</label>

              <input
                type="text"
                name="category"
                placeholder="Ex : Frontend"
                value={form.category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Niveau : {form.level}%</label>

              <input
                type="range"
                name="level"
                min="0"
                max="100"
                value={form.level}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Icône</label>

              <input
                type="text"
                name="icon"
                placeholder="Ex : react"
                value={form.icon}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="save-skill"
              disabled={loading}
            >
              {loading
                ? "Enregistrement..."
                : editingId
                ? "Modifier"
                : "Ajouter"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-skill"
                onClick={cancelEdit}
              >
                Annuler
              </button>
            )}

          </div>

        </form>
      </div>

      {/* LISTE */}
      <div className="skills-list">

        <div className="skills-list-header">
          <h2>Mes compétences</h2>

          <span>
            {skills.length} compétence
            {skills.length > 1 ? "s" : ""}
          </span>
        </div>

        {skills.length === 0 ? (

          <div className="empty-skills">
            <h3>Aucune compétence</h3>
            <p>
              Ajoutez votre première compétence avec le formulaire ci-dessus.
            </p>
          </div>

        ) : (

          <div className="skills-grid">

            {skills.map((skill) => (

              <div className="skill-card" key={skill.id}>

                <div className="skill-card-top">

                  <div className="skill-icon">
                    {skill.icon || "⚡"}
                  </div>

                  <div>
                    <h3>{skill.name}</h3>

                    <span>
                      {skill.category || "Technologie"}
                    </span>
                  </div>

                </div>

                <div className="skill-progress">

                  <div className="skill-progress-info">
                    <span>Niveau</span>
                    <strong>{skill.level}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${skill.level}%`
                      }}
                    />
                  </div>

                </div>

                <div className="skill-actions">

                  <button
                    onClick={() => handleEdit(skill)}
                    className="edit-skill"
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="delete-skill"
                  >
                    Supprimer
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminSkills;