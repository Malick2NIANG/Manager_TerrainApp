import { describe, expect, it } from 'vitest'
import { supprimable } from './GestionAbonnementModals.jsx'

describe('suppression d un abonnement', () => {
  const futur = '2030-01-01T10:00:00Z'
  it('seulement si rien n est paye ni passe', () => {
    expect(supprimable({ statut: 'ACTIF', seances: [{ statut: 'CONFIRMEE', debut: futur }] })).toBe(true)
    expect(supprimable({ statut: 'ACTIF', seances: [{ statut: 'CONFIRMEE', debut: futur, payeeLe: futur }] })).toBe(false)
    expect(supprimable({ statut: 'ACTIF', seances: [{ statut: 'HONOREE', debut: '2020-01-01T10:00:00Z' }] })).toBe(false)
    expect(supprimable({ statut: 'RESILIE', seances: [] })).toBe(false)
  })
})
