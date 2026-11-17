import { describe, expect, it } from 'vitest'
import { htmlRecu, lignesRecu, monnaie, sommesProposees } from './caisse.js'

describe('caisse', () => {
  it('monnaie a rendre', () => {
    expect(monnaie('', 48000)).toBeNull()
    expect(monnaie('50000', 48000)).toBe(2000)
    expect(monnaie(40000, 48000)).toBe(-8000)
  })

  it('sommes proposees : compte juste puis arrondis', () => {
    expect(sommesProposees(48000)).toEqual([48000, 50000])
    expect(sommesProposees(37500)).toEqual([37500, 38000, 40000, 50000])
    expect(sommesProposees(15000)).toEqual([15000, 20000, 50000])
  })

  const r = {
    reference: 'RABC234', clientNom: 'Awa Diop', terrain: 'Grand terrain', sport: 'Football 7',
    debut: '2026-11-17T20:00:00Z', fin: '2026-11-17T21:30:00Z', moyenPaiement: 'especes', montant: 48000,
    especesRecues: 50000, monnaieRendue: 2000,
  }

  it('recu : especes recues et monnaie rendue', () => {
    const l = Object.fromEntries(lignesRecu(r, { moyens: { especes: 'Espèces' }, caissier: 'accueil1' }))
    expect(l['Créneau']).toBe('20:00 – 21:30')
    expect(l['Paiement']).toBe('Espèces')
    expect(l['Montant payé']).toBe('48 000 F CFA')
    expect(l['Espèces reçues']).toBe('50 000 F CFA')
    expect(l['Monnaie rendue']).toBe('2 000 F CFA')
    expect(l['Caissier']).toBe('accueil1')
  })

  it('recu : html echappe, sans QR sans code', () => {
    const html = htmlRecu({ ...r, clientNom: '<b>X</b>', especesRecues: null }, { etablissement: 'Paco Boy Arena' })
    expect(html).toContain('Paco Boy Arena')
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;')
    expect(html).not.toContain('Espèces reçues')
    expect(html).toContain('Donnez cette référence')
  })
})
