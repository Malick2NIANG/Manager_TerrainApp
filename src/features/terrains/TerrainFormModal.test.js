import { describe, expect, it } from 'vitest'
import { erreursFormulaire, resumeHoraires, versApi } from './TerrainFormModal.jsx'

const base = {
  sportId: '2', nom: ' Terrain A ', description: '', surface: 'Gazon', capacite: '10', equipements: 'Éclairage, , Vestiaires',
  localite: ' Liberté 6 ', gps: 'https://www.google.com/maps/@14.7256,-17.4569,17z', photos: ['/images/demo/a.jpg', ''], dureeCreneauMinutes: '90', tarifHeure: '15000', ordre: '', actif: true,
  plages: [{ libelle: 'Soirée', jours: [1, 2], debut: '18:00', fin: '01:00', tarifHeure: '20000' }],
}

describe('formulaire terrain', () => {
  it('convertit la saisie pour l API', () => {
    const c = versApi(base)
    expect(c).toMatchObject({ sportId: 2, nom: 'Terrain A', capacite: 10, dureeCreneauMinutes: 90, tarifHeure: 15000, ordre: 0, localite: 'Liberté 6' })
    expect(c.photos).toEqual(['/images/demo/a.jpg'])
    expect(c).toMatchObject({ latitude: 14.7256, longitude: -17.4569 })
    expect(c.equipements).toEqual(['Éclairage', 'Vestiaires'])
    expect(c.plages[0]).toEqual({ libelle: 'Soirée', jours: [1, 2], debut: '18:00', fin: '01:00', tarifHeure: 20000 })
    expect(c.dureesProposees).toEqual([90])
  })

  it('durees proposees : la plus courte devient la duree de creneau', () => {
    const c = versApi({ ...base, durees: [120, 60, 90] })
    expect(c).toMatchObject({ dureeCreneauMinutes: 60, dureesProposees: [60, 90, 120] })
    expect(erreursFormulaire({ ...base, durees: [] })).toEqual(['au moins une durée proposée'])
    expect(erreursFormulaire({ ...base, durees: [45, 60] })[0]).toMatch(/durées compatibles/)
    expect(erreursFormulaire({ ...base, durees: [45, 90] })).toEqual([])
  })

  it('signale les champs manquants', () => {
    expect(erreursFormulaire(base)).toEqual([])
    expect(erreursFormulaire({ ...base, nom: ' ', tarifHeure: '' })).toEqual(['le nom', 'le tarif horaire'])
    expect(erreursFormulaire({ ...base, plages: [{ ...base.plages[0], jours: [] }] })).toEqual(['la plage tarifaire n°1'])
    expect(erreursFormulaire({ ...base, gps: 'pas une position' })[0]).toMatch(/position GPS/)
  })
})

describe('horaires propres au terrain', () => {
  const jours = (o) => [1, 2, 3, 4, 5, 6, 7].map((jour) => ({ jour, ouvert: true, ouverture: '10:00', fermeture: '22:00', ...o(jour) }))
  it('resume lisible', () => {
    expect(resumeHoraires(null)).toBe('Mêmes horaires que le complexe')
    expect(resumeHoraires(jours(() => ({})))).toBe('Tous les jours 10:00–22:00')
    expect(resumeHoraires(jours((j) => ({ ouvert: j < 6 })))).toBe('5 jours sur 7, 10:00–22:00')
    expect(resumeHoraires(jours((j) => (j === 6 ? { fermeture: '00:00' } : {})))).toBe('7 jours sur 7, horaires propres')
  })
})
