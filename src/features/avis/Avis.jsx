import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import { apiGet, apiPatch } from '../../api/client.js'
import '../../styles/terrains.css'

const FILTRES = [
  { key: 'TOUS', label: 'Tous les avis', icon: 'fa-star', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'VISIBLES', label: 'Visibles', icon: 'fa-eye', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'MASQUES', label: 'Masqués', icon: 'fa-eye-slash', accent: '#5b5b5f', accentBg: '#ececea' },
]
const DATE = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', dateStyle: 'medium' })

function Etoiles({ note }) {
  return (
    <span className="ta-etoiles" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={`fa-${i <= note ? 'solid' : 'regular'} fa-star`} aria-hidden="true" />)}
    </span>
  )
}

/** Moyenne a une decimale, ou null sans avis. */
export function moyenne(avis) {
  if (!avis.length) return null
  return Math.round((avis.reduce((t, a) => t + a.note, 0) / avis.length) * 10) / 10
}

// Avis des joueurs (App Client, apres le match) : le gerant les lit et peut
// masquer un avis abusif (il disparait de l'app et de la note moyenne).
export default function Avis() {
  const [avis, setAvis] = useState(null)
  const [terrains, setTerrains] = useState({})
  const [filtre, setFiltre] = useState('TOUS')
  const [terrain, setTerrain] = useState('')
  const [erreur, setErreur] = useState(null)
  const [toast, setToast] = useState(null)

  const charger = useCallback(() => {
    Promise.all([apiGet('/avis'), apiGet('/terrains')])
      .then(([a, t]) => {
        setAvis(a)
        setTerrains(Object.fromEntries(t.map((x) => [x.id, x.nom])))
      })
      .catch((e) => setErreur(e.message))
  }, [])

  useEffect(() => { charger() }, [charger])

  const liste = useMemo(() => (avis || [])
    .filter((a) => filtre === 'TOUS' || (filtre === 'VISIBLES' ? a.visible : !a.visible))
    .filter((a) => !terrain || String(a.terrainId) === terrain), [avis, filtre, terrain])
  const compte = { TOUS: avis?.length || 0, VISIBLES: (avis || []).filter((a) => a.visible).length, MASQUES: (avis || []).filter((a) => !a.visible).length }
  const note = moyenne((avis || []).filter((a) => a.visible && (!terrain || String(a.terrainId) === terrain)))

  async function basculer(a) {
    try {
      const maj = await apiPatch(`/avis/${a.id}`, { visible: !a.visible })
      setAvis((l) => l.map((x) => (x.id === a.id ? maj : x)))
      setToast({ id: Date.now(), type: 'success', message: maj.visible ? 'Avis réaffiché.' : 'Avis masqué : il n’apparaît plus dans l’app.' })
    } catch (e) {
      setToast({ id: Date.now(), type: 'error', message: e.message })
    }
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Avis des joueurs</h1>
          <p>Notes laissées après les matchs. {note !== null && <strong>Moyenne : {String(note).replace('.', ',')} / 5.</strong>} Masquez un avis abusif : il disparaît de l’app et de la note.</p>
        </div>
      </section>

      <StatFilterCards items={FILTRES.map((f) => ({ ...f, value: compte[f.key] }))} selected={filtre} onSelect={setFiltre} />

      <div className="crud-toolbar">
        <select className="ta-select" value={terrain} onChange={(e) => setTerrain(e.target.value)} aria-label="Terrain">
          <option value="">Tous les terrains</option>
          {Object.entries(terrains).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
        </select>
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {avis === null && !erreur && <p className="planning-vide">Chargement…</p>}
      {avis && liste.length === 0 && <p className="planning-vide">Aucun avis pour le moment.</p>}

      <ul className="ta-avis-liste">
        {liste.map((a) => (
          <li key={a.id} className={`ta-avis ${a.visible ? '' : 'is-masque'}`}>
            <div className="ta-avis-entete">
              <Etoiles note={a.note} />
              <span className="ta-avis-terrain">{terrains[a.terrainId] || 'Terrain'}</span>
              {!a.visible && <span className="ta-avis-badge">Masqué</span>}
            </div>
            {a.commentaire ? <p className="ta-avis-texte">« {a.commentaire} »</p> : <p className="ta-avis-texte is-vide">Sans commentaire</p>}
            <div className="ta-avis-pied">
              <span>{a.auteur} · {DATE.format(new Date(a.creeLe))}</span>
              <button type="button" className="manager-button manager-button-quiet" onClick={() => basculer(a)}>
                <i className={`fa-solid ${a.visible ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" /> {a.visible ? 'Masquer' : 'Réafficher'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
