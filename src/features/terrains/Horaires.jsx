import { useEffect, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import { apiGet, apiPut } from '../../api/client.js'
import { JOURS } from './TerrainFormModal.jsx'
import '../../styles/terrains.css'

const NOMS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const hhmm = (t) => String(t || '').slice(0, 5)

// Horaires d'ouverture du complexe : les creneaux de chaque terrain vont de
// l'ouverture a la fermeture. Fermeture avant l'ouverture = apres minuit
// (ex. 08:00 -> 01:00) : ces creneaux de nuit comptent pour le jour d'ouverture.
export default function Horaires() {
  const [lignes, setLignes] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    apiGet('/horaires')
      .then((h) => setLignes(h.map((x) => ({ ...x, ouverture: hhmm(x.ouverture), fermeture: hhmm(x.fermeture) }))))
      .catch((e) => setErreur(e.message))
  }, [])

  const maj = (jour, champ, valeur) => setLignes((l) => l.map((x) => (x.jour === jour ? { ...x, [champ]: valeur } : x)))

  async function enregistrer() {
    setEnvoi(true)
    try {
      const h = await apiPut('/horaires', lignes.map(({ jour, ouvert, ouverture, fermeture }) => ({ jour, ouvert, ouverture, fermeture })))
      setLignes(h.map((x) => ({ ...x, ouverture: hhmm(x.ouverture), fermeture: hhmm(x.fermeture) })))
      setToast({ id: Date.now(), type: 'success', message: 'Horaires enregistrés : les créneaux sont mis à jour.' })
    } catch (e) {
      setToast({ id: Date.now(), type: 'error', message: e.message })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Horaires d’ouverture</h1>
          <p>Les créneaux réservables vont de l’ouverture à la fermeture, chaque jour.</p>
        </div>
      </section>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {lignes && (
        <>
          <div className="ta-table-wrap">
            <table className="ta-table">
              <thead><tr><th>Jour</th><th>Ouvert</th><th>Ouverture</th><th>Fermeture</th><th /></tr></thead>
              <tbody>
                {lignes.map((h) => (
                  <tr key={h.jour}>
                    <td><strong>{NOMS[h.jour] || JOURS[h.jour - 1]?.court}</strong></td>
                    <td><input type="checkbox" aria-label={`Ouvert le ${NOMS[h.jour]}`} checked={h.ouvert} onChange={(e) => maj(h.jour, 'ouvert', e.target.checked)} /></td>
                    <td><input type="time" aria-label={`Ouverture ${NOMS[h.jour]}`} value={h.ouverture} disabled={!h.ouvert} onChange={(e) => maj(h.jour, 'ouverture', e.target.value)} /></td>
                    <td><input type="time" aria-label={`Fermeture ${NOMS[h.jour]}`} value={h.fermeture} disabled={!h.ouvert} onChange={(e) => maj(h.jour, 'fermeture', e.target.value)} /></td>
                    <td className="ta-form-aide">{h.ouvert ? (h.fermeture <= h.ouverture ? 'Ferme après minuit' : '') : 'Fermé'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="manager-modal-actions" style={{ marginTop: 16 }}>
            <button className="manager-button manager-button-primary" type="button" onClick={enregistrer} disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer les horaires'}
            </button>
          </div>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
