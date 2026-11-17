import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import { apiGet, apiPost } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useFluxPlanning from '../../hooks/useFluxPlanning.js'
import { dateLongue, decalerJour, formatFCFA, heure, jourISO, jourRelatif, plage } from '../../utils/dates.js'
import { BadgeStatut, MOYENS, telephoneLisible } from './statuts.jsx'
import ComptoirModal from './ComptoirModal.jsx'
import AnnulationModal, { refusAnnulation } from './AnnulationModal.jsx'
import PlanningGrille from './PlanningGrille.jsx'
import { correspond, filtrerTerrains, terrainsParSport } from './grille.js'
import useEcranEtroit from '../../hooks/useEcranEtroit.js'
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

  const [recherche, setRecherche] = useState('')
  const visibles = useMemo(() => filtrerTerrains(dispos, filtre), [dispos, filtre])

  // Telephone : un terrain a la fois (fleches ou glissement), « Tous » sur demande.
  const etroit = useEcranEtroit()
  const [unParUn, setUnParUn] = useState(true)
  const [indexTerrain, setIndexTerrain] = useState(0)
  const pagine = etroit && unParUn && (visibles?.length || 0) > 1
  const index = visibles?.length ? Math.min(indexTerrain, visibles.length - 1) : 0
  const affiches = pagine ? [visibles[index]] : visibles
  const changerTerrain = (pas) => visibles?.length && setIndexTerrain((index + pas + visibles.length) % visibles.length)
  const glisser = useRef(null)

  // Recherche en mode un par un : on se place sur le terrain de la 1re trouvee.
  useEffect(() => {
    if (!pagine || !recherche.trim()) return
    const r = reservations.find((x) => !['ANNULEE', 'EXPIREE'].includes(x.statut) && correspond(x, recherche)
      && visibles.some((t) => t.terrainId === x.terrainId))
    if (r) setIndexTerrain(visibles.findIndex((t) => t.terrainId === r.terrainId))
  }, [recherche, pagine, reservations, visibles])

  const trouvees = useMemo(() => (recherche.trim()
    ? reservations.filter((r) => !['ANNULEE', 'EXPIREE'].includes(r.statut) && correspond(r, recherche)
      && (visibles || []).some((t) => t.terrainId === r.terrainId)).length
    : 0), [recherche, reservations, visibles])

  const stats = useMemo(() => {
    const actives = reservations.filter((r) => ['CONFIRMEE', 'HONOREE'].includes(r.statut))
    return { nombre: actives.length, montant: actives.reduce((s, r) => s + r.montant, 0) }
  }, [reservations])

  async function annuler(motif) {
    const r = annulation
    try {
      await apiPost(`/reservations/${r.id}/annulation`, { motif })
      setAnnulation(null)
      setFiche(null)
      setToast({ id: Date.now(), type: 'success', message: `Réservation ${r.reference} annulée : créneau libéré, client prévenu par SMS.` })
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
        <span className="ta-toolbar-spacer" />
        <div className="crud-search ta-recherche-planning">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Client, numéro ou référence…" aria-label="Rechercher une réservation du jour" />
          {recherche.trim() && (
            <span className={`ta-recherche-compte ${trouvees ? '' : 'is-vide'}`} aria-live="polite">
              {trouvees ? `${trouvees} trouvée${trouvees > 1 ? 's' : ''}` : 'Aucune'}
            </span>
          )}
        </div>
        {dispos && dispos.length > 1 && (
          <label className="ta-filtre-terrain">
            <i className="fa-solid fa-filter" aria-hidden="true" />
            <select value={filtrerTerrains(dispos, filtre).length === dispos.length ? 'tous' : filtre}
              onChange={(e) => { choisirFiltre(e.target.value); setIndexTerrain(0) }} aria-label="Terrains affichés">
              <option value="tous">Tous les terrains ({dispos.length})</option>
              {terrainsParSport(dispos).map((g) => (
                <optgroup key={g.sport} label={g.sport}>
                  {g.terrains.length > 1 && <option value={`sport:${g.sport}`}>Tous les {g.sport} ({g.terrains.length})</option>}
                  {g.terrains.map((t) => <option key={t.terrainId} value={t.terrainId}>{t.terrain}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        )}
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
          {etroit && visibles.length > 1 && (
            <div className="pg-pager">
              {pagine ? (
                <>
                  <button type="button" className="pg-pager-fleche" aria-label="Terrain précédent" onClick={() => changerTerrain(-1)}>
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <span className="pg-pager-titre">
                    <strong>{affiches[0].terrain}</strong>
                    <small>{affiches[0].sport} · {index + 1} / {visibles.length}</small>
                  </span>
                  <button type="button" className="pg-pager-fleche" aria-label="Terrain suivant" onClick={() => changerTerrain(1)}>
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </>
              ) : <span className="pg-pager-titre"><strong>{visibles.length} terrains côte à côte</strong><small>Faites défiler de côté</small></span>}
              <button type="button" className="pg-pager-mode" onClick={() => setUnParUn((v) => !v)}>
                {pagine ? 'Voir tous' : 'Un par un'}
              </button>
            </div>
          )}
          <div onTouchStart={(e) => { glisser.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (!pagine || glisser.current === null) return
              const dx = e.changedTouches[0].clientX - glisser.current
              glisser.current = null
              if (Math.abs(dx) > 60) changerTerrain(dx < 0 ? 1 : -1)
            }}>
          <PlanningGrille enTete={!pagine} jour={jour} dispos={affiches} reservations={reservations} peutReserver={peutReserver} recherche={recherche}
            onReserver={setComptoir} onOuvrir={setFiche} />
          </div>
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
            {fiche.motifAnnulation && <p className="ta-form-aide">Motif de l’annulation : {fiche.motifAnnulation}</p>}
            <div className="manager-modal-actions fiche-actions">
              {/* Action rare et irreversible : discrete, a gauche, et jamais a cote du bouton principal. */}
              {peutReserver && ['CONFIRMEE', 'EN_ATTENTE_PAIEMENT'].includes(fiche.statut) && (() => {
                const refus = refusAnnulation(fiche, role)
                return refus
                  ? <span className="fiche-annuler-refus"><i className="fa-solid fa-lock" aria-hidden="true" /> {refus}</span>
                  : (
                    <button className="fiche-annuler" type="button" onClick={() => setAnnulation(fiche)}>
                      <i className="fa-solid fa-ban" aria-hidden="true" /> Annuler la réservation…
                    </button>
                  )
              })()}
              <button className="manager-button manager-button-primary" type="button" onClick={() => setFiche(null)}>Fermer</button>
            </div>
          </section>
        </div>
      )}

      {annulation && (
        <AnnulationModal reservation={annulation} onConfirmer={annuler} onFermer={() => setAnnulation(null)} />
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
