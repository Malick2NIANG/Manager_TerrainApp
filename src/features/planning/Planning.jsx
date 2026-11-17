import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { apiGet, apiPost } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useFluxPlanning from '../../hooks/useFluxPlanning.js'
import { dateLongue, decalerJour, formatFCFA, heure, jourISO, jourRelatif, plage } from '../../utils/dates.js'
import { BadgeStatut, MOYENS, telephoneLisible } from './statuts.jsx'
import ComptoirModal from './ComptoirModal.jsx'
import PlanningGrille from './PlanningGrille.jsx'
import EncaisserSeance from '../abonnements/EncaisserSeance.jsx'
import { aEncaisser } from '../abonnements/abonnements.js'
import '../../styles/terrains.css'
import EnTetePage from '../../components/EnTetePage.jsx'

// Planning du jour, terrain par terrain : chaque creneau libre ouvre la
// reservation au comptoir, chaque creneau pris ouvre la fiche (annulation).
// Mis a jour en direct par le flux du planning (reservations en ligne,
// annulations, entrees scannees), avec un rafraichissement de secours.
export default function Planning() {
  const { role } = useAuth()
  const peutReserver = role === 'GERANT' || role === 'ACCUEIL'
  const [jour, setJour] = useState(jourISO())
  const [dispos, setDispos] = useState(null)
  const [reservations, setReservations] = useState([])
  const [erreur, setErreur] = useState(null)
  const [toast, setToast] = useState(null)
  const [comptoir, setComptoir] = useState(null) // { terrainId, debut } ou {}
  const [fiche, setFiche] = useState(null)
  const [annulation, setAnnulation] = useState(null)
  // Filtre : tous les terrains, ou un seul (retenu pour la session).
  const [filtre, setFiltre] = useState(() => {
    try { return sessionStorage.getItem('terrainapp_planning_terrain') || 'tous' } catch { return 'tous' }
  })
  const choisirFiltre = (v) => {
    setFiltre(v)
    try { sessionStorage.setItem('terrainapp_planning_terrain', v) } catch { /* facultatif */ }
  }

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

  useEffect(() => {
    setDispos(null)
    charger()
  }, [charger])

  const connecte = useFluxPlanning(() => charger())

  // Secours si le flux est coupe : toutes les 30 s (sinon toutes les 2 min).
  useEffect(() => {
    const t = setInterval(charger, connecte ? 120_000 : 30_000)
    return () => clearInterval(t)
  }, [charger, connecte])

  const visibles = useMemo(() => {
    if (!dispos) return dispos
    const un = dispos.filter((t) => String(t.terrainId) === filtre)
    return un.length ? un : dispos
  }, [dispos, filtre])

  const stats = useMemo(() => {
    const actives = reservations.filter((r) => ['CONFIRMEE', 'HONOREE'].includes(r.statut))
    return { nombre: actives.length, montant: actives.reduce((s, r) => s + r.montant, 0) }
  }, [reservations])

  async function annuler() {
    const r = annulation
    setAnnulation(null)
    setFiche(null)
    try {
      await apiPost(`/reservations/${r.id}/annulation`)
      setToast({ id: Date.now(), type: 'success', message: `Réservation ${r.reference} annulée : le créneau est libéré.` })
      charger()
    } catch (e) {
      setToast({ id: Date.now(), type: 'error', message: e.message })
    }
  }

  return (
    <Layout>
      <EnTetePage groupe="planning"
        resume={`${stats.nombre} réservation${stats.nombre > 1 ? 's' : ''} confirmée${stats.nombre > 1 ? 's' : ''} · ${formatFCFA(stats.montant)}`}
        aide="Une colonne par terrain, les heures de haut en bas. Touchez un bloc plein pour voir la réservation (client, paiement, annulation), un bloc « + » pour réserver au comptoir. La ligne rouge indique l’heure actuelle."
        actions={peutReserver && (
          <button className="manager-button manager-button-primary" type="button" onClick={() => setComptoir({})}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Nouvelle réservation
          </button>
        )} />

      <div className="ta-toolbar">
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
        {dispos && dispos.length > 1 && (
          <label className="ta-filtre-terrain">
            <i className="fa-solid fa-filter" aria-hidden="true" />
            <select value={visibles?.length === 1 ? String(visibles[0].terrainId) : 'tous'} onChange={(e) => choisirFiltre(e.target.value)}
              aria-label="Terrain affiché">
              <option value="tous">Tous les terrains ({dispos.length})</option>
              {dispos.map((t) => <option key={t.terrainId} value={t.terrainId}>{t.terrain} · {t.sport}</option>)}
            </select>
          </label>
        )}
        <span className="ta-toolbar-spacer" />
        <span className={`ta-live ${connecte ? 'is-on' : ''}`}>{connecte ? 'En direct' : 'Hors direct'}</span>
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {dispos === null && !erreur && <p className="planning-vide">Chargement du planning…</p>}
      {dispos && dispos.length === 0 && <p className="planning-vide">Aucun terrain : créez-en un dans « Terrains et tarifs ».</p>}

      {dispos && dispos.length > 0 && (
        <>
          <div className="pg-legende" aria-label="Légende">
            <span><i className="pg-pastille is-confirmee" /> Réservé</span>
            <span><i className="pg-pastille is-attente" /> Paiement en attente</span>
            <span><i className="pg-pastille is-honoree" /> Entrée validée</span>
            <span><i className="pg-pastille is-libre" /> Libre{peutReserver ? ' : touchez pour réserver' : ''}</span>
            <span><i className="pg-pastille is-bloque" /> Fermé</span>
          </div>
          <PlanningGrille jour={jour} dispos={visibles} reservations={reservations} peutReserver={peutReserver}
            onReserver={setComptoir} onOuvrir={setFiche} />
        </>
      )}

      {fiche && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFiche(null)}>
          <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="fiche-titre">
            <div className="manager-modal-header">
              <div>
                <p className="manager-eyebrow">Réservation {fiche.reference}</p>
                <h2 id="fiche-titre">{fiche.terrain} · {plage(fiche.debut, fiche.fin)}</h2>
              </div>
              <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={() => setFiche(null)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <dl className="ta-fiche">
              <dt>Statut</dt><dd><BadgeStatut statut={fiche.statut} /></dd>
              <dt>Client</dt><dd>{fiche.clientNom}</dd>
              <dt>Téléphone</dt><dd><a href={`tel:${fiche.clientTelephone}`}>{telephoneLisible(fiche.clientTelephone)}</a></dd>
              <dt>Jour</dt><dd style={{ textTransform: 'capitalize' }}>{dateLongue(fiche.debut)}</dd>
              <dt>Montant</dt><dd>{formatFCFA(fiche.montant)}</dd>
              <dt>Paiement</dt><dd>{aEncaisser(fiche) ? 'À encaisser (séance d’abonnement)'
                : `${MOYENS[fiche.moyenPaiement] || fiche.moyenPaiement} · ${fiche.canal === 'COMPTOIR' ? 'au comptoir' : 'en ligne'}`}</dd>
              {fiche.abonnementId && <><dt>Abonnement</dt><dd>Séance d’un abonnement (onglet Abonnements)</dd></>}
              {fiche.scanneLe && <><dt>Entrée</dt><dd>validée à {heure(fiche.scanneLe)}</dd></>}
            </dl>
            {peutReserver && aEncaisser(fiche) && (
              <div style={{ marginTop: 14 }}>
                <EncaisserSeance seance={fiche} onErreur={(m) => setToast({ id: Date.now(), type: 'error', message: m })}
                  onFait={(r) => {
                    setFiche(null)
                    setToast({ id: Date.now(), type: 'success', message: `Séance ${r.reference} encaissée (${formatFCFA(r.montant)}).` })
                    charger()
                  }} />
              </div>
            )}
            <div className="manager-modal-actions">
              {peutReserver && ['CONFIRMEE', 'EN_ATTENTE_PAIEMENT'].includes(fiche.statut) && (
                <button className="manager-button manager-button-danger" type="button" onClick={() => setAnnulation(fiche)}>
                  Annuler la réservation
                </button>
              )}
              <button className="manager-button manager-button-quiet" type="button" onClick={() => setFiche(null)}>Fermer</button>
            </div>
          </section>
        </div>
      )}

      {annulation && (
        <ConfirmModal
          title={`Annuler la réservation ${annulation.reference} ?`}
          message={`${annulation.clientNom} · ${annulation.terrain} · ${plage(annulation.debut, annulation.fin)}. Le créneau redevient libre. ${annulation.canal === 'APP' ? 'Paiement en ligne : remboursement à faire.' : ''}`}
          confirmLabel="Annuler la réservation"
          cancelLabel="Retour"
          tone="danger"
          icon="fa-ban"
          onConfirm={annuler}
          onCancel={() => setAnnulation(null)}
        />
      )}

      {comptoir && (
        <ComptoirModal
          jour={jour}
          terrains={dispos || []}
          initial={comptoir}
          onFermer={() => setComptoir(null)}
          onCree={(r) => {
            setComptoir(null)
            setToast({ id: Date.now(), type: 'success', message: `Réservation ${r.reference} enregistrée (${formatFCFA(r.montant)}).` })
            charger()
          }}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
