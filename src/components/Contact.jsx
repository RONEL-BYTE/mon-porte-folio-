
import {
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  FaTelegramPlane
} from "react-icons/fa"

function Contact() {
  return (
    <section id="contact" className="contact">
      <h2>LET'S WORK TOGETHER</h2>

      <a href="https://wa.me/+237696376954">
        CONTACT ME
      </a>
   <div className="social-links">

  <a href="https://github.com/RONEL-BYTE" target="_blank" rel="noreferrer">
    <FaGithub />
  </a>

  <a href="linkedin.com/in/ronel-ngompe-97380a429" target="_blank" rel="noreferrer">
    <FaLinkedin />
  </a>


  <a href="https://wa.me/+237696376954" target="_blank" rel="noreferrer">
    <FaWhatsapp />
  </a>

  <a href="https://t.me/Rhône Ronel" target="_blank" rel="noreferrer">
    <FaTelegramPlane />
  </a>

</div>

    </section>
  )
}

export default Contact