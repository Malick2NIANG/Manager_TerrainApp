import { afterEach, describe, expect, it, vi } from 'vitest'

// Identite complete du dossier du complexe (MARQUE_COMPLETE dans /config.js,
// produite par npm run client) : titre, couleurs, logo, recu de caisse, scan.

afterEach(() => {
  delete window.__TERRAINAPP_CONFIG__
  vi.resetModules()
  document.title = ''
})

const COMPLEXE = {
  nom: 'Arena Teranga',
  nomAccent: 'Teranga',
  ville: 'Saly',
  personnalise: true,
  couleurs: { principale: '#c2410c', claire: '#FDBA74' },
  logoUrl: '/marque/logo.png',
  regles: { margeEntreeMinutes: 15, delaiAnnulationHeures: 24 },
  documents: { nomSurTickets: 'ARENA TERANGA', piedDeRecu: 'À bientôt sur nos terrains !' },
}

const charger = async (config) => {
  window.__TERRAINAPP_CONFIG__ = config
  return import('./marque.js')
}

describe('dossier du complexe', () => {
  it('nom, logo, couleurs et nom sur les tickets', async () => {
    const { marque, nomEnDeuxTons, signatureTicket } = await charger({ MARQUE_COMPLETE: COMPLEXE, MARQUE_NOM: 'Autre' })
    expect(marque.nom).toBe('Arena Teranga')
    expect(nomEnDeuxTons()).toEqual({ debut: 'Arena ', accent: 'Teranga' })
    expect(marque.logo).toBe('/marque/logo.png')
    expect(marque.couleur).toBe('#C2410C')
    expect(marque.vifRgb).toEqual([253, 186, 116])
    expect(marque.etablissement).toBe('ARENA TERANGA')
    expect(signatureTicket()).toBe('Arena Teranga · ARENA TERANGA')
    expect(marque.margeEntreeMinutes).toBe(15)
  })

  it('appliquee a la page : titre de l onglet et couleur', async () => {
    const { appliquerMarque } = await charger({ MARQUE_COMPLETE: COMPLEXE })
    appliquerMarque()
    expect(document.title).toBe('Arena Teranga Manager')
    expect(document.documentElement.style.getPropertyValue('--marque')).toBe('#C2410C')
  })

  it('recu de caisse : logo, nom sur les tickets, marge et pied du complexe', async () => {
    await charger({ MARQUE_COMPLETE: COMPLEXE })
    const { htmlRecu } = await import('../features/caisse/caisse.js')
    const html = htmlRecu({ reference: 'TA-ABC123', debut: '2026-12-01T19:00:00Z', fin: '2026-12-01T20:00:00Z', montant: 15000 },
      { etablissement: 'ARENA TERANGA', qr: 'data:image/png;base64,AAAA' })
    expect(html).toContain('<img class="logo" src="/marque/logo.png"')
    expect(html).toContain('<h1>ARENA TERANGA</h1>')
    expect(html).toContain('au plus tôt 15 min avant')
    expect(html).toContain('À bientôt sur nos terrains !')
  })

  it('aide du scan : marge du complexe', async () => {
    await charger({ MARQUE_COMPLETE: COMPLEXE })
    const { AIDES } = await import('../components/aidesPages.js')
    expect(AIDES.scan.join(' ')).toContain('à partir de 15 min avant')
  })

  it('sans dossier : comportement d origine', async () => {
    const { marque } = await charger({})
    expect(marque.nom).toBe('TerrainApp')
    expect(marque.personnalise).toBe(false)
    expect(marque.margeEntreeMinutes).toBe(30)
    expect(marque.piedDeRecu).toBe('Merci et bon match !')
    const { htmlRecu } = await import('../features/caisse/caisse.js')
    expect(htmlRecu({ reference: 'X', debut: '2026-12-01T19:00:00Z', fin: '2026-12-01T20:00:00Z' }, { etablissement: 'TerrainApp' }))
      .not.toContain('class="logo"')
  })
})
