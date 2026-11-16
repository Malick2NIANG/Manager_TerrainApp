import { describe, expect, it } from 'vitest'
import { indicateursDuJour } from './Dashboard.jsx'

describe('indicateurs du jour', () => {
  it('compte les reservations actives, la recette et l occupation', () => {
    const r = [
      { id: 1, statut: 'CONFIRMEE', canal: 'APP', montant: 20000, debut: '2026-11-20T19:00:00Z', fin: '2026-11-20T20:00:00Z' },
      { id: 2, statut: 'HONOREE', canal: 'COMPTOIR', montant: 15000, debut: '2026-11-20T10:00:00Z', fin: '2026-11-20T11:00:00Z' },
      { id: 3, statut: 'ANNULEE', canal: 'APP', montant: 15000, debut: '2026-11-20T12:00:00Z', fin: '2026-11-20T13:00:00Z' },
    ]
    const c = (h, etat) => ({ debut: `2026-11-20T${h}:00:00Z`, fin: `2026-11-20T${String(Number(h) + 1).padStart(2, '0')}:00:00Z`, etat })
    // 10:00 passe mais occupe, 19:00 reserve, 12:00 annule (libre), 13:00 libre, 14:00 bloque.
    const d = [{ terrainId: 1, creneaux: [c('10', 'PASSE'), c('19', 'RESERVE'), c('12', 'PASSE'), c('13', 'LIBRE'), c('14', 'BLOQUE')] }]
    r.forEach((x) => { x.terrainId = 1 })
    const k = indicateursDuJour(r, d, Date.parse('2026-11-20T15:00:00Z'))
    expect(k.nombre).toBe(2)
    expect(k.recette).toBe(35000)
    expect(k.enLigne).toBe(1)
    expect(k.occupation).toBe(50) // 2 occupes sur 4 ouverts
    expect(k.prochaines.map((x) => x.id)).toEqual([1])
  })
})
