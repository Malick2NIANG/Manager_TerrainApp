import { describe, expect, it } from 'vitest'
import { avecCadrage, positionCadrage, sansCadrage } from './cadrage.js'

describe('cadrage', () => {
  it('note et relit la position du cadre', () => {
    const url = avecCadrage('/api/v1/photos/a.jpg', 49.6, 120)
    expect(url).toBe('/api/v1/photos/a.jpg#c=50,100')
    expect(positionCadrage(url)).toBe('50% 100%')
    expect(sansCadrage(url)).toBe('/api/v1/photos/a.jpg')
  })
  it('remplace un cadrage existant, rien sans cadrage', () => {
    expect(avecCadrage('/x.jpg#c=1,2', 0, 30)).toBe('/x.jpg#c=0,30')
    expect(positionCadrage('/x.jpg')).toBeUndefined()
    expect(sansCadrage(null)).toBe('')
  })
})
