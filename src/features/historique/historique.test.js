import { describe, expect, it } from 'vitest'
import { bornesPeriode, requeteHistorique, serieExcel, tableauHistorique } from './historique.js'

describe('historique', () => {
  const ref = new Date(2026, 10, 17)
  it('calcule les periodes rapides', () => {
    expect(bornesPeriode('7j', ref)).toEqual({ du: '2026-11-11', au: '2026-11-17' })
    expect(bornesPeriode('30j', ref)).toEqual({ du: '2026-10-19', au: '2026-11-17' })
    expect(bornesPeriode('mois', ref)).toEqual({ du: '2026-11-01', au: '2026-11-17' })
    expect(bornesPeriode('mois-1', ref)).toEqual({ du: '2026-10-01', au: '2026-10-31' })
  })
  it('construit la requete sans les filtres vides', () => {
    expect(requeteHistorique({ du: '2026-11-01', au: '2026-11-17', terrainId: '', moyen: 'wave', recherche: ' ali ', page: 2, taille: 25 }))
      .toBe('/historique/reservations?du=2026-11-01&au=2026-11-17&moyen=wave&recherche=ali&page=2&taille=25')
  })
  it('serie Excel a l heure de Dakar', () => {
    // 16/11/2026 09:45 -> jour 46342 + 9h45.
    expect(serieExcel('2026-11-16T09:45:00Z')).toBeCloseTo(46342 + (9 * 60 + 45) / 1440, 8)
  })
  it('tableau Excel : ordre chronologique, vraies dates, encaisse, total en formule', () => {
    const base = { sport: 'Football 5', terrain: 'Terrain A', clientTelephone: '+221771234567', canal: 'APP', motifAnnulation: null }
    const t = tableauHistorique([
      { ...base, id: 2, debut: '2026-11-17T19:00:00Z', fin: '2026-11-17T20:00:00Z', reference: 'R2', clientNom: 'Ali',
        montant: 15000, moyenPaiement: 'wave', payeeLe: null, statut: 'ANNULEE', motifAnnulation: 'Pluie' },
      { ...base, id: 1, debut: '2026-11-16T10:00:00Z', fin: '2026-11-16T11:30:00Z', reference: 'R1', clientNom: 'Awa', canal: 'COMPTOIR',
        montant: 20000, moyenPaiement: 'especes', payeeLe: '2026-11-16T09:45:00Z', statut: 'HONOREE', especesRecues: 25000, monnaieRendue: 5000, abonnementId: 3 },
    ])
    const [entete, r1, r2, total] = t
    expect(entete[16]).toBe('Payée le')
    expect(r1[5]).toBe('R1')
    expect(r1[1]).toBe('lundi')
    expect(r1[4]).toBe(90)
    expect(r1[16]).toEqual({ t: 'n', v: serieExcel('2026-11-16T09:45:00Z'), z: 'dd/mm/yyyy hh:mm' })
    expect(r1.slice(10, 16).map((c) => c.v ?? c)).toEqual(['Comptoir', 'Oui', 'Entrée validée', 20000, 20000, 'Espèces'])
    // Annulee non payee : ni moyen ni date de paiement, rien d'encaisse.
    expect([r2[14].v, r2[15], r2[16], r2[19]]).toEqual([0, '', '', 'Pluie'])
    expect(total[0]).toBe('TOTAL')
    expect(total[13]).toMatchObject({ f: 'SUM(N2:N3)', v: 35000 })
    expect(total[14]).toMatchObject({ f: 'SUM(O2:O3)', v: 20000 })
  })
})
