import { useState } from 'react'
import { apiPost } from '../../api/client.js'
import { formatFCFA } from '../../utils/dates.js'
import { MOYENS, MOYENS_COMPTOIR } from '../planning/statuts.jsx'
import MoyensPaiement from '../caisse/MoyensPaiement.jsx'
import CaisseEspeces from '../caisse/CaisseEspeces.jsx'
import { imprimerRecu, monnaie } from '../caisse/caisse.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { marque } from '../../config/marque.js'

// Seance d'abonnement payable le jour J : moyen (logos), especes recues et
// monnaie rendue, encaissement, puis recu imprimable.
export default function EncaisserSeance({ seance, onFait, onErreur }) {
  const { username } = useAuth()
  const [moyen, setMoyen] = useState('especes')
  const [recu, setRecu] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [payee, setPayee] = useState(null)
  const manque = moyen === 'especes' && recu !== '' && monnaie(recu, seance.montant) < 0

  async function encaisser() {
    setEnvoi(true)
    try {
      const r = await apiPost(`/reservations/${seance.id}/encaissement`, {
        moyenPaiement: moyen, especesRecues: moyen === 'especes' ? Number(recu || seance.montant) : null,
      })
      setPayee(r)
    } catch (e) {
      onErreur?.(e.message)
    } finally {
      setEnvoi(false)
    }
  }

  if (payee) {
    return (
      <div className="ab-encaisser is-fait">
        <span><i className="fa-solid fa-check" aria-hidden="true" /> Encaissé{payee.monnaieRendue ? ` · à rendre ${formatFCFA(payee.monnaieRendue)}` : ''}</span>
        <button className="manager-button manager-button-quiet" type="button"
          onClick={() => imprimerRecu(payee, { etablissement: marque.etablissement || marque.nom, moyens: MOYENS, caissier: username })}>
          <i className="fa-solid fa-print" aria-hidden="true" /> Reçu
        </button>
        <button className="manager-button manager-button-primary" type="button" onClick={() => onFait(payee)}>Terminer</button>
      </div>
    )
  }

  return (
    <div className="ab-encaisser">
      <MoyensPaiement valeur={moyen} onChange={setMoyen} moyens={MOYENS_COMPTOIR} compact />
      {moyen === 'especes' && <CaisseEspeces montant={seance.montant} recu={recu} onRecu={setRecu} />}
      <button className="manager-button manager-button-primary" type="button" onClick={encaisser} disabled={envoi || manque}>
        {envoi ? 'Encaissement…' : `Encaisser ${formatFCFA(seance.montant)}`}
      </button>
    </div>
  )
}
