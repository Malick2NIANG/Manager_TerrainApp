import { useState } from 'react'
// Styles de l'en-tete (titre, bouton i, actions) : charges ici pour les
// pages qui n'importent pas terrains.css (Equipe, Personnel, Journal).
import '../styles/terrains.css'
import { useLocation, useNavigate } from 'react-router-dom'
import StatFilterCards from './crud/StatFilterCards.jsx'
import useCompteurs from './useCompteurs.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { GROUPES, ongletsPour } from './navigation.js'

// En-tete commun des pages : un titre court, une ligne de resume (les
// chiffres utiles), le guide de la page replie derriere l'icone « i », les actions principales a
// droite, puis les pages du groupe en cartes chiffrees cliquables (la
// carte de la page courante est selectionnee).
export default function EnTetePage({ groupe, titre, resume, aide, actions }) {
  const { role } = useAuth() || {}
  const [aideOuverte, setAideOuverte] = useState(false)
  const onglets = groupe ? ongletsPour(groupe, role) : []
  return (
    <header className="ta-entete">
      <div className="ta-entete-ligne">
        <div className="ta-entete-titre">
          <h1>{titre || GROUPES[groupe]?.label}</h1>
          {aide && (
            <button type="button" className="ta-entete-aide-bouton" aria-expanded={aideOuverte}
              aria-label={aideOuverte ? 'Masquer les infos de la page' : 'Infos sur cette page'} title="À quoi sert cette page ?"
              onClick={() => setAideOuverte((o) => !o)}>
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
            </button>
          )}
        </div>
        {actions && <div className="ta-entete-actions">{actions}</div>}
      </div>
      {resume && <p className="ta-entete-resume">{resume}</p>}
      {aideOuverte && (Array.isArray(aide) ? (
        <div className="ta-entete-aide" role="note">
          <p className="ta-entete-aide-titre"><i className="fa-solid fa-circle-info" aria-hidden="true" /> {aide[0]}</p>
          {aide.length > 1 && <ul>{aide.slice(1).map((ligne) => <li key={ligne}>{ligne}</li>)}</ul>}
        </div>
      ) : <p className="ta-entete-aide" role="note">{aide}</p>)}
      {onglets.length > 1 && <CartesGroupe groupe={groupe} onglets={onglets} />}
    </header>
  )
}

/** Pages du groupe en cartes chiffrees (hors pages seules : pas de routeur requis). */
function CartesGroupe({ groupe, onglets }) {
  const compteurs = useCompteurs(onglets)
  const { pathname } = useLocation()
  const naviguer = useNavigate()
  return (
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
  )
}
