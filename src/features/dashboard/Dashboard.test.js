import { describe, expect, it } from 'vitest'
import { indicateursDuJour } from './Dashboard.jsx'

describe('indicateurs du jour', () => {
  it('compte les reservations actives, la recette et l occupation', () => {
    const r = [
      { id: 1, statut: 'CONFIRMEE', canal: 'APP', montant: 20000, debut: '2026-11-20T19:00:00Z', fin: '2026-11-20T20:00:00Z' },
      { id: 2, statut: 'HONOREE', canal: 'COMPTOIR', montant: 15000, debut: '2026-11-20T10:00:00Z', fin: '2026-11-20T11:00:00Z' },
      { id: 3, statut: 'ANNULEE', canal: 'APP', montant: 15000, debut: '2026-11-20T12:00:00Z', fin: '2026-11-20T13:00:00Z' },
    ]
    const d = [{ creneaux: [{ etat: 'RESERVE' }, { etat: 'RESERVE' }, { etat: 'LIBRE' }, { etat: 'BLOQUE' }, { etat: 'PASSE' }] }]
    const k = indicateursDuJour(r, d, Date.parse('2026-11-20T15:00:00Z'))
    expect(k.nombre).toBe(2)
    expect(k.recette).toBe(35000)
    expect(k.enLigne).toBe(1)
    expect(k.occupation).toBe(50)
    expect(k.prochaines.map((x) => x.id)).toEqual([1])
  })
})
