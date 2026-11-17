import { describe, expect, it } from 'vitest'
import { statutTerrain } from './statutTerrain.js'
import { resumeOuverture } from './HorairesModal.jsx'

describe('statut des terrains', () => {
  it('actif, a completer, brouillon', () => {
    expect(statutTerrain({ actif: true, photos: ['/a.jpg'] })).toBe('ACTIF')
    expect(statutTerrain({ actif: true, photos: [] })).toBe('A_COMPLETER')
    expect(statutTerrain({ actif: false, photos: ['/a.jpg'] })).toBe('BROUILLON')
  })
  it('resume des horaires', () => {
    const jours = [1, 2, 3, 4, 5, 6, 7].map((jour) => ({ jour, ouvert: true, ouverture: '08:00:00', fermeture: '23:00:00' }))
    expect(resumeOuverture(jours)).toBe('Tous les jours 08:00–23:00')
    expect(resumeOuverture(jours.map((j) => (j.jour === 1 ? { ...j, ouvert: false } : j)))).toBe('6 jours sur 7')
  })
})
