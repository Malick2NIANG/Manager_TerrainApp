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

// Export Excel (.xlsx) de l'historique, genere dans le navigateur avec
// SheetJS (charge a la demande, comme l'export du Journal). Dates et heures
// sont de vraies valeurs Excel (triables, filtrables), colonnes a la bonne
// largeur, totaux en formules.

const PARTIES_DAKAR = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Dakar', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
const JOUR_SEMAINE = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', weekday: 'long' })

/** Numero de serie Excel d'un instant, a l'heure de Dakar (heure affichee dans l'app). */
export function serieExcel(iso) {
  const p = Object.fromEntries(PARTIES_DAKAR.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Date.UTC(1899, 11, 30)) / 86400000
}

/** Montant reellement encaisse : paye et ni annule ni expire (comme la carte « Encaisse »). */
export function montantEncaisse(r) {
  return r.payeeLe && (r.statut === 'CONFIRMEE' || r.statut === 'HONOREE') ? Number(r.montant) || 0 : 0
}

export const COLONNES_EXPORT = [
  ['Date', 11], ['Jour', 10], ['Début', 7], ['Fin', 7], ['Durée (min)', 11], ['Référence', 11], ['Terrain', 16], ['Sport', 12],
  ['Client', 20], ['Téléphone', 14], ['Canal', 10], ['Abonnement', 12], ['Statut', 15], ['Montant (F CFA)', 15],
  ['Encaissé (F CFA)', 16], ['Moyen de paiement', 18], ['Payée le', 17], ['Espèces reçues', 15], ['Monnaie rendue', 15],
  ['Motif d’annulation', 30],
]

const date = (iso, z) => ({ t: 'n', v: serieExcel(iso), z })
const fcfa = (v) => ({ t: 'n', v: Number(v) || 0, z: '#,##0' })

/** Lignes de l'onglet Reservations (en-tete, une ligne par reservation dans l'ordre chronologique, TOTAL). */
export function tableauHistorique(reservations) {
  const tries = [...reservations].sort((a, b) => new Date(a.debut) - new Date(b.debut) || a.id - b.id)
  const lignes = tries.map((r) => [
    date(r.debut, 'dd/mm/yyyy'), JOUR_SEMAINE.format(new Date(r.debut)), date(r.debut, 'hh:mm'), date(r.fin, 'hh:mm'),
    Math.round((new Date(r.fin) - new Date(r.debut)) / 60000), r.reference, r.terrain, r.sport, r.clientNom,
    telephoneLisible(r.clientTelephone), r.canal === 'APP' ? 'App' : 'Comptoir', r.abonnementId ? 'Oui' : 'Non',
    STATUTS[r.statut]?.libelle || r.statut, fcfa(r.montant), fcfa(montantEncaisse(r)),
    r.payeeLe ? MOYENS[r.moyenPaiement] || r.moyenPaiement || '' : '', r.payeeLe ? date(r.payeeLe, 'dd/mm/yyyy hh:mm') : '',
    r.payeeLe && r.especesRecues != null ? fcfa(r.especesRecues) : '', r.payeeLe && r.monnaieRendue != null ? fcfa(r.monnaieRendue) : '',
    r.motifAnnulation || '',
  ])
  const fin = lignes.length + 1
  const total = COLONNES_EXPORT.map(() => '')
  total[0] = 'TOTAL'
  total[5] = `${tries.length} réservation${tries.length > 1 ? 's' : ''}`
  total[13] = lignes.length ? { t: 'n', f: `SUM(N2:N${fin})`, v: tries.reduce((n, r) => n + (Number(r.montant) || 0), 0), z: '#,##0' } : fcfa(0)
  total[14] = lignes.length ? { t: 'n', f: `SUM(O2:O${fin})`, v: tries.reduce((n, r) => n + montantEncaisse(r), 0), z: '#,##0' } : fcfa(0)
  return [COLONNES_EXPORT.map(([titre]) => titre), ...lignes, total]
}

// Mise en forme du classeur (ExcelJS) : vert de la marque pour les en-tetes,
// lignes alternees, statuts en couleur, total en gras, impression paysage.
const VERT = 'FF1F6F57'
const VERT_PALE = 'FFE2F2EC'
const GRIS_LIGNE = 'FFE7E4E1'
const FOND_ALTERNE = 'FFF7F7F5'
const COULEUR_STATUT = {
  'Entrée validée': 'FF1F6F57', Confirmée: 'FF2F6FED', Annulée: 'FFB3261E', Expirée: 'FF9C6B0C', 'Paiement en attente': 'FF9C6B0C',
}
const bordure = { style: 'thin', color: { argb: GRIS_LIGNE } }
const bordures = { top: bordure, left: bordure, bottom: bordure, right: bordure }

function remplir(cellule, valeur) {
  if (valeur && typeof valeur === 'object') {
    cellule.value = valeur.f ? { formula: valeur.f, result: valeur.v } : valeur.v
    if (valeur.z) cellule.numFmt = valeur.z === '#,##0' ? '#,##0" F"' : valeur.z
  } else {
    cellule.value = valeur === '' ? null : valeur
  }
}

/** Telecharge le classeur : onglet Reservations (tableau mis en forme) + onglet Resume. */
export async function exporterHistorique({ reservations, nomFichier, resume, etablissement = '' }) {
  const ExcelJS = (await import('exceljs')).default
  const classeur = new ExcelJS.Workbook()
  classeur.creator = etablissement || 'TerrainApp'
  classeur.created = new Date()

  const f = classeur.addWorksheet('Réservations', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  })
  f.columns = COLONNES_EXPORT.map(([, width]) => ({ width: width + 2 }))
  const nb = COLONNES_EXPORT.length

  // Titre et sous-titre au-dessus du tableau.
  f.mergeCells(1, 1, 1, nb)
  f.getCell(1, 1).value = `Historique des réservations${etablissement ? ` · ${etablissement}` : ''}`
  f.getCell(1, 1).font = { bold: true, size: 15, color: { argb: VERT } }
  f.getRow(1).height = 24
  f.mergeCells(2, 1, 2, nb)
  f.getCell(2, 1).value = `Matchs ${resume.periode} · ${reservations.length} réservation${reservations.length > 1 ? 's' : ''} · exporté le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Dakar' }).format(new Date())}`
  f.getCell(2, 1).font = { size: 10, color: { argb: 'FF6B6B6B' } }

  const [entete, ...corps] = tableauHistorique(reservations)
  const total = corps.pop()
  const premiere = 4
  const rEntete = f.getRow(premiere)
  entete.forEach((titre, i) => {
    const c = rEntete.getCell(i + 1)
    c.value = titre
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERT } }
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    c.border = bordures
  })
  rEntete.height = 30

  corps.forEach((ligne, k) => {
    const r = f.getRow(premiere + 1 + k)
    ligne.forEach((v, i) => {
      const c = r.getCell(i + 1)
      remplir(c, v)
      c.border = bordures
      // Centre pour les codes courts, marge interieure pour le reste (les
      // montants alignes a droite ne collent plus au texte voisin).
      c.alignment = [0, 2, 3, 4, 5, 10, 11, 16].includes(i)
        ? { vertical: 'middle', horizontal: 'center' }
        : { vertical: 'middle', indent: 1 }
      if (k % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FOND_ALTERNE } }
    })
    const statut = r.getCell(13)
    statut.font = { bold: true, color: { argb: COULEUR_STATUT[statut.value] || 'FF3C3C3C' } }
    const encaisse = r.getCell(15)
    if (!encaisse.value) encaisse.font = { color: { argb: 'FF9A9A9E' } }
    r.height = 18
  })

  // Total : formules recalculees sur les lignes du tableau.
  const rTotal = f.getRow(premiere + corps.length + 1)
  total.forEach((v, i) => {
    const c = rTotal.getCell(i + 1)
    const valeur = v && typeof v === 'object' && v.f
      ? { ...v, f: `SUM(${String.fromCharCode(65 + i)}${premiere + 1}:${String.fromCharCode(65 + i)}${premiere + corps.length})` }
      : v
    remplir(c, valeur)
    c.font = { bold: true, color: { argb: VERT } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERT_PALE } }
    c.border = { ...bordures, top: { style: 'medium', color: { argb: VERT } } }
  })
  rTotal.height = 20
  if (corps.length) f.autoFilter = { from: { row: premiere, column: 1 }, to: { row: premiere + corps.length, column: nb } }

  // Onglet Resume.
  const parMoyen = {}
  for (const r of reservations) {
    const m = montantEncaisse(r)
    const libelle = MOYENS[r.moyenPaiement] || r.moyenPaiement
    if (m) parMoyen[libelle] = (parMoyen[libelle] || 0) + m
  }
  const res = classeur.addWorksheet('Résumé')
  res.columns = [{ width: 30 }, { width: 36 }]
  res.mergeCells('A1:B1')
  res.getCell('A1').value = 'Résumé de l’export'
  res.getCell('A1').font = { bold: true, size: 15, color: { argb: VERT } }
  const lignesResume = [
    ['Période (date du match)', resume.periode],
    ['Terrain', resume.terrain],
    ['Statut', resume.statut],
    ['Moyen de paiement', resume.moyen],
    ['Recherche', resume.recherche],
    ['Réservations', reservations.length],
    ['Encaissé', { t: 'n', v: reservations.reduce((n, r) => n + montantEncaisse(r), 0), z: '#,##0' }],
    ...Object.entries(parMoyen).sort((a, b) => b[1] - a[1]).map(([m, v]) => [`   dont ${m}`, { t: 'n', v, z: '#,##0' }]),
  ]
  lignesResume.forEach(([cle, valeur], k) => {
    const r = res.getRow(3 + k)
    r.getCell(1).value = cle
    r.getCell(1).font = { bold: !cle.startsWith('   '), color: { argb: 'FF3C3C3C' } }
    remplir(r.getCell(2), valeur)
    if (cle === 'Encaissé') {
      r.getCell(2).font = { bold: true, size: 13, color: { argb: VERT } }
      r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERT_PALE } }
    }
    r.getCell(2).alignment = { horizontal: 'left' }
    r.height = 18
  })

  const tampon = await classeur.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([tampon], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  lien.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
