// Statuts de reservation (memes codes que l'API).
export const STATUTS = {
  EN_ATTENTE_PAIEMENT: { libelle: 'Paiement en attente', classe: 'is-attente' },
  CONFIRMEE: { libelle: 'Confirmée', classe: 'is-confirmee' },
  HONOREE: { libelle: 'Entrée validée', classe: 'is-honoree' },
  ANNULEE: { libelle: 'Annulée', classe: 'is-annulee' },
  EXPIREE: { libelle: 'Expirée', classe: 'is-annulee' },
}

export const MOYENS = {
  especes: 'Espèces',
  wave: 'Wave',
  'orange-money': 'Orange Money',
  'mixx-yas': 'Mixx by Yas',
  carte: 'Carte bancaire',
}

/** Moyens proposes au comptoir. */
export const MOYENS_COMPTOIR = ['especes', 'wave', 'orange-money', 'mixx-yas']

export function BadgeStatut({ statut }) {
  const s = STATUTS[statut] || { libelle: statut, classe: '' }
  return <span className={`planning-badge ${s.classe}`}>{s.libelle}</span>
}

/** Reservations qui occupent un creneau (les annulees/expirees le liberent). */
export const OCCUPANTS = ['EN_ATTENTE_PAIEMENT', 'CONFIRMEE', 'HONOREE']

/** Reservation occupant le creneau [debut, fin[ de ce terrain, s'il y en a une. */
export function reservationDuCreneau(reservations, terrainId, debut, fin) {
  const d = new Date(debut).getTime()
  const f = new Date(fin).getTime()
  return reservations.find((r) => r.terrainId === terrainId && OCCUPANTS.includes(r.statut)
    && new Date(r.debut).getTime() < f && new Date(r.fin).getTime() > d) || null
}

/** "+221771234567" -> "77 123 45 67" */
export function telephoneLisible(tel) {
  const local = String(tel || '').replace(/^\+221/, '')
  if (local.length !== 9) return tel || ''
  return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
}
