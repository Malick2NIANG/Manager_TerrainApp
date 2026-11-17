import { describe, expect, it } from 'vitest'
import { bornesPeriode, csvHistorique, requeteHistorique } from './historique.js'

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
  it('exporte en CSV pour Excel', () => {
    const csv = csvHistorique([{ debut: '2026-11-17T19:00:00Z', fin: '2026-11-17T20:00:00Z', reference: 'R1', terrain: 'Terrain A',
      sport: 'Football 5', clientNom: 'Ali; "Le Roi"', clientTelephone: '+221771234567', montant: 15000, moyenPaiement: 'wave',
      payeeLe: null, statut: 'ANNULEE', canal: 'APP', motifAnnulation: 'Pluie' }])
    const [entete, ligne] = csv.slice(1).split('\r\n')
    expect(entete.startsWith('Date;Début;Fin;Référence')).toBe(true)
    expect(ligne).toContain('"Ali; ""Le Roi"""')
    expect(ligne).toContain('77 123 45 67;15000;Wave;;Annulée;App;Pluie')
  })
})
