import { describe, expect, it } from 'vitest'
import { formaterSaisieLocale, normaliserTelephone } from './ComptoirModal.jsx'

describe('reservation au comptoir', () => {
  it('telephone : +221 fixe, numero mis en forme, meme regle que l App Client', () => {
    expect(formaterSaisieLocale('771234567')).toBe('77 123 45 67')
    expect(formaterSaisieLocale('+221 77 123 45 67')).toBe('77 123 45 67')
    expect(normaliserTelephone('77 123 45 67')).toBe('+221771234567')
    expect(normaliserTelephone('12 345 67 89')).toBeNull()
  })
})
