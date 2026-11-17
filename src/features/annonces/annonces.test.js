import { describe, expect, it } from 'vitest'
import { countByStatut, refusVideo, slidesEnvoyees } from './annonces.js'

describe('annonces', () => {
  it('compte par statut', () => {
    expect(countByStatut([{ statut: 'ACTIF' }, { statut: 'ACTIF' }, { statut: 'ARCHIVE' }]))
      .toEqual({ BROUILLON: 0, ACTIF: 2, ARCHIVE: 1 })
  })

  it('refuse les videos trop lourdes, trop longues ou d un autre format', () => {
    expect(refusVideo({ type: 'video/mp4', size: 5e6 }, 20)).toBeNull()
    expect(refusVideo({ type: 'video/quicktime', size: 5e6 })).toMatch(/MP4 ou WebM/)
    expect(refusVideo({ type: 'video/mp4', size: 40 * 1048576 })).toMatch(/30 Mo/)
    expect(refusVideo({ type: 'video/webm', size: 1e6 }, 95)).toMatch(/60 secondes/)
  })

  it('garde les adresses deja enregistrees et nettoie les slides', async () => {
    const r = await slidesEnvoyees({ titre: 'A', slides: [
      { id: 's1', titre: 'Video', message: '', mediaUrl: '/videos/demo/presentation.mp4', mediaType: 'VIDEO' },
      { id: 's2', titre: 'Sans visuel', message: 'x', mediaUrl: '', mediaType: 'VIDEO' },
    ] })
    expect(r.slides).toEqual([
      { titre: 'Video', message: '', mediaUrl: '/videos/demo/presentation.mp4', mediaType: 'VIDEO' },
      { titre: 'Sans visuel', message: 'x', mediaUrl: null, mediaType: 'IMAGE' },
    ])
  })
})
