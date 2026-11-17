import { describe, expect, it } from 'vitest'
import { aEncaisser, libelleRegle, refusRemise } from './abonnements.js'

describe('abonnements', () => {
  it('regle lisible : chaque semaine, ou meme rang du jour dans le mois', () => {
    expect(libelleRegle('HEBDOMADAIRE', '2026-11-21T18:00:00Z')).toBe('Chaque samedi à 18:00')
    expect(libelleRegle('MENSUELLE', '2026-11-07T18:00:00Z')).toBe('Le 1er samedi du mois à 18:00')
    expect(libelleRegle('MENSUELLE', '2026-11-28T10:00:00Z')).toBe('Le 4e samedi du mois à 10:00')
    expect(libelleRegle('MENSUELLE', '2026-11-30T10:00:00Z')).toBe('Le dernier lundi du mois à 10:00')
    expect(libelleRegle('HEBDOMADAIRE', '2026-11-17T18:00:00Z', [2, 4])).toBe('Chaque mardi et jeudi à 18:00')
    expect(libelleRegle('HEBDOMADAIRE', '2026-11-16T18:00:00Z', [1, 3, 5])).toBe('Chaque lundi, mercredi et vendredi à 18:00')
    expect(libelleRegle('PERSONNALISEE', '2026-11-16T18:00:00Z', [], 5)).toBe('5 dates au choix à 18:00')
  })

  it('seance a encaisser', () => {
    expect(aEncaisser({ abonnementId: 1, statut: 'CONFIRMEE' })).toBe(true)
    expect(aEncaisser({ abonnementId: 1, statut: 'CONFIRMEE', payeeLe: '2026-11-21T10:00:00Z' })).toBe(false)
    expect(aEncaisser({ abonnementId: 1, statut: 'ANNULEE' })).toBe(false)
    expect(aEncaisser({ statut: 'CONFIRMEE' })).toBe(false)
  })

  it('remise', () => {
    expect(refusRemise('', 40000)).toBeNull()
    expect(refusRemise('5000', 40000)).toBeNull()
    expect(refusRemise('-1', 40000)).toMatch(/montant/)
    expect(refusRemise('50000', 40000)).toMatch(/dépasse/)
  })
})
