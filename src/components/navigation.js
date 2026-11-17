// Espaces du back-office : les pages d'une meme tache sont regroupees sous
// une seule entree du menu, et reliees par des onglets en haut de page
// (moins d'entrees a parcourir, pages liees cote a cote).
export const GROUPES = {
  planning: {
    label: 'Planning',
    onglets: [
      { path: '/planning', label: 'Réservations', icon: 'fa-calendar-days', roles: ['GERANT', 'ACCUEIL', 'CONTROLEUR'], accent: 'var(--marque)', accentBg: 'var(--marque-pale)', stat: 'Réservations du jour' },
      { path: '/abonnements', label: 'Abonnements', icon: 'fa-repeat', roles: ['GERANT', 'ACCUEIL'], accent: '#2f6fed', accentBg: '#e8eefc', stat: 'Abonnements actifs' },
      { path: '/blocages', label: 'Fermetures', icon: 'fa-ban', roles: ['GERANT', 'ACCUEIL'], accent: '#b3261e', accentBg: '#fbe4e2', stat: 'Fermetures à venir' },
      { path: '/scan', label: 'Scanner un ticket', icon: 'fa-qrcode', roles: ['GERANT', 'ACCUEIL', 'CONTROLEUR'], accent: '#1f6f57', accentBg: '#e2f2ec', stat: 'Entrées validées aujourd’hui' },
    ],
  },
  complexe: {
    label: 'Mon complexe',
    onglets: [
      { path: '/terrains', label: 'Terrains et tarifs', icon: 'fa-futbol', roles: ['GERANT'], accent: 'var(--marque)', accentBg: 'var(--marque-pale)', stat: 'Terrains' },
      // Avis : ouverts depuis la note posee sur chaque carte terrain, pas en carte.
      { path: '/avis', label: 'Avis des joueurs', icon: 'fa-star', roles: ['GERANT'], horsCartes: true },
    ],
  },
  vitrine: {
    label: 'Annonces',
    onglets: [
      { path: '/annonces', label: 'Annonces', icon: 'fa-bullhorn', roles: ['GERANT'], accent: '#9c6b0c', accentBg: '#f6ecd9', stat: 'Annonces en ligne' },
    ],
  },
}

/** Onglets d'un groupe visibles pour ce role. */
export function ongletsPour(groupe, role) {
  return (GROUPES[groupe]?.onglets || []).filter((o) => o.roles.includes(role) && !o.horsCartes)
}

/** Le chemin courant appartient-il a ce groupe ? */
export function dansGroupe(groupe, chemin) {
  return (GROUPES[groupe]?.onglets || []).some((o) => chemin === o.path || chemin.startsWith(`${o.path}/`))
}
