// Regles d'affichage des abonnements (memes regles que le serveur).
const FUSEAU = 'Africa/Dakar'
const JOUR = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, weekday: 'long' })
const HEURE = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' })

export const FREQUENCES = {
  HEBDOMADAIRE: { libelle: 'Chaque semaine', max: 52, presets: [4, 8, 12, 24] },
  MENSUELLE: { libelle: 'Chaque mois', max: 12, presets: [3, 6, 12] },
  PERSONNALISEE: { libelle: 'Dates au choix', max: 52, presets: [] },
}

export const JOURS_SEMAINE = [
  { n: 1, court: 'Lun', long: 'lundi' }, { n: 2, court: 'Mar', long: 'mardi' }, { n: 3, court: 'Mer', long: 'mercredi' },
  { n: 4, court: 'Jeu', long: 'jeudi' }, { n: 5, court: 'Ven', long: 'vendredi' }, { n: 6, court: 'Sam', long: 'samedi' },
  { n: 7, court: 'Dim', long: 'dimanche' },
]

/** Jour de la semaine (1 = lundi ... 7) d'un instant, a Dakar. */
export const jourDe = (instant) => ((new Date(instant).getUTCDay() + 6) % 7) + 1

const enumerer = (mots) => (mots.length <= 1 ? mots.join('') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`)

export const REGLEMENTS = {
  AVANCE: 'Payé d’avance',
  SEANCE: 'À chaque séance',
}

const RANGS = ['1er', '2e', '3e', '4e']

/**
 * "Chaque samedi à 18:00", "Chaque mardi et jeudi à 18:00", "Le 1er samedi
 * du mois à 18:00", "Le dernier samedi du mois à 18:00", "5 dates au choix à 18:00".
 */
export function libelleRegle(frequence, premiereSeance, jours = [], nombreDates = 0) {
  const d = new Date(premiereSeance)
  const jour = JOUR.format(d)
  const h = HEURE.format(d)
  if (frequence === 'PERSONNALISEE') return `${nombreDates} date${nombreDates > 1 ? 's' : ''} au choix à ${h}`
  if (frequence === 'HEBDOMADAIRE') {
    const choisis = jours?.length > 1 ? JOURS_SEMAINE.filter((j) => jours.includes(j.n)).map((j) => j.long) : [jour]
    return `Chaque ${enumerer(choisis)} à ${h}`
  }
  const rang = Math.floor((d.getUTCDate() - 1) / 7)
  return `Le ${rang >= 4 ? 'dernier' : RANGS[rang]} ${jour} du mois à ${h}`
}

/** Seance payable le jour J pas encore encaissee. */
export function aEncaisser(r) {
  return Boolean(r && r.abonnementId && !r.payeeLe && ['CONFIRMEE', 'HONOREE'].includes(r.statut))
}

/** Remise saisie : entier >= 0, au plus le total. Message d'erreur ou null. */
export function refusRemise(remise, total) {
  if (remise === '' || remise === null || remise === undefined) return null
  const n = Number(remise)
  if (!Number.isInteger(n) || n < 0) return 'La remise est un montant en F CFA.'
  if (n > total) return 'La remise dépasse le total.'
  return null
}
