import { describe, expect, it } from 'vitest'
import { roleActif } from './fonctionnalites.js'

describe('roleActif', () => {
  it('Gerant et Admin toujours actifs, Accueil et Controleur selon le reglage', () => {
    expect(roleActif('GERANT', false)).toBe(true)
    expect(roleActif('ADMIN', false)).toBe(true)
    expect(roleActif('ACCUEIL', false)).toBe(false)
    expect(roleActif('CONTROLEUR', false)).toBe(false)
    expect(roleActif('ACCUEIL', true)).toBe(true)
  })
})
