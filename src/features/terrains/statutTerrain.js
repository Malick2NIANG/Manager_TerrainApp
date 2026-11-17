// Statuts d'un terrain, comme les produits de l'app resto : actif (publie,
// reservable), brouillon (en preparation ou depublie), archive (retire).
export const STATUTS_TERRAIN = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec',
    vide: 'Aucun terrain publié : publiez un brouillon pour l’ouvrir à la réservation.' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9',
    vide: 'Aucun brouillon. Pour modifier un terrain publié, dépubliez-le : il arrive ici.' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea',
    vide: 'Aucun terrain archivé.' },
]

export const LIBELLES_STATUT = { ACTIF: 'Actif', BROUILLON: 'Brouillon', ARCHIVE: 'Archivé' }

/** Statut du serveur (ou deduit de « actif » pour un ancien serveur). */
export function statutTerrain(t) {
  return t.statut || (t.actif ? 'ACTIF' : 'BROUILLON')
}
