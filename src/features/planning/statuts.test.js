import { describe, expect, it } from 'vitest'
import { reservationDuCreneau, telephoneLisible } from './statuts.jsx'

describe('planning', () => {
  const r = (champs) => ({ terrainId: 1, debut: '2026-11-20T19:00:00Z', fin: '2026-11-20T20:00:00Z', statut: 'CONFIRMEE', ...champs })

  it('trouve la reservation qui occupe un creneau', () => {
    const liste = [r({ id: 1 }), r({ id: 2, terrainId: 2 })]
    expect(reservationDuCreneau(liste, 1, '2026-11-20T19:00:00Z', '2026-11-20T20:00:00Z').id).toBe(1)
    expect(reservationDuCreneau(liste, 1, '2026-11-20T20:00:00Z', '2026-11-20T21:00:00Z')).toBeNull()
  })

  it('une reservation annulee ne bloque plus le creneau', () => {
    expect(reservationDuCreneau([r({ statut: 'ANNULEE' })], 1, '2026-11-20T19:00:00Z', '2026-11-20T20:00:00Z')).toBeNull()
  })

  it('telephone lisible', () => {
    expect(telephoneLisible('+221771234567')).toBe('77 123 45 67')
  })
})
