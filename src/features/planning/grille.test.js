import { describe, expect, it } from 'vitest'
import { bornes, correspond, heuresAxe, minutesDepuis, position } from './grille.js'

describe('planning en grille', () => {
  const jour = '2026-11-17'
  const dispos = [
    { creneaux: [{ debut: '2026-11-17T09:30:00Z', fin: '2026-11-17T11:00:00Z' }] },
    { creneaux: [{ debut: '2026-11-17T22:00:00Z', fin: '2026-11-18T00:30:00Z' }] },
  ]

  it('axe en heures pleines, nuit comprise', () => {
    expect(minutesDepuis(jour, '2026-11-18T00:30:00Z')).toBe(1470)
    const axe = bornes(jour, dispos)
    expect(axe).toEqual({ debut: 540, fin: 1500 })
    const h = heuresAxe(axe)
    expect(h[0]).toBe('09:00')
    expect(h[h.length - 1]).toBe('00:00')
  })

  it('position : une heure = 64 px', () => {
    const axe = { debut: 540, fin: 1500 }
    expect(position(jour, axe, '2026-11-17T09:30:00Z', '2026-11-17T11:00:00Z')).toEqual({ top: 32, height: 96 })
  })

  it('jour sans creneau', () => {
    expect(bornes(jour, [{ creneaux: [] }])).toBeNull()
  })
})

describe('recherche dans le planning', () => {
  const r = { clientNom: 'Awa Ndiaye', reference: 'REBRA3U', clientTelephone: '+221771234567' }
  it('nom sans accents, reference, numero', () => {
    expect(correspond(r, 'ndiay')).toBe(true)
    expect(correspond({ ...r, clientNom: 'Aïssatou Sène' }, 'sene')).toBe(true)
    expect(correspond(r, 'rebra')).toBe(true)
    expect(correspond(r, '77 123')).toBe(true)
    expect(correspond(r, 'fatou')).toBe(false)
    expect(correspond(r, '')).toBe(true)
  })
})
