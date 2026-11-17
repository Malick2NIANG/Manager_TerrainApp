import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../../api/client.js'
import useFluxPlanning from '../../hooks/useFluxPlanning.js'
import { dateLongue, decalerJour, formatFCFA, jourISO, jourRelatif, plage } from '../../utils/dates.js'
import PlanningGrille from '../planning/PlanningGrille.jsx'
import { BadgeStatut, MOYENS, telephoneLisible } from '../planning/statuts.jsx'

// Grille du planning en lecture seule (tableau de bord de l'Admin) : la meme
// que celle du gerant, sans reserver, encaisser ni annuler. Mise a jour en
// temps reel ; un bloc reserve ouvre une fiche de consultation.
export default function PlanningLecture() {
  const [jour, setJour] = useState(jourISO())
  const [dispos, setDispos] = useState(null)
  const [reservations, setReservations] = useState([])
  const [erreur, setErreur] = useState(null)
  const [fiche, setFiche] = useState(null)

  const charger = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([apiGet(`/disponibilites?date=${jour}`), apiGet(`/planning?date=${jour}`)])
      setDispos(d)
      setReservations(r)
      setErreur(null)
    } catch (e) {
      setErreur(e.message)
    }
  }, [jour])

  useEffect(() => { charger() }, [charger])
  useFluxPlanning(() => charger())

  const actives = reservations.filter((r) => r.statut === 'CONFIRMEE' || r.statut === 'HONOREE')
  const montant = actives.reduce((n, r) => n + (Number(r.montant) || 0), 0)

  return (
    <section className="dashboard-panel" style={{ marginTop: 20 }}>
      <div className="dashboard-panel-heading ta-toolbar">
        <div>
          <p className="manager-eyebrow">Planning · lecture seule</p>
          <h2>{actives.length} réservation{actives.length > 1 ? 's' : ''} · {formatFCFA(montant)}</h2>
        </div>
        <span className="ta-toolbar-spacer" />
        <div className="ta-date" role="group" aria-label="Jour affiché">
          <button type="button" className="ta-date-fleche" aria-label="Jour précédent" onClick={() => setJour((j) => decalerJour(j, -1))}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <label className="ta-date-centre" title="Choisir un jour">
            <span className="ta-date-icone"><i className="fa-regular fa-calendar" aria-hidden="true" /></span>
            <span className="ta-date-textes">
              <small className={jour === jourISO() ? 'is-aujourdhui' : ''}>{jourRelatif(jour)}</small>
              <strong>{dateLongue(`${jour}T12:00:00Z`)}</strong>
            </span>
            <input type="date" className="ta-date-cache" aria-label="Choisir un jour" value={jour}
              onClick={(e) => { try { e.currentTarget.showPicker?.() } catch { /* deja ouvert */ } }}
              onChange={(e) => e.target.value && setJour(e.target.value)} />
          </label>
          <button type="button" className="ta-date-fleche" aria-label="Jour suivant" onClick={() => setJour((j) => decalerJour(j, 1))}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
        {jour !== jourISO() && (
          <button type="button" className="ta-date-retour" onClick={() => setJour(jourISO())}>
            <i className="fa-solid fa-rotate-left" aria-hidden="true" /> Aujourd’hui
          </button>
        )}
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {dispos === null && !erreur && <p className="planning-vide">Chargement du planning…</p>}
      {dispos && dispos.length === 0 && <p className="planning-vide">Aucun terrain pour le moment.</p>}
      {dispos && dispos.length > 0 && (
        <>
          <div className="pg-legende" aria-label="Légende">
            <span><i className="pg-pastille is-confirmee" /> Réservé</span>
            <span><i className="pg-pastille is-attente" /> Paiement en attente</span>
            <span><i className="pg-pastille is-honoree" /> Entrée validée</span>
            <span><i className="pg-pastille is-libre" /> Libre</span>
            <span><i className="pg-pastille is-bloque" /> Fermé</span>
          </div>
          <PlanningGrille jour={jour} dispos={dispos} reservations={reservations} peutReserver={false} onOuvrir={setFiche} />
        </>
      )}

      {fiche && (
        <div className="manager-modal-backdrop is-sheet" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFiche(null)}>
          <section className="manager-modal manager-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="fiche-lecture-titre">
            <span className="sheet-poignee" aria-hidden="true" />
            <div className="manager-modal-header">
              <div>
                <p className="manager-eyebrow">Réservation {fiche.reference}</p>
                <h2 id="fiche-lecture-titre">{fiche.terrain} · {plage(fiche.debut, fiche.fin)}</h2>
              </div>
              <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={() => setFiche(null)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <dl className="ta-fiche">
              <dt>Statut</dt><dd><BadgeStatut statut={fiche.statut} /></dd>
              <dt>Client</dt><dd>{fiche.clientNom}</dd>
              <dt>Téléphone</dt><dd>{telephoneLisible(fiche.clientTelephone)}</dd>
              <dt>Jour</dt><dd style={{ textTransform: 'capitalize' }}>{dateLongue(fiche.debut)}</dd>
              <dt>Montant</dt><dd>{formatFCFA(fiche.montant)}</dd>
              <dt>Paiement</dt><dd>{fiche.payeeLe ? `${MOYENS[fiche.moyenPaiement] || fiche.moyenPaiement} · ${fiche.canal === 'APP' ? 'en ligne' : 'au comptoir'}` : 'Non payé'}</dd>
              {fiche.motifAnnulation && <><dt>Motif</dt><dd>{fiche.motifAnnulation}</dd></>}
            </dl>
            <p className="ta-form-aide">Consultation seule : réservations, encaissements et annulations se font dans l’espace du gérant.</p>
          </section>
        </div>
      )}
    </section>
  )
}
