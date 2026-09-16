import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Portfolio public
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Publications from "./components/Publications";
import Events from "./components/Events";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

// Administration
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminProjects from "./components/AdminProjects";
import AdminPublications from "./components/AdminPublications";
import AdminSkills from "./components/AdminSkills";
import AdminEvents from "./components/AdminEvents";
import AdminComments from "./components/AdminComments";
import AdminProfile from "./components/AdminProfile";
import AdminMessages from "./components/AdminMessages";
import { getAdminSession } from "./services/api";

import "./App.css";


// ============================================================
// PORTFOLIO PUBLIC
// ============================================================

function Portfolio() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <Projects />

        <Publications />

        <Skills />

        <Events />

        <About />

        <Contact />
      </main>

      <Footer />
    </>
  );
}

function ProtectedAdminRoute({ children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    getAdminSession()
      .then((authenticated) => setState(authenticated ? "authenticated" : "unauthenticated"))
      .catch(() => setState("unauthenticated"));
  }, []);

  if (state === "checking") {
    return <div className="admin-route-loading">Vérification de la session...</div>;
  }

  return state === "authenticated" ? children : <Navigate to="/admin" replace />;
}


// ============================================================
// APPLICATION
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            PORTFOLIO PUBLIC
        ================================================== */}

        <Route
          path="/"
          element={<Portfolio />}
        />


        {/* ==================================================
            ADMINISTRATION
        ================================================== */}

        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/projects"
          element={<ProtectedAdminRoute><AdminProjects /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/publications"
          element={<ProtectedAdminRoute><AdminPublications /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/skills"
          element={<ProtectedAdminRoute><AdminSkills /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/events"
          element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/comments"
          element={<ProtectedAdminRoute><AdminComments /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/profile"
          element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>}
        />

        <Route
          path="/admin/messages"
          element={<ProtectedAdminRoute><AdminMessages /></ProtectedAdminRoute>}
        />

      </Routes>

    </BrowserRouter>
  );
}


// ============================================================
// EXPORT IMPORTANT
// ============================================================

export default App;