import { ROLES_EQUIPE_ACTIFS } from '../../config/fonctionnalites.js'

// Journal des gerants (Admin) : une sous-page par carte, comme le journal
// par role de SenYummies. Chaque carte regroupe les types d'actions du
// backend (JournalActions.Domaine) qu'un gerant peut produire.
export const SECTIONS_JOURNAL = [
  { slug: 'reservations', label: 'Réservations', icon: 'fa-calendar-check', domaines: ['RESERVATION', 'PAIEMENT'], accent: 'var(--marque)', accentBg: 'var(--marque-pale)' },
  { slug: 'terrains', label: 'Terrains et horaires', icon: 'fa-futbol', domaines: ['TERRAIN', 'REGLAGE'], accent: '#2f6fed', accentBg: '#e8eefc' },
  { slug: 'sports', label: 'Sports', icon: 'fa-medal', domaines: ['SPORT'], accent: '#1f6f57', accentBg: '#e2f2ec' },
  { slug: 'fermetures', label: 'Fermetures', icon: 'fa-ban', domaines: ['BLOCAGE'], accent: '#b3261e', accentBg: '#fbe4e2' },
  { slug: 'annonces', label: 'Annonces', icon: 'fa-bullhorn', domaines: ['ANNONCE'], accent: '#9c6b0c', accentBg: '#f6ecd9' },
]

/** Journal decoupe en sous-pages par carte (roles Accueil / Controleur mis de cote). */
export const JOURNAL_PAR_SECTIONS = !ROLES_EQUIPE_ACTIFS

export function sectionDepuisSlug(slug) {
  return SECTIONS_JOURNAL.find((s) => s.slug === slug) ?? null
}

/** Premiere sous-page du journal (lien du menu et redirections). */
export const CHEMIN_JOURNAL = JOURNAL_PAR_SECTIONS ? `/journal-audit/${SECTIONS_JOURNAL[0].slug}` : '/journal-audit/gerant'
