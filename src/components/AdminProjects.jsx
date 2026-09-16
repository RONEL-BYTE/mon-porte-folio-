import AdminSidebar from "./AdminSidebar";
import "./AdminPublications.css";

function AdminPublications() {
  return (
    <div className="admin-layout">

      <AdminSidebar />

      <main className="admin-main">

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">
              CONTENT MANAGEMENT
            </span>

            <h1>Publications</h1>

            <p>
              Gérez les publications de votre portfolio.
            </p>
          </div>

          <button className="add-project-button">
            + Nouvelle publication
          </button>
        </div>

        <div className="empty-publications">
          <div className="empty-icon">
            ✦
          </div>

          <h3>
            Aucune publication
          </h3>

          <p>
            Commencez par créer votre première publication.
          </p>
        </div>

      </main>

    </div>
  );
}

export default AdminPublications;