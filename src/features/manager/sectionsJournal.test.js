import { describe, expect, it } from 'vitest'
import { SECTIONS_JOURNAL, sectionDepuisSlug } from './sectionsJournal.js'
import { filtrerJournal, libellesFiltres } from './journalAuditFiltres.js'

const entree = (domaine) => ({ domaine, action: 'a fait quelque chose', acteur: { nom: 'awa', role: 'GERANT' } })

describe('sous-pages du journal des gerants', () => {
  it('chaque carte a son adresse', () => {
    expect(SECTIONS_JOURNAL.map((s) => s.slug)).toEqual(['reservations', 'terrains', 'sports', 'fermetures', 'annonces'])
    expect(sectionDepuisSlug('fermetures').domaines).toEqual(['BLOCAGE'])
    expect(sectionDepuisSlug('inconnue')).toBeNull()
  })
  it('une carte regroupe plusieurs types d actions', () => {
    const entrees = [entree('TERRAIN'), entree('REGLAGE'), entree('SPORT'), entree('RESERVATION')]
    expect(filtrerJournal(entrees, { domaine: sectionDepuisSlug('terrains').domaines })).toHaveLength(2)
    expect(libellesFiltres({ domaine: ['TERRAIN', 'REGLAGE'], libelleDomaine: 'Terrains et horaires' }).domaine).toBe('Terrains et horaires')
  })
})
