function Projects() {
 const projects = [
  {
  title: "GESTION DE STOCK",
  description: "Application de gestion de stock développée avec Flask et SQLite. Projet actuellement en amélioration.",
  tech: "Python • Flask • SQLite",
   image: "/projects/stock.png",
  github: "TON_LIEN_GITHUB",
  status: "EN COURS",
},
  {
    title: "SKYPLUS",
    description: "Application météo interactive.",
    tech: "JavaScript • API • CSS",
    image: "/projects/skyplus.png",
    github: "https://github.com/RONEL-BYTE/app-meteo-3.0-skyplus",
demo: "https://soft-souffle-285942.netlify.app/",
  },
  {
    title: "RESTAURANT",
    description: "Site vitrine moderne et responsive.",
    tech: "HTML • CSS • JavaScript",
    image: "/projects/restaurant.png",
    github: "https://github.com/RONEL-BYTE/site-vitrine-pour-un-restorent",
demo: "https://site-vitrine-pour-un-restauration.netlify.app/",
  },
]
  return (
    <section id="work" className="projects">
      <h2>SELECTED WORK</h2>

      <div className="projects-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={index}>
            <span>0{index + 1}</span>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.status && <span>{project.status}</span>}
            <small>{project.tech}</small>
            <div className="project-links">
  <a href={project.github} target="_blank" rel="noreferrer">
    GITHUB
  </a>

  <a href={project.demo} target="_blank" rel="noreferrer">
    LIVE DEMO
  </a>
</div>
            <img src={project.image} alt={project.title} />
          </article>
        ))}
      </div>
    </section>
  )
}

export default Projects