import { describe, expect, it } from 'vitest'
import { urlTerrainClient } from './appClient.js'

describe('urlTerrainClient', () => {
  it('deduit l App Client en developpement (port 5180)', () => {
    expect(urlTerrainClient(7, { protocol: 'http:', hostname: 'localhost', port: '5181' })).toBe('http://localhost:5180/terrains/7')
  })
  it('null sans configuration hors developpement', () => {
    expect(urlTerrainClient(7, { protocol: 'https:', hostname: 'gerant.exemple.sn', port: '' })).toBeNull()
  })
})
