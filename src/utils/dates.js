// Le complexe est a Dakar (UTC+0, sans heure d'ete) : dates affichees et
// choisies a l'heure de Dakar, quel que soit le poste.
const FUSEAU = 'Africa/Dakar'
const fmt = (options) => new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, ...options })
const HEURE = fmt({ hour: '2-digit', minute: '2-digit' })
const DATE_LONGUE = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
const DATE_COURTE = fmt({ weekday: 'short', day: 'numeric', month: 'short' })

/** "YYYY-MM-DD" du jour a Dakar. */
export function jourISO(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10)
}

/** Jour ISO decale de n jours. */
export function decalerJour(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return jourISO(d)
}

export const heure = (instant) => HEURE.format(new Date(instant))
export const dateLongue = (instant) => DATE_LONGUE.format(new Date(instant))
export const dateCourte = (instant) => DATE_COURTE.format(new Date(instant))
export const plage = (debut, fin) => `${heure(debut)} – ${heure(fin)}`

/** "2026-11-20" + "19:30" -> instant ISO (Dakar = UTC). */
export const instantDe = (jour, hhmm) => `${jour}T${hhmm}:00Z`

export function formatFCFA(montant) {
  return `${Number(montant || 0).toLocaleString('fr-FR')} F CFA`
}

/** "Aujourd’hui", "Demain", "Hier", "Dans 3 jours", "Il y a 2 jours" (par rapport a aujourd'hui). */
export function jourRelatif(iso, reference = jourISO()) {
  const n = Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${reference}T12:00:00Z`)) / 86400000)
  if (n === 0) return 'Aujourd’hui'
  if (n === 1) return 'Demain'
  if (n === -1) return 'Hier'
  return n > 0 ? `Dans ${n} jours` : `Il y a ${-n} jours`
}
