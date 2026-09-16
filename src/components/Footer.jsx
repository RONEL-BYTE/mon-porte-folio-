import "./Footer.css";

function Footer() {
  return (
    <footer className="footer-section">

      <div className="footer-container">

        <div className="footer-top">

          <div className="footer-brand">

            <div className="footer-logo">
              RN
            </div>

            <div>
              <h3>Ronel Ngompe</h3>
              <p>Full-Stack Developer</p>
            </div>

          </div>

          <p className="footer-description">
            Building modern digital experiences with clean code,
            thoughtful design and scalable technology.
          </p>

          <a href="#contact" className="footer-contact">
            Let's Talk <span>↗</span>
          </a>

        </div>

        <div className="footer-bottom">

          <span>
            © 2026 Ronel Ngompe. All rights reserved.
          </span>

          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#projects">Projects</a>
            <a href="#publications">Publications</a>
            <a href="#contact">Contact</a>
          </div>

          <a href="#home" className="footer-back-top">
            Back to top ↑
          </a>

        </div>

      </div>

    </footer>
  );
}

export default Footer;