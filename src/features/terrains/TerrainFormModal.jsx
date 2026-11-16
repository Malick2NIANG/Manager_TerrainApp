import { useState } from 'react'
import GaleriePhotos from './GaleriePhotos.jsx'
import { gpsEnTexte, lireGps } from './gps.js'
import { estVideo, mediaEnvoye } from '../annonces/annonces.js'
import { formatFCFA } from '../../utils/dates.js'

export const JOURS = [
  { n: 1, court: 'Lun' }, { n: 2, court: 'Mar' }, { n: 3, court: 'Mer' }, { n: 4, court: 'Jeu' },
  { n: 5, court: 'Ven' }, { n: 6, court: 'Sam' }, { n: 7, court: 'Dim' },
]
const DUREES = [30, 45, 60, 90, 120]
const hhmm = (t) => String(t || '').slice(0, 5)

/** Saisie du formulaire -> corps de l'API (montants entiers, champs nettoyes). */
export function versApi(f) {
  return {
    sportId: Number(f.sportId),
    nom: f.nom.trim(),
    description: f.description?.trim() || null,
    localite: f.localite?.trim() || null,
    latitude: lireGps(f.gps)?.latitude ?? null,
    longitude: lireGps(f.gps)?.longitude ?? null,
    surface: f.surface?.trim() || null,
    capacite: Number(f.capacite),
    equipements: String(f.equipements || '').split(',').map((e) => e.trim()).filter(Boolean),
    photos: (f.photos || []).filter(Boolean),
    dureeCreneauMinutes: Number(f.dureeCreneauMinutes),
    tarifHeure: Number(f.tarifHeure),
    plages: f.plages.map((p) => ({ libelle: p.libelle.trim(), jours: p.jours, debut: p.debut, fin: p.fin, tarifHeure: Number(p.tarifHeure) })),
    actif: f.actif,
    ordre: Number(f.ordre) || 0,
  }
}

/** Champs manquants ou invalides, en clair. */
export function erreursFormulaire(f) {
  const e = []
  if (!f.sportId) e.push('le sport')
  if (!f.nom.trim()) e.push('le nom')
  if (!(Number(f.capacite) > 0)) e.push('la capacité')
  if (f.gps?.trim() && !lireGps(f.gps)) e.push('la position GPS (ex. 14.7256, -17.4569 ou un lien Google Maps)')
  if (!(Number(f.tarifHeure) >= 0) || f.tarifHeure === '') e.push('le tarif horaire')
  f.plages.forEach((p, i) => {
    if (!p.libelle.trim() || !p.jours.length || !p.debut || !p.fin || p.debut === p.fin || p.tarifHeure === '') {
      e.push(`la plage tarifaire n°${i + 1}`)
    }
  })
  return e
}

function depuis(terrain, sports) {
  return terrain ? {
    sportId: terrain.sportId, nom: terrain.nom, description: terrain.description || '', localite: terrain.localite || '', gps: gpsEnTexte(terrain.latitude, terrain.longitude),
    surface: terrain.surface || '', capacite: terrain.capacite, equipements: terrain.equipements.join(', '),
    photos: terrain.photos || (terrain.photoUrl ? [terrain.photoUrl] : []),
    dureeCreneauMinutes: terrain.dureeCreneauMinutes, tarifHeure: terrain.tarifHeure,
    plages: terrain.plages.map((p) => ({ ...p, debut: hhmm(p.debut), fin: hhmm(p.fin) })), actif: terrain.actif, ordre: terrain.ordre,
  } : {
    sportId: sports[0]?.id || '', nom: '', description: '', localite: '', gps: '', surface: 'Gazon synthétique', capacite: 10,
    equipements: 'Éclairage, Vestiaires', photos: [], dureeCreneauMinutes: 60, tarifHeure: '', plages: [], actif: true, ordre: 0,
  }
}

export default function TerrainFormModal({ terrain, sports, onFermer, onEnregistrer }) {
  const [f, setF] = useState(() => depuis(terrain, sports))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [localisation, setLocalisation] = useState(null)
  const maPosition = () => {
    if (!navigator.geolocation) {
      setLocalisation('La localisation n’est pas disponible sur cet appareil.')
      return
    }
    setLocalisation('Localisation en cours…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setF((x) => ({ ...x, gps: gpsEnTexte(Math.round(coords.latitude * 1e6) / 1e6, Math.round(coords.longitude * 1e6) / 1e6) }))
        setLocalisation(`Position relevée (précision ${Math.round(coords.accuracy)} m).`)
      },
      () => setLocalisation('Position refusée ou introuvable : collez plutôt un lien Google Maps.'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }
  const maj = (champ) => (e) => setF((x) => ({ ...x, [champ]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const majPlage = (i, champ, valeur) => setF((x) => ({ ...x, plages: x.plages.map((p, j) => (j === i ? { ...p, [champ]: valeur } : p)) }))

  async function valider(e) {
    e.preventDefault()
    const manquants = erreursFormulaire(f)
    if (manquants.length) {
      setErreur(`À compléter : ${manquants.join(', ')}.`)
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      // Photos et videos encore dans le navigateur : envoyees une a une, dans l'ordre.
      const photos = []
      for (const url of f.photos) photos.push(await mediaEnvoye(url, estVideo(url) ? 'VIDEO' : 'IMAGE'))
      await onEnregistrer(versApi({ ...f, photos }))
    } catch (err) {
      setEnvoi(false)
      setErreur(err.message)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="terrain-titre">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Terrains et tarifs</p>
            <h2 id="terrain-titre">{terrain ? `Modifier ${terrain.nom}` : 'Nouveau terrain'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className="ta-form" onSubmit={valider} noValidate>
          <div className="ta-form-ligne">
            <label>Sport
              <select value={f.sportId} onChange={maj('sportId')}>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </label>
            <label>Nom du terrain
              <input value={f.nom} onChange={maj('nom')} maxLength={80} placeholder="Terrain A" />
            </label>
          </div>
          <label>Description <span className="ta-form-aide">ce que le client lit sur l’annonce</span>
            <textarea rows={3} value={f.description} onChange={maj('description')} maxLength={1000}
              placeholder="Terrain couvert, gazon récent, éclairage LED…" />
          </label>
          <label>Localité <span className="ta-form-aide">quartier ou site, pour la recherche</span>
            <input value={f.localite} onChange={maj('localite')} maxLength={120} placeholder="Liberté 6, Dakar" />
          </label>
          <label>Position GPS <span className="ta-form-aide">pour le bouton « Itinéraire » de l’app : coordonnées ou lien Google Maps</span>
            <input value={f.gps} onChange={maj('gps')} placeholder="14.7256, -17.4569" />
          </label>
          <div className="ta-gps-actions">
            <button type="button" className="manager-button manager-button-quiet" onClick={maPosition}>
              <i className="fa-solid fa-location-crosshairs" aria-hidden="true" /> Ma position actuelle
            </button>
            {lireGps(f.gps) && (
              <a className="manager-button manager-button-quiet" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${lireGps(f.gps).latitude},${lireGps(f.gps).longitude}`}>
                <i className="fa-solid fa-map-location-dot" aria-hidden="true" /> Vérifier sur la carte
              </a>
            )}
            {localisation && <span className="ta-form-aide">{localisation}</span>}
          </div>
          <div className="ta-form-ligne">
            <label>Surface
              <input value={f.surface} onChange={maj('surface')} maxLength={60} />
            </label>
            <label>Joueurs (capacité)
              <input type="number" min={1} max={100} value={f.capacite} onChange={maj('capacite')} />
            </label>
            <label>Ordre d’affichage
              <input type="number" min={0} value={f.ordre} onChange={maj('ordre')} />
            </label>
          </div>
          <label>Équipements <span className="ta-form-aide">séparés par des virgules</span>
            <input value={f.equipements} onChange={maj('equipements')} />
          </label>

          <GaleriePhotos photos={f.photos} onChange={(photos) => setF((x) => ({ ...x, photos }))} />

          <div className="ta-form-ligne">
            <label>Durée d’un créneau
              <select value={f.dureeCreneauMinutes} onChange={maj('dureeCreneauMinutes')}>
                {DUREES.map((d) => <option key={d} value={d}>{d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ''}`}</option>)}
              </select>
            </label>
            <label>Tarif à l’heure (F CFA)
              <input type="number" min={0} step={500} value={f.tarifHeure} onChange={maj('tarifHeure')} placeholder="15000" />
            </label>
          </div>

          <fieldset>
            <legend>Tarifs particuliers (heures pleines, week-end…)</legend>
            <div className="ta-plages">
              {f.plages.map((p, i) => (
                <div className="ta-plage" key={i}>
                  <div className="ta-form-ligne">
                    <label>Nom<input value={p.libelle} onChange={(e) => majPlage(i, 'libelle', e.target.value)} placeholder="Soirée" /></label>
                    <label>De<input type="time" value={p.debut} onChange={(e) => majPlage(i, 'debut', e.target.value)} /></label>
                    <label>À<input type="time" value={p.fin} onChange={(e) => majPlage(i, 'fin', e.target.value)} /></label>
                    <label>Tarif / h<input type="number" min={0} step={500} value={p.tarifHeure} onChange={(e) => majPlage(i, 'tarifHeure', e.target.value)} /></label>
                  </div>
                  <div className="ta-jours" role="group" aria-label="Jours">
                    {JOURS.map((j) => {
                      const actif = p.jours.includes(j.n)
                      return (
                        <button key={j.n} type="button" aria-pressed={actif} className={actif ? 'is-actif' : ''}
                          onClick={() => majPlage(i, 'jours', actif ? p.jours.filter((x) => x !== j.n) : [...p.jours, j.n].sort())}>
                          {j.court}
                        </button>
                      )
                    })}
                    <button type="button" className="manager-button manager-button-quiet" onClick={() => setF((x) => ({ ...x, plages: x.plages.filter((_, k) => k !== i) }))}>
                      Supprimer
                    </button>
                  </div>
                  {p.fin && p.debut && p.fin < p.debut && <span className="ta-form-aide">Passe minuit : compte pour le jour du début.</span>}
                </div>
              ))}
              <div>
                <button type="button" className="manager-button manager-button-quiet"
                  onClick={() => setF((x) => ({ ...x, plages: [...x.plages, { libelle: 'Soirée', jours: [1, 2, 3, 4, 5, 6, 7], debut: '18:00', fin: '01:00', tarifHeure: '' }] }))}>
                  <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter un tarif particulier
                </button>
              </div>
            </div>
          </fieldset>

          {f.tarifHeure !== '' && (
            <p className="ta-form-aide">
              Créneau de {f.dureeCreneauMinutes} min au tarif de base : {formatFCFA(Math.round(Number(f.tarifHeure) * Number(f.dureeCreneauMinutes) / 60))}.
            </p>
          )}

          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={f.actif} onChange={maj('actif')} /> Terrain réservable
          </label>

          {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </section>

    </div>
  )
}
