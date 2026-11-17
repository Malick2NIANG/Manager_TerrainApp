import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import EnTetePage from '../../components/EnTetePage.jsx'
import Volet from '../../components/Volet.jsx'
import { apiGet, apiPost } from '../../api/client.js'
import { dateCourte, dateLongue, formatFCFA, heure } from '../../utils/dates.js'
import { BadgeStatut, MOYENS, telephoneLisible } from '../planning/statuts.jsx'
import AbonnementModal from './AbonnementModal.jsx'
import EncaisserSeance from './EncaisserSeance.jsx'
import { REGLEMENTS, aEncaisser, libelleRegle } from './abonnements.js'
import '../../styles/terrains.css'

// Abonnements vendus au comptoir. Couche 1 : les abonnements actifs (qui,
// quand, ou en est-on, que reste-t-il a encaisser). Couche 2 : la fiche
// (seances, encaissement, resiliation). Les resilies sont replies en bas.
export default function Abonnements() {
  const [abonnements, setAbonnements] = useState(null)
  const [terrains, setTerrains] = useState([])
  const [erreur, setErreur] = useState(null)
  const [toast, setToast] = useState(null)
  const [creation, setCreation] = useState(false)
  const [ficheId, setFicheId] = useState(null)
  const [resiliation, setResiliation] = useState(null)

  const charger = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([apiGet('/abonnements'), apiGet('/terrains')])
      setAbonnements(a)
      setTerrains(t.filter((x) => x.actif !== false))
      setErreur(null)
    } catch (e) {
      setErreur(e.message)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const actifs = useMemo(() => (abonnements || []).filter((a) => a.statut === 'ACTIF'), [abonnements])
  const resilies = useMemo(() => (abonnements || []).filter((a) => a.statut !== 'ACTIF'), [abonnements])
  const aEncaisserTotal = actifs.reduce((s, a) => s + a.resteAEncaisser, 0)
  const fiche = abonnements?.find((a) => a.id === ficheId) || null

  const notifier = (type, message) => setToast({ id: Date.now(), type, message })

  async function resilier() {
    const a = resiliation
    setResiliation(null)
    try {
      await apiPost(`/abonnements/${a.id}/resiliation`)
      notifier('success', `Abonnement de ${a.clientNom} résilié : les séances à venir sont libérées.`)
      charger()
    } catch (e) {
      notifier('error', e.message)
    }
  }

  const carte = (a) => (
    <button key={a.id} type="button" className={`ab-carte ${a.statut !== 'ACTIF' ? 'ta-inactif' : ''}`} onClick={() => setFicheId(a.id)}>
      <span className="ab-carte-tete">
        <strong>{a.clientNom}</strong>
        {a.seancesAEncaisser > 0
          ? <span className="planning-badge is-attente">{a.seancesAEncaisser} à encaisser</span>
          : <span className="planning-badge is-confirmee">{a.reglement === 'AVANCE' ? 'Payé' : 'À jour'}</span>}
      </span>
      <span className="ab-carte-regle"><i className="fa-solid fa-repeat" aria-hidden="true" /> {libelleRegle(a.frequence, a.premiereSeance, a.jours, a.seances.length)}</span>
      <span className="ab-carte-detail">{a.terrain} · {a.sport}</span>
      <span className="ab-progression" aria-label={`${a.seancesJouees} séances passées sur ${a.seances.filter((s) => s.statut !== 'ANNULEE').length}`}>
        <span style={{ width: `${Math.round((100 * a.seancesJouees) / Math.max(1, a.seances.filter((s) => s.statut !== 'ANNULEE').length))}%` }} />
      </span>
      <span className="ab-carte-detail">
        {a.statut === 'ACTIF'
          ? (a.prochaineSeance ? `Prochaine : ${dateCourte(a.prochaineSeance)}` : 'Toutes les séances sont passées')
          : `Résilié le ${dateCourte(a.resilieLe)}`}
      </span>
    </button>
  )

  return (
    <Layout>
      <EnTetePage groupe="planning"
        resume={abonnements ? `${actifs.length} actif${actifs.length > 1 ? 's' : ''}${aEncaisserTotal ? ` · ${formatFCFA(aEncaisserTotal)} à encaisser` : ''}` : null}
        aide="Un abonnement réserve le même créneau chaque semaine ou chaque mois pour un client. Les séances déjà prises ou fermées sont sautées. Le client paie tout d’avance, ou à chaque séance (encaissement ici ou depuis le planning)."
        actions={(
          <button className="manager-button manager-button-primary" type="button" onClick={() => setCreation(true)} disabled={!terrains.length}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Nouvel abonnement
          </button>
        )} />

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {abonnements === null && !erreur && <p className="planning-vide">Chargement…</p>}
      {abonnements && actifs.length === 0 && (
        <p className="planning-vide">Aucun abonnement en cours. Une équipe vient chaque semaine ? Créez-lui un abonnement.</p>
      )}
      {actifs.length > 0 && <div className="ab-liste">{actifs.map(carte)}</div>}

      {resilies.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Volet titre="Abonnements résiliés" icone="fa-box-archive" resume={`${resilies.length} abonnement${resilies.length > 1 ? 's' : ''}`}>
            <div className="ab-liste">{resilies.map(carte)}</div>
          </Volet>
        </div>
      )}

      {fiche && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFicheId(null)}>
          <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="fiche-ab-titre">
            <div className="manager-modal-header">
              <div>
                <p className="manager-eyebrow">Abonnement · {REGLEMENTS[fiche.reglement]}</p>
                <h2 id="fiche-ab-titre">{fiche.clientNom}</h2>
              </div>
              <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={() => setFicheId(null)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <dl className="ta-fiche">
              <dt>Créneau</dt><dd>{libelleRegle(fiche.frequence, fiche.premiereSeance, fiche.jours, fiche.seances.length)}</dd>
              <dt>Terrain</dt><dd>{fiche.terrain} · {fiche.sport}</dd>
              <dt>Téléphone</dt><dd><a href={`tel:${fiche.clientTelephone}`}>{telephoneLisible(fiche.clientTelephone)}</a></dd>
              <dt>Montant</dt><dd>{formatFCFA(fiche.montantTotal)}{fiche.remise > 0 && <small className="ta-form-aide"> (remise {formatFCFA(fiche.remise)})</small>}</dd>
              {fiche.resteAEncaisser > 0 && <><dt>À encaisser</dt><dd>{formatFCFA(fiche.resteAEncaisser)} ({fiche.seancesAEncaisser} séance{fiche.seancesAEncaisser > 1 ? 's' : ''})</dd></>}
            </dl>

            <h3 className="ab-titre-seances">Séances</h3>
            <ul className="ab-seances">
              {fiche.seances.map((s) => (
                <li key={s.id} className={s.statut === 'ANNULEE' ? 'ta-inactif' : ''}>
                  <span className="ab-seance-date">
                    <strong style={{ textTransform: 'capitalize' }}>{dateLongue(s.debut)}</strong>
                    <small>{heure(s.debut)} · {formatFCFA(s.montant)}{s.payeeLe ? ` · payé (${MOYENS[s.moyenPaiement] || s.moyenPaiement})` : ''}</small>
                  </span>
                  <BadgeStatut statut={s.statut} />
                  {aEncaisser(s) && (
                    <EncaisserSeance seance={s} onErreur={(m) => notifier('error', m)}
                      onFait={() => { notifier('success', `Séance du ${dateCourte(s.debut)} encaissée.`); charger() }} />
                  )}
                </li>
              ))}
            </ul>

            <div className="manager-modal-actions">
              {fiche.statut === 'ACTIF' && fiche.seancesAVenir > 0 && (
                <button className="manager-button manager-button-danger" type="button" onClick={() => setResiliation(fiche)}>
                  Résilier
                </button>
              )}
              <button className="manager-button manager-button-quiet" type="button" onClick={() => setFicheId(null)}>Fermer</button>
            </div>
          </section>
        </div>
      )}

      {resiliation && (
        <ConfirmModal
          title={`Résilier l’abonnement de ${resiliation.clientNom} ?`}
          message={`Les ${resiliation.seancesAVenir} séance(s) à venir sont annulées et les créneaux libérés. ${resiliation.reglement === 'AVANCE' ? 'Payé d’avance : remboursement des séances non jouées à faire.' : ''}`}
          confirmLabel="Résilier"
          cancelLabel="Retour"
          tone="danger"
          icon="fa-ban"
          onConfirm={resilier}
          onCancel={() => setResiliation(null)}
        />
      )}

      {creation && (
        <AbonnementModal
          terrains={terrains}
          onFermer={() => setCreation(false)}
          onCree={(a) => {
            setCreation(false)
            notifier('success', `Abonnement de ${a.clientNom} créé : ${a.seances.length} séances réservées.`)
            charger()
          }}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
