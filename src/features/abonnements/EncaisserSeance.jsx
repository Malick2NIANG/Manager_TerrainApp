import { useState } from 'react'
import { apiPost } from '../../api/client.js'
import { formatFCFA } from '../../utils/dates.js'
import { MOYENS, MOYENS_COMPTOIR } from '../planning/statuts.jsx'

// Seance d'abonnement payable le jour J : choix du moyen, puis encaissement.
export default function EncaisserSeance({ seance, onFait, onErreur }) {
  const [moyen, setMoyen] = useState('especes')
  const [envoi, setEnvoi] = useState(false)

  async function encaisser() {
    setEnvoi(true)
    try {
      const r = await apiPost(`/reservations/${seance.id}/encaissement`, { moyenPaiement: moyen })
      onFait(r)
    } catch (e) {
      onErreur?.(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="ab-encaisser">
      <select value={moyen} onChange={(e) => setMoyen(e.target.value)} aria-label="Moyen de paiement" disabled={envoi}>
        {MOYENS_COMPTOIR.map((m) => <option key={m} value={m}>{MOYENS[m]}</option>)}
      </select>
      <button className="manager-button manager-button-primary" type="button" onClick={encaisser} disabled={envoi}>
        {envoi ? 'Encaissement…' : `Encaisser ${formatFCFA(seance.montant)}`}
      </button>
    </div>
  )
}
