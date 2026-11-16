import { describe, expect, it } from 'vitest'
import { decalerJour, heure, instantDe, jourISO, plage } from './dates.js'

describe('dates a l heure de Dakar', () => {
  it('jours et heures', () => {
    expect(jourISO(new Date('2026-11-20T23:30:00Z'))).toBe('2026-11-20')
    expect(decalerJour('2026-11-30', 1)).toBe('2026-12-01')
    expect(decalerJour('2026-11-01', -1)).toBe('2026-10-31')
    expect(heure('2026-11-20T19:00:00Z')).toBe('19:00')
    expect(plage('2026-11-20T19:00:00Z', '2026-11-20T20:30:00Z')).toBe('19:00 – 20:30')
    expect(instantDe('2026-11-20', '08:30')).toBe('2026-11-20T08:30:00Z')
  })
})
