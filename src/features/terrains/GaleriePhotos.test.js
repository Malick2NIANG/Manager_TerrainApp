import { describe, expect, it } from 'vitest'
import { deplacer } from './GaleriePhotos.jsx'

describe('galerie photos', () => {
  it('deplace une photo d un cran, sans sortir de la liste', () => {
    expect(deplacer(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(deplacer(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
    expect(deplacer(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
  })
})
