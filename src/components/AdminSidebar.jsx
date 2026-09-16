import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";
import { apiFetch } from "../services/api";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/admin/logout", { method: "POST" });
    } finally {
      navigate("/admin");
    }
  };

  return (
    <aside className="admin-sidebar">

      <div className="admin-logo">
        <div className="admin-logo-icon">RN</div>

        <div>
          <h2>Ronel</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <nav className="admin-nav">

        <NavLink to="/admin/dashboard">
          <span>⌂</span>
          Dashboard
        </NavLink>

        <NavLink to="/admin/projects">
          <span>▣</span>
          Projets
        </NavLink>

        <NavLink to="/admin/publications">
          <span>✦</span>
          Publications
        </NavLink>

        <NavLink to="/admin/skills">
          <span>◈</span>
          Compétences
        </NavLink>

        <NavLink to="/admin/events">
          <span>◉</span>
          Événements
        </NavLink>

        <NavLink to="/admin/messages">
          <span>✉</span>
          Messages
        </NavLink>

      </nav>

      <div className="admin-sidebar-bottom">

        <button onClick={() => navigate("/")}>
          <span>↗</span>
          Voir le portfolio
        </button>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>⇥</span>
          Déconnexion
        </button>

      </div>

    </aside>
  );
}

export default AdminSidebar;