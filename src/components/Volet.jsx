import { useId, useState } from 'react'

// Volet depliable : le titre et un resume restent visibles, le detail
// s'ouvre a la demande (l'essentiel d'abord, le reste un clic plus loin).
export default function Volet({ titre, resume, icone, ouvertParDefaut = false, children, className = '' }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  const id = useId()
  return (
    <section className={`ta-volet ${ouvert ? 'is-ouvert' : ''} ${className}`}>
      <button type="button" className="ta-volet-tete" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)}>
        {icone && <i className={`fa-solid ${icone} ta-volet-icone`} aria-hidden="true" />}
        <span className="ta-volet-textes">
          <span className="ta-volet-titre">{titre}</span>
          {resume && !ouvert && <span className="ta-volet-resume">{resume}</span>}
        </span>
        <i className="fa-solid fa-chevron-down ta-volet-chevron" aria-hidden="true" />
      </button>
      <div id={id} className="ta-volet-corps" hidden={!ouvert}>{children}</div>
    </section>
  )
}
