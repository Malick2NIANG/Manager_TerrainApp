import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { apiGet, apiPost } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useFluxPlanning from '../../hooks/useFluxPlanning.js'
import { dateLongue, decalerJour, formatFCFA, heure, jourISO, plage } from '../../utils/dates.js'
import { BadgeStatut, MOYENS, reservationDuCreneau, telephoneLisible } from './statuts.jsx'
import ComptoirModal from './ComptoirModal.jsx'
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
        aide="Touchez une réservation pour voir le client, le paiement ou l’annuler. Les créneaux libres apparaissent sous chaque terrain : touchez-en un pour réserver au comptoir."
        actions={peutReserver && (
          <button className="manager-button manager-button-primary" type="button" onClick={() => setComptoir({})}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Nouvelle réservation
          </button>
        )} />

      <div className="ta-toolbar">
        <div className="ta-jour">
          <button className="manager-icon-button" type="button" aria-label="Jour précédent" onClick={() => setJour((j) => decalerJour(j, -1))}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className="ta-jour-libelle">{dateLongue(`${jour}T12:00:00Z`)}</span>
          <button className="manager-icon-button" type="button" aria-label="Jour suivant" onClick={() => setJour((j) => decalerJour(j, 1))}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
          <input type="date" aria-label="Choisir un jour" value={jour} onChange={(e) => e.target.value && setJour(e.target.value)} />
          {jour !== jourISO() && (
            <button className="manager-button manager-button-quiet" type="button" onClick={() => setJour(jourISO())}>Aujourd’hui</button>
          )}
        </div>
        <span className="ta-toolbar-spacer" />
        <span className={`ta-live ${connecte ? 'is-on' : ''}`}>{connecte ? 'En direct' : 'Hors direct'}</span>
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {dispos === null && !erreur && <p className="planning-vide">Chargement du planning…</p>}
      {dispos && dispos.length === 0 && <p className="planning-vide">Aucun terrain : créez-en un dans « Terrains et tarifs ».</p>}

      {dispos && (
        <div className="planning-grille">
          {dispos.map((t) => (
            <section className="planning-terrain" key={t.terrainId} aria-label={t.terrain}>
              <header className="planning-terrain-tete">
                <h2>{t.terrain}</h2>
                <span>{t.sport}</span>
              </header>
              {t.creneaux.length === 0 ? (
                <p className="planning-vide">Fermé ce jour-là.</p>
              ) : (() => {
                // L'essentiel d'abord : reservations et fermetures ; les
                // creneaux libres a venir en une ligne d'heures ; les
                // creneaux libres deja passes ne s'affichent pas.
                const occupes = t.creneaux.map((c) => ({ c, r: reservationDuCreneau(reservations, t.terrainId, c.debut, c.fin) }))
                  .filter(({ c, r }) => r || c.etat === 'BLOQUE')
                const libres = t.creneaux.filter((c) => c.etat === 'LIBRE' && !reservationDuCreneau(reservations, t.terrainId, c.debut, c.fin))
                return (
                  <>
                    {occupes.length === 0 && <p className="planning-vide">Aucune réservation.</p>}
                    {occupes.length > 0 && (
                      <div className="planning-creneaux">
                        {occupes.map(({ c, r }) => (r ? (
                          <button key={c.debut} type="button" className="planning-creneau is-reserve" onClick={() => setFiche(r)}>
                            <span className="planning-creneau-heure">{heure(c.debut)}</span>
                            <span className="planning-creneau-corps">
                              <strong>{r.clientNom}</strong>
                              <small>
                                {r.abonnementId ? <span className="planning-tag"><i className="fa-solid fa-repeat" aria-hidden="true" /> Abonnement</span>
                                  : `${r.reference} · ${r.canal === 'COMPTOIR' ? 'Comptoir' : 'En ligne'}`}
                                {aEncaisser(r) && <> <span className="planning-tag is-du">À encaisser</span></>}
                              </small>
                            </span>
                            <BadgeStatut statut={r.statut} />
                          </button>
                        ) : (
                          <div key={c.debut} className="planning-creneau is-bloque">
                            <span className="planning-creneau-heure">{heure(c.debut)}</span>
                            <span className="planning-creneau-corps"><strong>Fermé</strong></span>
                          </div>
                        )))}
                      </div>
                    )}
                    {libres.length > 0 && (
                      <div className="planning-libres">
                        <span className="planning-libres-titre">{libres.length} libre{libres.length > 1 ? 's' : ''}</span>
                        <div className="planning-libres-heures">
                          {libres.map((c) => (peutReserver ? (
                            <button key={c.debut} type="button" title={`Réserver ${heure(c.debut)} · ${formatFCFA(c.prix)}`}
                              onClick={() => setComptoir({ terrainId: t.terrainId, debut: c.debut })}>{heure(c.debut)}</button>
                          ) : <span key={c.debut}>{heure(c.debut)}</span>))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </section>
          ))}
        </div>
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
