import { useState } from "react"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <h2>RONEL</h2>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <a href="#work" onClick={() => setMenuOpen(false)}>WORK</a>
<a href="#about" onClick={() => setMenuOpen(false)}>ABOUT</a>
<a href="#skills" onClick={() => setMenuOpen(false)}>SKILLS</a>
<a href="#contact" onClick={() => setMenuOpen(false)}>CONTACT</a>
      </div>
    </nav>
  )
}

export default Navbar