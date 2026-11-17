import { useEffect, useMemo, useState } from 'react'
import { ROLES_EQUIPE_ACTIFS } from '../../config/fonctionnalites.js'
import usePagination from '../../hooks/usePagination.jsx'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLE_LABELS } from '../../auth/roles.js'
import Layout from '../../components/Layout.jsx'
import { KpiCard, formatRelativeTime } from '../../components/dashboard/DashboardWidgets.jsx'
import { apiGet } from '../../api/client.js'
import useFluxPlanning from '../../hooks/useFluxPlanning.js'
import { formatFCFA, heure, jourISO } from '../../utils/dates.js'
import { BadgeStatut, reservationDuCreneau } from '../planning/statuts.jsx'
import '../../styles/terrains.css'
import EnTetePage from '../../components/EnTetePage.jsx'
import { AIDES } from '../../components/aidesPages.js'

/** Indicateurs du jour a partir du planning et des disponibilites. */
export function indicateursDuJour(reservations, dispos, maintenant = Date.now()) {
  const actives = reservations.filter((r) => ['CONFIRMEE', 'HONOREE'].includes(r.statut))
  // Occupation sur toute la journee (creneaux passes compris) : creneaux
  // couverts par une reservation / creneaux ouverts a la reservation.
  const creneaux = dispos.flatMap((t) => t.creneaux.map((c) => ({ ...c, terrainId: t.terrainId })))
  const pris = creneaux.filter((c) => reservationDuCreneau(reservations, c.terrainId, c.debut, c.fin)).length
  const ouverts = creneaux.filter((c) => c.etat !== 'BLOQUE').length
  return {
    nombre: actives.length,
    recette: actives.reduce((s, r) => s + r.montant, 0),
    enLigne: actives.filter((r) => r.canal === 'APP').length,
    occupation: ouverts ? Math.round((pris / ouverts) * 100) : 0,
    prochaines: actives.filter((r) => new Date(r.fin).getTime() > maintenant)
      .sort((a, b) => new Date(a.debut) - new Date(b.debut)).slice(0, 6),
  }
}

function TableauDuJour() {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState(null)
  const jour = jourISO()

  const charger = () => Promise.all([apiGet(`/planning?date=${jour}`), apiGet(`/disponibilites?date=${jour}`)])
    .then(([r, d]) => setDonnees({ r, d }))
    .catch((e) => setErreur(e.message))

  useEffect(() => { charger() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useFluxPlanning(() => charger())

  const k = useMemo(() => (donnees ? indicateursDuJour(donnees.r, donnees.d) : null), [donnees])
  const prochaines = usePagination(k?.prochaines || [], { options: [5, 10, 25], parPage: 5 })
  if (erreur) return <p className="ta-form-erreur" role="alert">{erreur}</p>
  if (!k) return <p className="planning-vide">Chargement…</p>

  return (
    <>
      <div className="dashboard-kpi-grid">
        <KpiCard icon="fa-calendar-check" accent="green" label="Réservations aujourd’hui" value={k.nombre} detail={`dont ${k.enLigne} en ligne`} to="/planning" />
        <KpiCard icon="fa-coins" accent="gold" label="Recette du jour" value={formatFCFA(k.recette)} detail="réservations confirmées" to="/planning" />
        <KpiCard icon="fa-chart-pie" accent="blue" label="Occupation des terrains" value={`${k.occupation} %`} detail="créneaux réservés aujourd’hui" to="/planning" />
      </div>
      <section className="dashboard-panel" style={{ marginTop: 20 }}>
        <div className="dashboard-panel-heading ta-toolbar">
          <div><p className="manager-eyebrow">Aujourd’hui</p><h2>Prochains matchs</h2></div>
          <span className="ta-toolbar-spacer" />
          <Link className="manager-button manager-button-quiet" to="/planning">Voir le planning</Link>
        </div>
        {k.prochaines.length === 0 ? <p className="planning-vide">Plus aucun match prévu aujourd’hui.</p> : (
          <div className="planning-creneaux">
            {prochaines.visibles.map((r) => (
              <div className="planning-creneau" key={r.id}>
                <span className="planning-creneau-heure">{heure(r.debut)}</span>
                <span className="planning-creneau-corps"><strong>{r.clientNom}</strong><small>{r.terrain} · {r.reference}</small></span>
                <BadgeStatut statut={r.statut} />
              </div>
            ))}
          </div>
        )}
        {prochaines.barre}
      </section>
    </>
  )
}

function TableauAdmin() {
  const [equipe, setEquipe] = useState(null)
  const [actions, setActions] = useState(null)
  useEffect(() => {
    apiGet('/staff-users').then(setEquipe).catch(() => setEquipe([]))
    const j = jourISO()
    apiGet(`/audit?du=${j}&au=${j}&page=0&taille=8`).then((r) => setActions(r?.entrees || [])).catch(() => setActions([]))
  }, [])
  const compte = (role) => (equipe || []).filter((u) => u.role === role && u.active).length
  return (
    <>
      <div className="dashboard-kpi-grid">
        <KpiCard icon="fa-user-tie" accent="green" label="Gérants actifs" value={equipe ? compte('GERANT') : '…'} to="/equipe" />
        {ROLES_EQUIPE_ACTIFS && <KpiCard icon="fa-users" accent="blue" label="Accueil et contrôleurs" value={equipe ? compte('ACCUEIL') + compte('CONTROLEUR') : '…'} to="/equipe" />}
        <KpiCard icon="fa-clipboard-list" accent="gold" label="Actions aujourd’hui" value={actions ? actions.length : '…'} to="/journal-audit" />
      </div>
      <section className="dashboard-panel" style={{ marginTop: 20 }}>
        <div className="dashboard-panel-heading ta-toolbar">
          <div><p className="manager-eyebrow">Monitoring</p><h2>Dernières actions</h2></div>
          <span className="ta-toolbar-spacer" />
          <Link className="manager-button manager-button-quiet" to="/journal-audit">Journal</Link>
        </div>
        {actions?.length === 0 && <p className="planning-vide">Aucune action aujourd’hui.</p>}
        <ul className="dashboard-activity-list">
          {(actions || []).map((a) => (
            <li key={a.id}>
              <span className="dashboard-activity-row">
                <span className="dashboard-activity-icon" aria-hidden="true"><i className="fa-solid fa-clock-rotate-left" /></span>
                <span className="dashboard-activity-text"><strong>{a.acteur?.nom}</strong><span>{a.action}</span></span>
                <span className="dashboard-activity-time">{formatRelativeTime(a.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default function Dashboard() {
  const { role } = useAuth()
  return (
    <Layout>
      <EnTetePage titre="Tableau de bord" aide={AIDES.dashboard[role] || AIDES.dashboard.ACCUEIL} />
      {role === 'ADMIN' ? <TableauAdmin /> : <TableauDuJour />}
    </Layout>
  )
}
