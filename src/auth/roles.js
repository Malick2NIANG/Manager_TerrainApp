import { ROLES_EQUIPE_ACTIFS } from '../config/fonctionnalites.js'
// Roles du personnel, identiques a l'enum Role du backend (Backend_TerrainApp).
export const ROLES = ['GERANT', 'ACCUEIL', 'CONTROLEUR', 'ADMIN']

export const ROLE_LABELS = {
  GERANT: 'Gérant',
  ACCUEIL: 'Accueil',
  CONTROLEUR: 'Contrôleur',
  ADMIN: 'Admin',
}

// Espace d'arrivee de chaque role apres connexion.
export const ROLE_HOME = {
  GERANT: '/dashboard',
  ACCUEIL: '/planning',
  CONTROLEUR: '/scan',
  ADMIN: '/dashboard',
}

// Roles autorises par ecran. Le backend reste l'autorite (403 sur chaque
// appel) : ce filtrage evite seulement d'afficher un ecran inutilisable.
export const ROUTE_ROLES = {
  '/dashboard': ROLES,
  '/planning': ['GERANT', 'ACCUEIL', 'CONTROLEUR'],
  '/scan': ['GERANT', 'ACCUEIL', 'CONTROLEUR'],
  '/abonnements': ['GERANT', 'ACCUEIL'],
  '/blocages': ['GERANT', 'ACCUEIL'],
  '/terrains': ['GERANT'],
  '/annonces': ['GERANT'],
  '/avis': ['GERANT'],
  '/historique': ['GERANT'],
  // Le Gerant gere l'Accueil et les Controleurs ; l'Admin gere les Gerants
  // et consulte le reste de l'equipe (meme partage que SenYummies).
  // Equipe (comptes Accueil / Controleur) : masquee tant que ces roles sont mis de cote.
  '/personnel': ROLES_EQUIPE_ACTIFS ? ['GERANT'] : [],
  '/equipe': ['ADMIN'],
  '/journal-audit': ['ADMIN'],
  '/journal-audit/:roleSlug': ['ADMIN'],
}

export function isKnownRole(role) {
  return ROLES.includes(role)
}
