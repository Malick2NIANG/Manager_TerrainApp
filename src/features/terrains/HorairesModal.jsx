import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../api/client.js'

const NOMS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const hhmm = (t) => String(t || '').slice(0, 5)

/** "Tous les jours 08:00–23:00" ou "6 jours sur 7" (resume du bouton Horaires). */
export function resumeOuverture(horaires) {
  const ouverts = (horaires || []).filter((h) => h.ouvert)
  if (!ouverts.length) return 'Fermé'
  const memes = ouverts.every((h) => hhmm(h.ouverture) === hhmm(ouverts[0].ouverture) && hhmm(h.fermeture) === hhmm(ouverts[0].fermeture))
  if (memes && ouverts.length === 7) return `Tous les jours ${hhmm(ouverts[0].ouverture)}–${hhmm(ouverts[0].fermeture)}`
  return `${ouverts.length} jours sur 7`
}

// Horaires d'ouverture du complexe, en fenetre (ordinateur) ou feuille du
// bas (telephone). Les creneaux de chaque terrain (sans horaires propres)
// vont de l'ouverture a la fermeture ; fermeture avant l'ouverture = apres
// minuit, compte pour le jour d'ouverture.
export default function HorairesModal({ onFermer, onEnregistre }) {
  const [lignes, setLignes] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    apiGet('/horaires')
      .then((h) => setLignes(h.map((x) => ({ ...x, ouverture: hhmm(x.ouverture), fermeture: hhmm(x.fermeture) }))))
      .catch((e) => setErreur(e.message))
  }, [])

  const maj = (jour, champ, valeur) => setLignes((l) => l.map((x) => (x.jour === jour ? { ...x, [champ]: valeur } : x)))
  // Meme horaire pour toute la semaine : recopie celui du lundi.
  const appliquerPartout = () => setLignes((l) => l.map((x) => ({ ...x, ouvert: l[0].ouvert, ouverture: l[0].ouverture, fermeture: l[0].fermeture })))

  async function enregistrer() {
    setEnvoi(true)
    setErreur(null)
    try {
      const h = await apiPut('/horaires', lignes.map(({ jour, ouvert, ouverture, fermeture }) => ({ jour, ouvert, ouverture, fermeture })))
      onEnregistre(h)
    } catch (e) {
      setErreur(e.message)
      setEnvoi(false)
    }
  }

  return (
    <div className="manager-modal-backdrop is-sheet" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal manager-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="horaires-titre">
        <span className="sheet-poignee" aria-hidden="true" />
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Mon complexe</p>
            <h2 id="horaires-titre">Horaires d’ouverture</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <p className="ta-form-aide" style={{ marginTop: -10 }}>
          Les créneaux vont de l’ouverture à la fermeture. Une fermeture après minuit compte pour le jour d’ouverture.
          Un terrain peut avoir ses propres horaires (dans sa fiche).
        </p>

        {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
        {!lignes && !erreur && <p className="planning-vide">Chargement…</p>}
        {lignes && (
          <ul className="horaires-liste">
            {lignes.map((h) => (
              <li key={h.jour} className={h.ouvert ? '' : 'is-ferme'}>
                <label className="horaires-jour">
                  <input type="checkbox" checked={h.ouvert} onChange={(e) => maj(h.jour, 'ouvert', e.target.checked)} />
                  <strong>{NOMS[h.jour]}</strong>
                </label>
                {h.ouvert ? (
                  <span className="horaires-heures">
                    <input type="time" aria-label={`Ouverture ${NOMS[h.jour]}`} value={h.ouverture} onChange={(e) => maj(h.jour, 'ouverture', e.target.value)} />
                    <span aria-hidden="true">→</span>
                    <input type="time" aria-label={`Fermeture ${NOMS[h.jour]}`} value={h.fermeture} onChange={(e) => maj(h.jour, 'fermeture', e.target.value)} />
                    {h.fermeture <= h.ouverture && <small className="ta-form-aide">+1 j</small>}
                  </span>
                ) : <span className="horaires-ferme">Fermé</span>}
              </li>
            ))}
          </ul>
        )}

        <div className="manager-modal-actions fiche-actions">
          {lignes && (
            <button type="button" className="fiche-annuler horaires-partout" onClick={appliquerPartout}
              title="Recopie l’ouverture, la fermeture et « ouvert / fermé » du lundi sur les 7 jours">
              <i className="fa-solid fa-copy" aria-hidden="true" /> Mêmes horaires que le lundi pour tous les jours
            </button>
          )}
          <span className="fiche-actions-droite">
            <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="manager-button manager-button-primary" type="button" onClick={enregistrer} disabled={envoi || !lignes}>
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </span>
        </div>
      </section>
    </div>
  )
}
