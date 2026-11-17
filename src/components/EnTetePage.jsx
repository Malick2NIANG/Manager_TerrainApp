import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StatFilterCards from './crud/StatFilterCards.jsx'
import useCompteurs from './useCompteurs.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { GROUPES, ongletsPour } from './navigation.js'

// En-tete commun des pages : un titre court, une ligne de resume (les
// chiffres utiles), l'aide repliee derriere « ? », les actions principales a
// droite, puis les pages du groupe en cartes chiffrees cliquables (la
// carte de la page courante est selectionnee).
export default function EnTetePage({ groupe, titre, resume, aide, actions }) {
  const { role } = useAuth()
  const [aideOuverte, setAideOuverte] = useState(false)
  const onglets = groupe ? ongletsPour(groupe, role) : []
  const compteurs = useCompteurs(onglets.length > 1 ? onglets : [])
  const { pathname } = useLocation()
  const naviguer = useNavigate()
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
        <StatFilterCards
          className={`ta-cartes-groupe is-${onglets.length}col`}
          ariaLabel={GROUPES[groupe].label}
          selected={onglets.find((o) => pathname === o.path || pathname.startsWith(`${o.path}/`))?.path}
          onSelect={(chemin) => chemin !== pathname && naviguer(chemin)}
          items={onglets.map((o) => ({
            key: o.path, icon: o.icon, label: o.stat || o.label, accent: o.accent, accentBg: o.accentBg,
            value: compteurs[o.path] ?? '…',
          }))}
        />
      )}
    </header>
  )
}
