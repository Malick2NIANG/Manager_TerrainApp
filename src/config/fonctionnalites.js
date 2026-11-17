// Roles Accueil et Controleur : mis de cote pour l'instant, le Gerant couvre
// deja le comptoir (reservations, encaissements) et le controle des entrees.
// Passer ROLES_EQUIPE_ACTIFS a true pour les reactiver : menu Equipe,
// creation des comptes, journal par role et connexion reviennent tels quels.
// Le backend, lui, gere toujours ces roles.
export const ROLES_EQUIPE_ACTIFS = false

export const ROLES_EQUIPE = ['ACCUEIL', 'CONTROLEUR']

/** Ce role peut-il se connecter et apparaitre dans l'app ? */
export function roleActif(role, actifs = ROLES_EQUIPE_ACTIFS) {
  return actifs || !ROLES_EQUIPE.includes(role)
}

export const MESSAGE_ROLE_INACTIF = 'Les comptes Accueil et Contrôleur sont désactivés pour le moment : connectez-vous avec le compte Gérant.'
