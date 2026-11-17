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
  it('exporte en CSV pour Excel : ordre chronologique, encaisse, total', () => {
    const base = { sport: 'Football 5', terrain: 'Terrain A', clientTelephone: '+221771234567', canal: 'APP', motifAnnulation: null }
    const csv = csvHistorique([
      { ...base, id: 2, debut: '2026-11-17T19:00:00Z', fin: '2026-11-17T20:00:00Z', reference: 'R2', clientNom: 'Ali; "Le Roi"',
        montant: 15000, moyenPaiement: 'wave', payeeLe: null, statut: 'ANNULEE', motifAnnulation: 'Pluie' },
      { ...base, id: 1, debut: '2026-11-16T10:00:00Z', fin: '2026-11-16T11:30:00Z', reference: 'R1', clientNom: 'Awa', canal: 'COMPTOIR',
        montant: 20000, moyenPaiement: 'especes', payeeLe: '2026-11-16T09:45:00Z', statut: 'HONOREE', especesRecues: 25000, monnaieRendue: 5000, abonnementId: 3 },
    ])
    expect(csv.startsWith('\uFEFFDate;Jour;Début;Fin;Durée (min);Référence')).toBe(true)
    const [, premiere, seconde, total] = csv.trim().split('\r\n')
    expect(premiere).toBe('16/11/2026;lun;10:00;11:30;90;R1;Terrain A;Football 5;Awa;77 123 45 67;Comptoir;Oui;Entrée validée;20000;20000;Espèces;16/11/2026 09:45;25000;5000;')
    // Annulee non payee : pas de moyen de paiement, rien d'encaisse.
    expect(seconde).toContain('"Ali; ""Le Roi"""')
    expect(seconde).toContain(';Annulée;15000;0;;;;;Pluie')
    expect(total).toBe('TOTAL;;;;;2 réservations;;;;;;;;35000;20000;;;;;')
  })
})
