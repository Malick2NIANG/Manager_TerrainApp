import { describe, expect, it } from 'vitest'
import { dureesDe, libelleDuree, optionsDuree, resumeDurees } from './durees'

const c = (h, m, etat = 'LIBRE', prix = 5000) => {
  const d = new Date(Date.UTC(2026, 10, 21, h, m))
  return { debut: d.toISOString(), fin: new Date(d.getTime() + 30 * 60000).toISOString(), prix, etat }
}

describe('durees', () => {
  it('libelles', () => {
    expect(libelleDuree(60)).toBe('1 h')
    expect(libelleDuree(90)).toBe('1 h 30')
    expect(libelleDuree(45)).toBe('45 min')
    expect(resumeDurees([60, 90, 120])).toBe('1 h à 2 h')
    expect(resumeDurees([60])).toBe('1 h')
  })

  it('durees du terrain ou de la disponibilite, sinon la duree de creneau', () => {
    expect(dureesDe({ dureeCreneauMinutes: 60 })).toEqual([60])
    expect(dureesDe({ dureesProposees: [120, 60] })).toEqual([60, 120])
    expect(dureesDe({ dureeCreneauMinutes: 60 }, { dureesProposees: [60, 90] })).toEqual([60, 90])
  })

  it('une duree est possible si tous les creneaux couverts sont libres', () => {
    const grille = [c(17, 0), c(17, 30), c(18, 0, 'LIBRE', 10000), c(18, 30, 'RESERVE'), c(19, 0)]
    const [h1, h1m30, h2] = optionsDuree(grille, grille[0].debut, [60, 90, 120])
    expect(h1).toMatchObject({ possible: true, prix: 10000, fin: grille[1].fin })
    expect(h1m30).toMatchObject({ possible: true, prix: 20000, fin: grille[2].fin })
    expect(h2.possible).toBe(false)
    // Pas assez de creneaux avant la fermeture.
    expect(optionsDuree(grille, grille[4].debut, [60])[0].possible).toBe(false)
    expect(optionsDuree(grille, 'inconnu', [60])[0].possible).toBe(false)
  })
})
