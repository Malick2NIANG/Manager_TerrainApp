// Durees de location : le gerant coche les durees proposees pour un terrain
// (ex. 1 h, 1 h 30, 2 h) ; le joueur choisit son heure de debut puis une de
// ces durees. La grille des creneaux est decoupee au pas commun des durees.

/** "1 h", "1 h 30", "45 min". */
export function libelleDuree(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/** Durees proposees pour un terrain (au moins la duree de creneau), triees. */
export function dureesDe(terrain, dispo) {
  const liste = dispo?.dureesProposees?.length ? dispo.dureesProposees
    : terrain?.dureesProposees?.length ? terrain.dureesProposees
      : terrain?.dureeCreneauMinutes ? [terrain.dureeCreneauMinutes] : []
  return [...new Set(liste)].sort((a, b) => a - b)
}

/** "1 h", "1 h a 2 h" : pour la fiche et la carte d'un terrain. */
export function resumeDurees(durees) {
  if (!durees.length) return ''
  if (durees.length === 1) return libelleDuree(durees[0])
  return `${libelleDuree(durees[0])} à ${libelleDuree(durees[durees.length - 1])}`
}

/**
 * Pour une heure de debut, chaque duree proposee : possible si les creneaux
 * consecutifs qui la couvrent sont tous libres, sans trou ni fermeture.
 * Renvoie [{ minutes, possible, fin, prix }].
 */
export function optionsDuree(creneaux, debut, durees) {
  const i = (creneaux || []).findIndex((c) => c.debut === debut)
  return durees.map((minutes) => {
    if (i < 0) return { minutes, possible: false, fin: null, prix: 0 }
    let fin = creneaux[i].debut
    let prix = 0
    let duree = 0
    for (let k = i; k < creneaux.length && duree < minutes; k++) {
      const c = creneaux[k]
      if (c.etat !== 'LIBRE' || c.debut !== fin) return { minutes, possible: false, fin: null, prix: 0 }
      duree += Math.round((Date.parse(c.fin) - Date.parse(c.debut)) / 60000)
      prix += c.prix
      fin = c.fin
    }
    return duree === minutes ? { minutes, possible: true, fin, prix } : { minutes, possible: false, fin: null, prix: 0 }
  })
}
