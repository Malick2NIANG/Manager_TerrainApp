import { formatFCFA } from '../../utils/dates.js'
import { monnaie, sommesProposees } from './caisse.js'

// Especes : somme recue du client (saisie ou boutons rapides) et monnaie a
// rendre calculee, en grand. Rouge si la somme ne suffit pas.
export default function CaisseEspeces({ montant, recu, onRecu }) {
  const rendu = monnaie(recu, montant)
  return (
    <div className="caisse">
      <label className="caisse-recu">
        <span>Reçu du client</span>
        <input type="number" inputMode="numeric" min={0} step={500} value={recu} placeholder={String(montant)}
          onChange={(e) => onRecu(e.target.value)} aria-describedby="caisse-rendu" />
      </label>
      <div className="caisse-rapides" aria-label="Montants rapides">
        {sommesProposees(montant).map((s) => (
          <button key={s} type="button" className={Number(recu) === s ? 'is-actif' : ''} onClick={() => onRecu(String(s))}>
            {s === Number(montant) ? 'Compte juste' : formatFCFA(s)}
          </button>
        ))}
      </div>
      <div id="caisse-rendu" className={`caisse-rendu ${rendu !== null && rendu < 0 ? 'is-manque' : ''}`} aria-live="polite">
        <span>{rendu !== null && rendu < 0 ? 'Il manque' : 'À rendre'}</span>
        <strong>{rendu === null ? '—' : formatFCFA(Math.abs(rendu))}</strong>
      </div>
    </div>
  )
}
