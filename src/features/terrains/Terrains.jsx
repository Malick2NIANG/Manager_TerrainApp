import { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client.js'
import { formatFCFA } from '../../utils/dates.js'
import TerrainFormModal from './TerrainFormModal.jsx'
import '../../styles/terrains.css'
import { estVideo } from '../annonces/annonces.js'

// Sports et terrains du complexe (gerant) : tarifs, plages tarifaires,
// duree de creneau, photo, ouverture a la reservation.
export default function Terrains() {
  const [sports, setSports] = useState([])
  const [terrains, setTerrains] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [toast, setToast] = useState(null)
  const [edition, setEdition] = useState(null) // null | { terrain? }
  const [nouveauSport, setNouveauSport] = useState('')
  const [suppression, setSuppression] = useState(null)

  const notifier = (type, message) => setToast({ id: Date.now(), type, message })

  const charger = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([apiGet('/sports'), apiGet('/terrains')])
      setSports(s)
      setTerrains(t)
      setErreur(null)
    } catch (e) {
      setErreur(e.message)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  async function ajouterSport(e) {
    e.preventDefault()
    if (!nouveauSport.trim()) return
    try {
      await apiPost('/sports', { nom: nouveauSport.trim(), ordre: sports.length + 1 })
      setNouveauSport('')
      notifier('success', 'Sport ajouté.')
      charger()
    } catch (err) {
      notifier('error', err.message)
    }
  }

  async function basculerSport(s) {
    try {
      await apiPut(`/sports/${s.id}`, { nom: s.nom, ordre: s.ordre, actif: !s.actif })
      charger()
    } catch (err) {
      notifier('error', err.message)
    }
  }

  async function supprimerSport() {
    const s = suppression
    setSuppression(null)
    try {
      await apiDelete(`/sports/${s.id}`)
      notifier('success', `Sport « ${s.nom} » supprimé.`)
      charger()
    } catch (err) {
      notifier('error', err.message)
    }
  }

  async function enregistrer(corps) {
    if (edition.terrain) await apiPut(`/terrains/${edition.terrain.id}`, corps)
    else await apiPost('/terrains', corps)
    setEdition(null)
    notifier('success', edition.terrain ? 'Terrain modifié.' : 'Terrain créé.')
    charger()
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Terrains et tarifs</h1>
          <p>Vos sports, vos terrains, leurs tarifs et la durée des créneaux.</p>
        </div>
      </section>

      <h2 className="dashboard-section-heading" style={{ fontSize: 16 }}>Sports</h2>
      <div className="ta-sports">
        {sports.map((s) => (
          <span className={`ta-sport ${s.actif ? '' : 'ta-inactif'}`} key={s.id}>
            {s.nom}
            <button type="button" title={s.actif ? 'Masquer ce sport' : 'Réafficher ce sport'} aria-label={s.actif ? `Masquer ${s.nom}` : `Réafficher ${s.nom}`} onClick={() => basculerSport(s)}>
              <i className={`fa-solid ${s.actif ? 'fa-eye' : 'fa-eye-slash'}`} aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Supprimer ${s.nom}`} onClick={() => setSuppression(s)}>
              <i className="fa-solid fa-trash" aria-hidden="true" />
            </button>
          </span>
        ))}
        <form className="ta-form" style={{ flexDirection: 'row', gap: 8 }} onSubmit={ajouterSport}>
          <input value={nouveauSport} onChange={(e) => setNouveauSport(e.target.value)} placeholder="Nouveau sport (ex. Padel)" aria-label="Nouveau sport" maxLength={60} />
          <button className="manager-button manager-button-quiet" type="submit" disabled={!nouveauSport.trim()}>Ajouter</button>
        </form>
      </div>

      <div className="ta-toolbar">
        <h2 className="dashboard-section-heading" style={{ fontSize: 16, margin: 0 }}>Terrains</h2>
        <span className="ta-toolbar-spacer" />
        <button className="manager-button manager-button-primary" type="button" disabled={!sports.length} onClick={() => setEdition({})}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Nouveau terrain
        </button>
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {terrains === null && !erreur && <p className="planning-vide">Chargement…</p>}
      {terrains?.length === 0 && <p className="planning-vide">{sports.length ? 'Aucun terrain pour le moment.' : 'Ajoutez d’abord un sport.'}</p>}

      {terrains?.length > 0 && (
        <div className="ta-liste">
          {terrains.map((t) => (
            <article className={`ta-carte ${t.actif ? '' : 'ta-inactif'}`} key={t.id}>
              <div className="ta-carte-photo" style={t.photoUrl && !estVideo(t.photoUrl) ? { backgroundImage: `url(${t.photoUrl})` } : undefined}>
                {t.photoUrl && estVideo(t.photoUrl) && <video src={t.photoUrl} muted playsInline preload="metadata" aria-label="Vidéo de couverture" />}
                {!t.photoUrl && <i className="fa-solid fa-futbol" aria-hidden="true" />}
                <span className="ta-carte-nb-photos">
                  <i className="fa-solid fa-images" aria-hidden="true" /> {t.photos?.length || 0}
                </span>
              </div>
              <div className="ta-carte-corps">
                <h3>{t.nom}</h3>
                <p>{t.sport} · {t.capacite} joueurs · créneaux de {t.dureeCreneauMinutes} min</p>
                {t.localite && <p><i className="fa-solid fa-location-dot" aria-hidden="true" /> {t.localite}</p>}
                <p>
                  {t.nombreAvis > 0
                    ? <><i className="fa-solid fa-star ta-etoile" aria-hidden="true" /> {String(t.noteMoyenne).replace('.', ',')} · {t.nombreAvis} avis</>
                    : <span className="ta-form-aide">Pas encore d’avis</span>}
                </p>
                <p><strong>{formatFCFA(t.tarifHeure)} / h</strong>
                  {t.plages.length > 0 && ` · ${t.plages.map((p) => `${p.libelle} ${formatFCFA(p.tarifHeure)}`).join(' · ')}`}</p>
                {!t.actif && <p>Non réservable</p>}
              </div>
              <div className="ta-carte-actions">
                <button className="manager-button manager-button-quiet" type="button" onClick={() => setEdition({ terrain: t })}>
                  <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {edition && <TerrainFormModal terrain={edition.terrain} sports={sports} onFermer={() => setEdition(null)} onEnregistrer={enregistrer} />}
      {suppression && (
        <ConfirmModal title={`Supprimer le sport « ${suppression.nom} » ?`}
          message="Possible seulement si aucun terrain ne l’utilise. Sinon, masquez-le."
          confirmLabel="Supprimer" tone="danger" icon="fa-trash"
          onConfirm={supprimerSport} onCancel={() => setSuppression(null)} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
