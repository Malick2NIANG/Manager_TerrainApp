import { describe, expect, it } from 'vitest'
import { aRembourser, refusAnnulation } from './AnnulationModal.jsx'

describe('annulation par le personnel', () => {
  const futur = '2030-01-01T10:00:00Z'
  const enLigne = { statut: 'CONFIRMEE', canal: 'APP', payeeLe: '2029-12-01T10:00:00Z', debut: futur }
  it('payee en ligne : gerant seulement, remboursement', () => {
    expect(aRembourser(enLigne)).toBe(true)
    expect(refusAnnulation(enLigne, 'ACCUEIL')).toMatch(/gérant/)
    expect(refusAnnulation(enLigne, 'GERANT')).toBeNull()
  })
  it('creneau commence ou deja joue : impossible', () => {
    expect(refusAnnulation({ ...enLigne, debut: '2020-01-01T10:00:00Z' }, 'GERANT')).toMatch(/commencé/)
    expect(refusAnnulation({ ...enLigne, statut: 'HONOREE' }, 'GERANT')).toMatch(/plus/)
    expect(refusAnnulation({ statut: 'CONFIRMEE', canal: 'COMPTOIR', payeeLe: futur, debut: futur }, 'ACCUEIL')).toBeNull()
  })
})
