import { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { apiDelete, apiGet, apiPost } from '../../api/client.js'
import { dateCourte, decalerJour, heure, instantDe, jourISO } from '../../utils/dates.js'
import '../../styles/terrains.css'
import EnTetePage from '../../components/EnTetePage.jsx'

// Fermer une periode a la reservation (entretien, evenement prive) : un
// terrain ou tout le complexe. Les reservations deja prises ne sont pas
// touchees : a annuler a part depuis le planning si besoin.
export default function Blocages() {
  const [terrains, setTerrains] = useState([])
  const [blocages, setBlocages] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [toast, setToast] = useState(null)
  const [levee, setLevee] = useState(null)
  // Le formulaire ne s'ouvre qu'a la demande : la liste d'abord.
  const [formulaire, setFormulaire] = useState(false)
  const aujourdhui = jourISO()
  const [f, setF] = useState({ terrainId: '', jourDebut: aujourdhui, heureDebut: '08:00', jourFin: aujourdhui, heureFin: '12:00', motif: '' })
  const notifier = (type, message) => setToast({ id: Date.now(), type, message })

  const charger = useCallback(async () => {
    try {
      const debut = `${aujourdhui}T00:00:00Z`
      const fin = `${decalerJour(aujourdhui, 90)}T00:00:00Z`
      const [t, b] = await Promise.all([apiGet('/terrains'), apiGet(`/blocages?debut=${debut}&fin=${fin}`)])
      setTerrains(t)
      setBlocages(b)
    } catch (e) {
      setErreur(e.message)
    }
  }, [aujourdhui])

  useEffect(() => { charger() }, [charger])

  async function bloquer(e) {
    e.preventDefault()
    const debut = instantDe(f.jourDebut, f.heureDebut)
    const fin = instantDe(f.jourFin, f.heureFin)
    if (fin <= debut) {
      notifier('error', 'La fin doit être après le début.')
      return
    }
    try {
      await apiPost('/blocages', { terrainId: f.terrainId ? Number(f.terrainId) : null, debut, fin, motif: f.motif.trim() || null })
      notifier('success', 'Période fermée à la réservation.')
      setF((x) => ({ ...x, motif: '' }))
      setFormulaire(false)
      charger()
    } catch (err) {
      notifier('error', err.message)
    }
  }

  async function lever() {
    const b = levee
    setLevee(null)
    try {
      await apiDelete(`/blocages/${b.id}`)
      notifier('success', 'Fermeture levée : les créneaux sont de nouveau réservables.')
      charger()
    } catch (err) {
      notifier('error', err.message)
    }
  }

  const nomTerrain = (id) => (id == null ? 'Tout le complexe' : terrains.find((t) => t.id === id)?.nom || `Terrain ${id}`)
  const maj = (champ) => (e) => setF((x) => ({ ...x, [champ]: e.target.value }))

  return (
    <Layout>
      <EnTetePage groupe="planning"
        aide="Fermez un terrain ou tout le complexe à la réservation (entretien, événement privé). Les réservations déjà prises ne sont pas annulées : faites-le depuis l’onglet Réservations si besoin."
        actions={!formulaire && (
          <button className="manager-button manager-button-primary" type="button" onClick={() => setFormulaire(true)}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Fermer une période
          </button>
        )} />

      {formulaire && (
      <form className="ta-form scan-panneau" onSubmit={bloquer} style={{ marginBottom: 20 }}>
        <div className="ta-form-ligne">
          <label>Terrain
            <select value={f.terrainId} onChange={maj('terrainId')}>
              <option value="">Tout le complexe</option>
              {terrains.map((t) => <option key={t.id} value={t.id}>{t.nom} · {t.sport}</option>)}
            </select>
          </label>
          <label>Motif <span className="ta-form-aide">facultatif</span>
            <input value={f.motif} onChange={maj('motif')} maxLength={200} placeholder="Entretien du gazon" />
          </label>
        </div>
        <div className="ta-form-ligne">
          <label>Du<input type="date" value={f.jourDebut} onChange={maj('jourDebut')} /></label>
          <label>à<input type="time" value={f.heureDebut} onChange={maj('heureDebut')} /></label>
          <label>Au<input type="date" value={f.jourFin} onChange={maj('jourFin')} /></label>
          <label>à<input type="time" value={f.heureFin} onChange={maj('heureFin')} /></label>
        </div>
        <div className="ta-gps-actions">
          <button className="manager-button manager-button-primary" type="submit">Fermer cette période</button>
          <button className="manager-button manager-button-quiet" type="button" onClick={() => setFormulaire(false)}>Annuler</button>
        </div>
      </form>
      )}

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {blocages?.length === 0 && <p className="planning-vide">Aucune fermeture prévue dans les 90 prochains jours : tout est réservable.</p>}
      {blocages?.length > 0 && (
        <div className="ta-table-wrap">
          <table className="ta-table">
            <thead><tr><th>Terrain</th><th>Début</th><th>Fin</th><th>Motif</th><th /></tr></thead>
            <tbody>
              {blocages.map((b) => (
                <tr key={b.id}>
                  <td>{nomTerrain(b.terrainId)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{dateCourte(b.debut)} {heure(b.debut)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{dateCourte(b.fin)} {heure(b.fin)}</td>
                  <td>{b.motif || '—'}</td>
                  <td><button className="manager-button manager-button-quiet" type="button" onClick={() => setLevee(b)}>Lever</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {levee && (
        <ConfirmModal title="Lever cette fermeture ?" message={`${nomTerrain(levee.terrainId)} redevient réservable sur cette période.`}
          confirmLabel="Lever la fermeture" onConfirm={lever} onCancel={() => setLevee(null)} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
