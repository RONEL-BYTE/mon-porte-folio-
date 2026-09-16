import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { apiFetch } from "../services/api";


function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Connexion en cours...");

    try {
      const response = await apiFetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Connexion réussie");
        navigate("/admin/dashboard");
      } else {
        setMessage("Identifiants incorrects");
      }
    } catch (error) {
      console.error("Erreur de connexion admin :", error);
      setMessage("Impossible de contacter le serveur");
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Administration</h1>

        <p>Connecte-toi pour accéder au dashboard.</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="admin@depot.cm"
            aria-label="Identifiant administrateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe administrateur"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Se connecter
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default AdminLogin;