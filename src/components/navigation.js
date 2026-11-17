// Espaces du back-office : les pages d'une meme tache sont regroupees sous
// une seule entree du menu, et reliees par des onglets en haut de page
// (moins d'entrees a parcourir, pages liees cote a cote).
export const GROUPES = {
  planning: {
    label: 'Planning',
    onglets: [
      { path: '/planning', label: 'Réservations', icon: 'fa-calendar-days', roles: ['GERANT', 'ACCUEIL', 'CONTROLEUR'] },
      { path: '/abonnements', label: 'Abonnements', icon: 'fa-repeat', roles: ['GERANT', 'ACCUEIL'] },
      { path: '/blocages', label: 'Fermetures', icon: 'fa-ban', roles: ['GERANT', 'ACCUEIL'] },
      { path: '/scan', label: 'Scanner un ticket', icon: 'fa-qrcode', roles: ['GERANT', 'ACCUEIL', 'CONTROLEUR'] },
    ],
  },
  complexe: {
    label: 'Mon complexe',
    onglets: [
      { path: '/terrains', label: 'Terrains et tarifs', icon: 'fa-futbol', roles: ['GERANT'] },
      { path: '/horaires', label: 'Horaires', icon: 'fa-clock', roles: ['GERANT'] },
    ],
  },
  vitrine: {
    label: 'Vitrine',
    onglets: [
      { path: '/annonces', label: 'Annonces', icon: 'fa-bullhorn', roles: ['GERANT'] },
      { path: '/avis', label: 'Avis des joueurs', icon: 'fa-star', roles: ['GERANT'] },
    ],
  },
}

/** Onglets d'un groupe visibles pour ce role. */
export function ongletsPour(groupe, role) {
  return (GROUPES[groupe]?.onglets || []).filter((o) => o.roles.includes(role))
}

/** Le chemin courant appartient-il a ce groupe ? */
export function dansGroupe(groupe, chemin) {
  return (GROUPES[groupe]?.onglets || []).some((o) => chemin === o.path || chemin.startsWith(`${o.path}/`))
}
