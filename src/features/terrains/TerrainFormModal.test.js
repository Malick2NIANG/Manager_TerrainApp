import { describe, expect, it } from 'vitest'
import { erreursFormulaire, versApi } from './TerrainFormModal.jsx'

const base = {
  sportId: '2', nom: ' Terrain A ', description: '', surface: 'Gazon', capacite: '10', equipements: 'Éclairage, , Vestiaires',
  photoUrl: '', dureeCreneauMinutes: '90', tarifHeure: '15000', ordre: '', actif: true,
  plages: [{ libelle: 'Soirée', jours: [1, 2], debut: '18:00', fin: '01:00', tarifHeure: '20000' }],
}

describe('formulaire terrain', () => {
  it('convertit la saisie pour l API', () => {
    const c = versApi(base)
    expect(c).toMatchObject({ sportId: 2, nom: 'Terrain A', capacite: 10, dureeCreneauMinutes: 90, tarifHeure: 15000, ordre: 0, photoUrl: null })
    expect(c.equipements).toEqual(['Éclairage', 'Vestiaires'])
    expect(c.plages[0]).toEqual({ libelle: 'Soirée', jours: [1, 2], debut: '18:00', fin: '01:00', tarifHeure: 20000 })
  })

  it('signale les champs manquants', () => {
    expect(erreursFormulaire(base)).toEqual([])
    expect(erreursFormulaire({ ...base, nom: ' ', tarifHeure: '' })).toEqual(['le nom', 'le tarif horaire'])
    expect(erreursFormulaire({ ...base, plages: [{ ...base.plages[0], jours: [] }] })).toEqual(['la plage tarifaire n°1'])
  })
})
