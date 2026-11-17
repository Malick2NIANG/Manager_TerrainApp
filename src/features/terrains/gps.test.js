import { describe, expect, it } from 'vitest'
import { lireGps } from './gps.js'

describe('position GPS', () => {
  it('lit les coordonnees et les liens Google Maps', () => {
    expect(lireGps('14.7256, -17.4569')).toEqual({ latitude: 14.7256, longitude: -17.4569 })
    expect(lireGps('https://www.google.com/maps/place/X/@14.7068,-17.4732,17z')).toEqual({ latitude: 14.7068, longitude: -17.4732 })
    expect(lireGps('https://maps.google.com/?q=14.70681234,-17.47321234')).toEqual({ latitude: 14.706812, longitude: -17.473212 })
    expect(lireGps('https://www.google.com/maps/place/X/data=!3d14.71!4d-17.45')).toEqual({ latitude: 14.71, longitude: -17.45 })
  })
  it('refuse le reste', () => {
    expect(lireGps('')).toBeNull()
    expect(lireGps('Liberté 6')).toBeNull()
    expect(lireGps('120, 10')).toBeNull()
  })
})
