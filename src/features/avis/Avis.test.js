import { describe, expect, it } from 'vitest'
import { moyenne } from './Avis.jsx'

describe('avis', () => {
  it('moyenne a une decimale', () => {
    expect(moyenne([{ note: 5 }, { note: 4 }, { note: 4 }])).toBe(4.3)
    expect(moyenne([])).toBeNull()
  })
})
