import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  delete window.__TERRAINAPP_CONFIG__
  vi.resetModules()
})

const charger = async (config) => {
  if (config) window.__TERRAINAPP_CONFIG__ = config
  return import('./marque.js')
}

describe('marque par defaut', () => {
  it('reste TerrainApp, vert et declinaisons exactes', async () => {
    const { marque, nomEnDeuxTons, signatureTicket } = await charger()
    expect(marque.nom).toBe('TerrainApp')
    expect(marque.initiales).toBe('TA')
    expect(marque.couleur).toBe('#1F7A4D')
    expect(marque.pale).toBe('#E6F3EC')
    expect(marque.bordure).toBe('#BFDCCB')
    expect(marque.vifRgb).toEqual([63, 181, 122])
    expect(nomEnDeuxTons()).toEqual({ debut: 'Terrain', accent: 'App' })
    expect(signatureTicket()).toBe('TerrainApp')
  })
})

describe('marque d un autre restaurant', () => {
  it('prend nom et couleur, derive les teintes, ticket au nom seul', async () => {
    const { marque, nomEnDeuxTons, signatureTicket } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_COULEUR: '#1F6F57' })
    expect(marque.initiales).toBe('LB')
    expect(marque.couleur).toBe('#1F6F57')
    expect(nomEnDeuxTons()).toEqual({ debut: 'Le Baobab', accent: '' })
    // Pas de "Chez Ketchup" herite de la marque par defaut.
    expect(signatureTicket()).toBe('Le Baobab')
    expect(marque.pale).not.toBe('#FBEAEC')
  })

  it('etablissement distinct sur les tickets', async () => {
    const { signatureTicket } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_ETABLISSEMENT: 'Restaurant Diallo' })
    expect(signatureTicket()).toBe('Le Baobab · Restaurant Diallo')
  })

  it('applique les variables CSS et le titre', async () => {
    const { marque, appliquerMarque } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_COULEUR: '#003881' })
    appliquerMarque(marque, document)
    expect(document.documentElement.style.getPropertyValue('--marque')).toBe('#003881')
    expect(document.documentElement.style.getPropertyValue('--marque-rgb')).toBe('0 56 129')
    expect(document.title).toBe('Le Baobab Manager')
  })
})
