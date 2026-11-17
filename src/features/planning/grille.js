// Geometrie du planning en grille (heures en lignes, terrains en colonnes).
// Dakar = UTC : les minutes sont comptees depuis 00:00 du jour affiche, et
// peuvent depasser 24 h pour les creneaux de nuit (ex. 00:00 -> 1440).

export const MINUTE_PX = 64 / 60 // une heure = 64 px

/** Minutes depuis 00:00 du jour ("YYYY-MM-DD"). */
export function minutesDepuis(jour, instant) {
  return Math.round((new Date(instant).getTime() - Date.parse(`${jour}T00:00:00Z`)) / 60000)
}

/** Debut et fin de l'axe (heures pleines) couvrant tous les creneaux du jour. */
export function bornes(jour, dispos) {
  const tous = dispos.flatMap((t) => t.creneaux)
  if (!tous.length) return null
  const debut = Math.min(...tous.map((c) => minutesDepuis(jour, c.debut)))
  const fin = Math.max(...tous.map((c) => minutesDepuis(jour, c.fin)))
  return { debut: Math.floor(debut / 60) * 60, fin: Math.ceil(fin / 60) * 60 }
}

/** Libelles des heures de l'axe : "09:00", ..., "00:00" pour minuit. */
export function heuresAxe({ debut, fin }) {
  const h = []
  for (let m = debut; m < fin; m += 60) h.push(`${String(Math.floor(m / 60) % 24).padStart(2, '0')}:00`)
  return h
}

/** Position verticale d'un bloc [debut, fin[ dans l'axe. */
export function position(jour, axe, debut, fin) {
  const d = minutesDepuis(jour, debut)
  const f = minutesDepuis(jour, fin)
  return { top: (d - axe.debut) * MINUTE_PX, height: Math.max(18, (f - d) * MINUTE_PX) }
}
