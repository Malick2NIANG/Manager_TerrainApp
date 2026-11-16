import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { GROUPES, ongletsPour } from './navigation.js'

// En-tete commun des pages : un titre court, une ligne de resume (les
// chiffres utiles), l'aide repliee derriere « ? », les actions principales a
// droite, puis les onglets du groupe (pages liees de la meme tache).
export default function EnTetePage({ groupe, titre, resume, aide, actions }) {
  const { role } = useAuth()
  const [aideOuverte, setAideOuverte] = useState(false)
  const onglets = groupe ? ongletsPour(groupe, role) : []
  return (
    <header className="ta-entete">
      <div className="ta-entete-ligne">
        <div className="ta-entete-titre">
          <h1>{titre || GROUPES[groupe]?.label}</h1>
          {aide && (
            <button type="button" className="ta-entete-aide-bouton" aria-expanded={aideOuverte}
              aria-label={aideOuverte ? 'Masquer l’aide' : 'Afficher l’aide'} onClick={() => setAideOuverte((o) => !o)}>
              <i className="fa-solid fa-circle-question" aria-hidden="true" />
            </button>
          )}
        </div>
        {actions && <div className="ta-entete-actions">{actions}</div>}
      </div>
      {resume && <p className="ta-entete-resume">{resume}</p>}
      {aideOuverte && <p className="ta-entete-aide" role="note">{aide}</p>}
      {onglets.length > 1 && (
        <nav className="ta-onglets" aria-label={GROUPES[groupe].label}>
          {onglets.map((o) => (
            <NavLink key={o.path} to={o.path} end className={({ isActive }) => `ta-onglet ${isActive ? 'is-actif' : ''}`}>
              <i className={`fa-solid ${o.icon}`} aria-hidden="true" /> <span>{o.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
