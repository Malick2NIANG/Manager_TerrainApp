// Cadrage d'une photo de terrain : la photo est gardee entiere et le cadre
// 4:3 des cartes est decrit par sa position en %, notee a la fin de l'adresse
// (".../photo.jpg#c=50,30"). Les cartes l'appliquent en object-position ; la
// visionneuse montre la photo entiere. Le fragment n'est jamais envoye au serveur.
const CADRAGE = /#c=(\d{1,3}),(\d{1,3})$/

export function sansCadrage(url) {
  return String(url || '').replace(CADRAGE, '')
}

export function avecCadrage(url, x, y) {
  const borne = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)))
  return `${sansCadrage(url)}#c=${borne(x)},${borne(y)}`
}

/** Position CSS ("50% 30%") du cadre choisi, undefined sans cadrage (centre). */
export function positionCadrage(url) {
  const m = CADRAGE.exec(String(url || ''))
  return m ? `${Math.min(100, Number(m[1]))}% ${Math.min(100, Number(m[2]))}%` : undefined
}
