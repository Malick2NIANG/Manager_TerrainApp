import { MOYENS } from '../planning/statuts.jsx'

// Logos des moyens de paiement (memes sources que l'App Client) :
// Wave (icone officielle), Orange Money (symbole), Mixx by Yas (logo sur
// bleu marine), especes (billets).
export function LogoMoyen({ moyen }) {
  if (moyen === 'wave') {
    return <span className="mp-logo is-wave" aria-hidden="true"><img src="/logos-paiement/wave.png" alt="" /></span>
  }
  if (moyen === 'orange-money') {
    return (
      <span className="mp-logo is-om" aria-hidden="true">
        <svg viewBox="3 4.5 32 32" focusable="false">
          <path fill="#000" transform="translate(4 13.765)" d="M3.413.333c-1.034 0-1.871.832-1.871 1.858 0 1.027.837 1.859 1.87 1.859h4.699L.548 11.56a1.85 1.85 0 0 0 0 2.628 1.88 1.88 0 0 0 2.646 0l7.562-7.512v4.667c0 1.026.837 1.858 1.871 1.858 1.033 0 1.87-.832 1.87-1.858V2.19a1.864 1.864 0 0 0-1.87-1.858H3.413z" />
          <path fill="#FF7900" transform="translate(19.867 12.065)" d="M2.372 14.902h9.215c1.033 0 1.87-.832 1.87-1.858a1.864 1.864 0 0 0-1.87-1.858H6.889l7.562-7.512a1.85 1.85 0 0 0 0-2.628 1.88 1.88 0 0 0-2.645 0L4.243 8.558V3.892a1.865 1.865 0 0 0-1.87-1.859c-1.034 0-1.871.832-1.871 1.859v9.152c0 1.026.837 1.858 1.87 1.858" />
        </svg>
      </span>
    )
  }
  if (moyen === 'mixx-yas') {
    return <span className="mp-logo is-mixx" aria-hidden="true"><img src="/logos-paiement/mixx-yas.svg" alt="" /></span>
  }
  return <span className="mp-logo is-especes" aria-hidden="true"><i className="fa-solid fa-money-bill-wave" /></span>
}

/** Choix du moyen de paiement : cartes avec logo. */
export default function MoyensPaiement({ valeur, onChange, moyens, compact = false }) {
  return (
    <div className={`mp-choix ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label="Moyen de paiement">
      {moyens.map((m) => (
        <button key={m} type="button" role="radio" aria-checked={valeur === m} className={`mp-option ${valeur === m ? 'is-actif' : ''}`}
          onClick={() => onChange(m)}>
          <LogoMoyen moyen={m} />
          <span>{MOYENS[m]}</span>
        </button>
      ))}
    </div>
  )
}
