// Statuts d'un terrain pour les cartes de filtre (memes cartes que les
// produits de l'app resto) : en ligne, a completer, brouillon.
export const STATUTS_TERRAIN = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec',
    vide: 'Aucun terrain réservable avec photo.' },
  { key: 'A_COMPLETER', label: 'À compléter', icon: 'fa-image', accent: '#9c6b0c', accentBg: '#f6ecd9',
    vide: 'Tous les terrains réservables ont une photo.' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#5b5b5f', accentBg: '#ececea',
    vide: 'Aucun brouillon : tous les terrains sont réservables.' },
]

/** ACTIF : reservable avec photo ; A_COMPLETER : reservable sans photo ; BROUILLON : non reservable. */
export function statutTerrain(t) {
  if (!t.actif) return 'BROUILLON'
  return t.photos?.length || t.photoUrl ? 'ACTIF' : 'A_COMPLETER'
}
