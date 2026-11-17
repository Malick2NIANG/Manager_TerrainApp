import { MOYENS, STATUTS, telephoneLisible } from '../planning/statuts.jsx'

// Periodes rapides de l'historique (date du match). La periode
// personnalisee est limitee a un an par l'API.
export const PERIODES = [
  { cle: '7j', libelle: '7 jours' },
  { cle: '30j', libelle: '30 jours' },
  { cle: 'mois', libelle: 'Ce mois' },
  { cle: 'mois-1', libelle: 'Mois dernier' },
  { cle: 'perso', libelle: 'Dates…' },
]

const deux = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`

/** { du, au } (AAAA-MM-JJ) d'une periode rapide, par rapport a aujourd'hui. */
export function bornesPeriode(cle, aujourdhui = new Date()) {
  const a = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate())
  const moinsJours = (n) => new Date(a.getFullYear(), a.getMonth(), a.getDate() - n)
  if (cle === '7j') return { du: iso(moinsJours(6)), au: iso(a) }
  if (cle === 'mois') return { du: iso(new Date(a.getFullYear(), a.getMonth(), 1)), au: iso(a) }
  if (cle === 'mois-1') {
    return { du: iso(new Date(a.getFullYear(), a.getMonth() - 1, 1)), au: iso(new Date(a.getFullYear(), a.getMonth(), 0)) }
  }
  return { du: iso(moinsJours(29)), au: iso(a) }
}

/** Parametres de GET /historique/reservations (vides omis). */
export function requeteHistorique({ du, au, terrainId, statut, moyen, recherche, page = 0, taille = 10 }) {
  const p = new URLSearchParams()
  const ajouter = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') p.set(k, String(v).trim()) }
  ajouter('du', du); ajouter('au', au); ajouter('terrainId', terrainId); ajouter('statut', statut)
  ajouter('moyen', moyen); ajouter('recherche', recherche)
  p.set('page', String(page)); p.set('taille', String(taille))
  return `/historique/reservations?${p.toString()}`
}

const DATE_CSV = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', day: '2-digit', month: '2-digit', year: 'numeric' })
const HEURE_CSV = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', hour: '2-digit', minute: '2-digit' })

function cellule(v) {
  const t = String(v ?? '')
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const JOUR_CSV = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', weekday: 'short' })
const quand = (iso) => `${DATE_CSV.format(new Date(iso))} ${HEURE_CSV.format(new Date(iso))}`

/** Montant reellement encaisse : paye et ni annule ni expire (comme la carte « Encaisse »). */
export function montantEncaisse(r) {
  return r.payeeLe && (r.statut === 'CONFIRMEE' || r.statut === 'HONOREE') ? Number(r.montant) || 0 : 0
}

/**
 * CSV des reservations pour Excel en francais : separateur ;, BOM UTF-8,
 * ordre chronologique (plus ancien en haut), montants en nombres entiers
 * (additionnables), moyen de paiement seulement si la reservation est payee,
 * et une ligne TOTAL a la fin.
 */
export function csvHistorique(reservations) {
  const entetes = ['Date', 'Jour', 'Début', 'Fin', 'Durée (min)', 'Référence', 'Terrain', 'Sport', 'Client', 'Téléphone',
    'Canal', 'Abonnement', 'Statut', 'Montant (F CFA)', 'Encaissé (F CFA)', 'Moyen de paiement', 'Payée le',
    'Espèces reçues', 'Monnaie rendue', 'Motif d’annulation']
  const tries = [...reservations].sort((a, b) => new Date(a.debut) - new Date(b.debut) || a.id - b.id)
  const lignes = tries.map((r) => [
    DATE_CSV.format(new Date(r.debut)), JOUR_CSV.format(new Date(r.debut)).replace('.', ''),
    HEURE_CSV.format(new Date(r.debut)), HEURE_CSV.format(new Date(r.fin)),
    Math.round((new Date(r.fin) - new Date(r.debut)) / 60000),
    r.reference, r.terrain, r.sport, r.clientNom, telephoneLisible(r.clientTelephone),
    r.canal === 'APP' ? 'App' : 'Comptoir', r.abonnementId ? 'Oui' : 'Non',
    STATUTS[r.statut]?.libelle || r.statut, Number(r.montant) || 0, montantEncaisse(r),
    r.payeeLe ? MOYENS[r.moyenPaiement] || r.moyenPaiement || '' : '', r.payeeLe ? quand(r.payeeLe) : '',
    r.payeeLe && r.especesRecues != null ? r.especesRecues : '', r.payeeLe && r.monnaieRendue != null ? r.monnaieRendue : '',
    r.motifAnnulation || '',
  ])
  const total = Array(entetes.length).fill('')
  total[0] = 'TOTAL'
  total[5] = `${tries.length} réservation${tries.length > 1 ? 's' : ''}`
  total[13] = tries.reduce((n, r) => n + (Number(r.montant) || 0), 0)
  total[14] = tries.reduce((n, r) => n + montantEncaisse(r), 0)
  return '\uFEFF' + [entetes, ...lignes, total].map((l) => l.map(cellule).join(';')).join('\r\n') + '\r\n'
}
