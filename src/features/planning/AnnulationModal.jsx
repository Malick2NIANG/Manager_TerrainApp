import { useState } from 'react'
import { dateLongue, formatFCFA, plage } from '../../utils/dates.js'
import { MOYENS } from './statuts.jsx'

export const MOTIFS = ['Le client a demandé', 'Terrain indisponible', 'Réservation en double', 'Météo']

/** Annulation qui demande un remboursement : payee en ligne. */
export const aRembourser = (r) => r.canal === 'APP' && Boolean(r.payeeLe)

/**
 * Peut-on annuler cette reservation ? null si oui, sinon la raison
 * (memes regles que le serveur).
 */
export function refusAnnulation(r, role, maintenant = new Date()) {
  if (!['CONFIRMEE', 'EN_ATTENTE_PAIEMENT'].includes(r.statut)) return 'Cette réservation ne peut plus être annulée.'
  if (new Date(r.debut) <= maintenant) return 'Le créneau a commencé : il ne peut plus être annulé.'
  if (aRembourser(r) && role !== 'GERANT') return 'Payée en ligne : seul le gérant peut l’annuler (remboursement).'
  return null
}

// Annulation en deux temps : le motif (prevenu par SMS au client), et, pour
// une reservation payee en ligne, l'engagement de rembourser. Le bouton ne
// s'active qu'une fois ces points remplis.
export default function AnnulationModal({ reservation: r, onConfirmer, onFermer }) {
  const [motif, setMotif] = useState('')
  const [autre, setAutre] = useState('')
  const [rembourse, setRembourse] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const texte = motif === 'autre' ? autre.trim() : motif
  const remb = aRembourser(r)
  const pret = texte.length >= 3 && (!remb || rembourse)

  async function confirmer() {
    setEnvoi(true)
    try {
      await onConfirmer(texte)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="annulation-titre">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow is-danger">Annulation · {r.reference}</p>
            <h2 id="annulation-titre">Annuler la réservation de {r.clientNom} ?</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <p className="an-resume">
          {r.terrain} · <span style={{ textTransform: 'capitalize' }}>{dateLongue(r.debut)}</span> · {plage(r.debut, r.fin)}
        </p>

        <fieldset className="an-bloc">
          <legend>Motif <span className="ta-form-aide">envoyé au client par SMS</span></legend>
          <div className="ta-choix" role="radiogroup" aria-label="Motif">
            {[...MOTIFS, 'autre'].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={motif === m} className={motif === m ? 'is-actif' : ''}
                onClick={() => setMotif(m)}>
                {m === 'autre' ? 'Autre…' : m}
              </button>
            ))}
          </div>
          {motif === 'autre' && (
            <input className="an-autre" value={autre} onChange={(e) => setAutre(e.target.value)} maxLength={200}
              placeholder="Précisez le motif" autoFocus />
          )}
        </fieldset>

        {remb ? (
          <label className="an-remboursement">
            <input type="checkbox" checked={rembourse} onChange={(e) => setRembourse(e.target.checked)} />
            <span>
              <strong>Je rembourse {formatFCFA(r.montant)}</strong> au client ({MOYENS[r.moyenPaiement] || r.moyenPaiement},
              payé en ligne). Le SMS lui annoncera le remboursement.
            </span>
          </label>
        ) : (
          <p className="ta-form-aide">Le créneau redevient libre aussitôt.{r.canal === 'COMPTOIR' && r.payeeLe ? ' Payée au comptoir : rendez l’argent au client si besoin.' : ''}</p>
        )}

        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Garder la réservation</button>
          <button className="manager-button manager-button-danger" type="button" onClick={confirmer} disabled={!pret || envoi}>
            {envoi ? 'Annulation…' : 'Confirmer l’annulation'}
          </button>
        </div>
      </section>
    </div>
  )
}
