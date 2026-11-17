import { describe, expect, it } from 'vitest'
import { estSurPage, notificationPour, tempsEcoule } from './NotificationsContext.jsx'

const reservation = (champs) => ({
  id: 7, reference: 'RABC234', terrain: 'Terrain A', debut: '2026-11-20T19:00:00Z', montant: 20000,
  canal: 'APP', statut: 'CONFIRMEE', ...champs,
})

describe('notifications du planning', () => {
  it('nouvelle reservation en ligne pour le gerant et l accueil', () => {
    const n = notificationPour('ACCUEIL', { type: 'RESERVATION_CONFIRMEE', reservation: reservation() })
    expect(n.title).toBe('Nouvelle réservation RABC234')
    expect(n.text).toContain('Terrain A')
    expect(n.text).toContain('20')
    expect(n.target).toBe('/planning')
    expect(n.lien).toBe('/planning?date=2026-11-20&reservation=7')
    expect(notificationPour('GERANT', { type: 'RESERVATION_CONFIRMEE', reservation: reservation() })).not.toBeNull()
  })

  it('pas de notification pour une reservation saisie au comptoir, ni pour le controleur', () => {
    expect(notificationPour('ACCUEIL', { type: 'RESERVATION_CONFIRMEE', reservation: reservation({ canal: 'COMPTOIR' }) })).toBeNull()
    expect(notificationPour('CONTROLEUR', { type: 'RESERVATION_CONFIRMEE', reservation: reservation() })).toBeNull()
    expect(notificationPour('ADMIN', { type: 'STATUT_CHANGE', reservation: reservation({ statut: 'ANNULEE' }) })).toBeNull()
  })

  it('annulation : creneau libere', () => {
    const n = notificationPour('GERANT', { type: 'STATUT_CHANGE', reservation: reservation({ statut: 'ANNULEE' }) })
    expect(n.kind).toBe('annulee')
    expect(n.cle).toBe('7-ANNULEE')
  })

  it('temps ecoule', () => {
    const t = Date.parse('2026-11-20T12:00:00Z')
    expect(tempsEcoule('2026-11-20T11:58:00Z', t)).toBe('Il y a 2 min')
    expect(tempsEcoule('2026-11-19T11:00:00Z', t)).toBe('Hier')
  })

  it('page de la notification : /planning et ses sous-pages seulement', () => {
    expect(estSurPage('/planning', '/planning')).toBe(true)
    expect(estSurPage('/planning/x', '/planning')).toBe(true)
    expect(estSurPage('/planningx', '/planning')).toBe(false)
    expect(estSurPage('/abonnements', '/planning')).toBe(false)
  })
})
