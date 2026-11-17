import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../../api/client.js'
import { dateCourte, decalerJour, formatFCFA, heure, jourISO } from '../../utils/dates.js'
import { MOYENS, MOYENS_COMPTOIR } from '../planning/statuts.jsx'
import { formaterSaisieLocale, normaliserTelephone } from '../planning/ComptoirModal.jsx'
import Volet from '../../components/Volet.jsx'
import { FREQUENCES, REGLEMENTS, libelleRegle, refusRemise } from './abonnements.js'

// Nouvel abonnement au comptoir. L'essentiel d'abord (terrain, premiere
// seance, frequence, nombre, client) ; l'apercu des dates montre les
// seances libres et celles qui seront sautees ; puis le reglement.
export default function AbonnementModal({ terrains, onFermer, onCree }) {
  const [terrainId, setTerrainId] = useState(terrains[0]?.id ?? '')
  const [jour, setJour] = useState(decalerJour(jourISO(), 1))
  const [creneaux, setCreneaux] = useState(null)
  const [debut, setDebut] = useState(null)
  const [frequence, setFrequence] = useState('HEBDOMADAIRE')
  const [nombre, setNombre] = useState(4)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [reglement, setReglement] = useState('AVANCE')
  const [moyen, setMoyen] = useState('especes')
  const [remise, setRemise] = useState('')
  const [apercu, setApercu] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Heures de la premiere seance : tous les creneaux du jour (meme pris :
  // c'est la regle qui compte, l'apercu dira quelles seances sautent).
  useEffect(() => {
    if (!terrainId) return undefined
    let actif = true
    setCreneaux(null)
    apiGet(`/disponibilites?date=${jour}&terrainId=${terrainId}`)
      .then((d) => {
        if (!actif) return
        const liste = (d[0]?.creneaux || []).filter((c) => c.etat !== 'PASSE')
        setCreneaux(liste)
        setDebut((cur) => {
          if (liste.some((c) => c.debut === cur)) return cur
          const memeHeure = cur && liste.find((c) => heure(c.debut) === heure(cur))
          return memeHeure ? memeHeure.debut : null
        })
      })
      .catch((e) => actif && setErreur(e.message))
    return () => { actif = false }
  }, [terrainId, jour])

  useEffect(() => {
    if (!terrainId || !debut || !nombre) {
      setApercu(null)
      return undefined
    }
    let actif = true
    const t = setTimeout(() => {
      apiPost('/abonnements/apercu', { terrainId: Number(terrainId), premiereSeance: debut, frequence, nombreSeances: Number(nombre) })
        .then((a) => actif && setApercu(a))
        .catch((e) => { if (actif) { setApercu(null); setErreur(e.message) } })
    }, 250)
    return () => { actif = false; clearTimeout(t) }
  }, [terrainId, debut, frequence, nombre])

  const max = FREQUENCES[frequence].max
  const total = apercu?.total ?? 0
  const net = Math.max(0, total - (Number(remise) || 0))
  const sautees = apercu ? apercu.seances.length - apercu.disponibles : 0
  const tel = normaliserTelephone(telephone)

  async function valider(e) {
    e.preventDefault()
    const probleme = !debut ? 'Choisissez l’heure de la première séance.'
      : !apercu ? 'Aperçu des séances en cours…'
        : apercu.disponibles === 0 ? 'Aucune séance libre : changez l’heure ou le jour.'
          : prenom.trim().length < 2 ? 'Indiquez le prénom du client.'
            : nom.trim().length < 2 ? 'Indiquez le nom du client.'
              : !tel ? 'Numéro à 9 chiffres (ex. 77 123 45 67).'
                : refusRemise(remise, total)
    if (probleme) {
      setErreur(probleme)
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const a = await apiPost('/abonnements', {
        terrainId: Number(terrainId), premiereSeance: debut, frequence, nombreSeances: Number(nombre),
        clientNom: `${prenom.trim()} ${nom.trim()}`, clientTelephone: tel, reglement,
        moyenPaiement: reglement === 'AVANCE' ? moyen : null, remise: Number(remise) || 0,
      })
      onCree(a)
    } catch (err) {
      setEnvoi(false)
      setErreur(err.message)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="abonnement-titre">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Abonnement</p>
            <h2 id="abonnement-titre">Nouvel abonnement</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className="ta-form" onSubmit={valider} noValidate>
          <div className="ta-form-ligne">
            <label>Terrain
              <select value={terrainId} onChange={(e) => setTerrainId(Number(e.target.value))}>
                {terrains.map((t) => <option key={t.id} value={t.id}>{t.nom} · {t.sport}</option>)}
              </select>
            </label>
            <label>Première séance
              <input type="date" value={jour} min={jourISO()} onChange={(e) => e.target.value && setJour(e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>Heure</legend>
            {creneaux === null ? <span className="ta-form-aide">Chargement des créneaux…</span>
              : creneaux.length === 0 ? <span className="ta-form-aide">Fermé ce jour-là.</span>
                : (
                  <div className="ta-creneaux-choix">
                    {creneaux.map((c) => (
                      <button key={c.debut} type="button" className={c.debut === debut ? 'is-actif' : ''} aria-pressed={c.debut === debut}
                        onClick={() => setDebut(c.debut)}>
                        {heure(c.debut)}<small>{formatFCFA(c.prix)}</small>
                      </button>
                    ))}
                  </div>
                )}
          </fieldset>

          <div className="ta-form-ligne">
            <fieldset>
              <legend>Fréquence</legend>
              <div className="ta-choix" role="radiogroup" aria-label="Fréquence">
                {Object.entries(FREQUENCES).map(([code, f]) => (
                  <button key={code} type="button" role="radio" aria-checked={frequence === code} className={frequence === code ? 'is-actif' : ''}
                    onClick={() => { setFrequence(code); setNombre((n) => Math.min(n, f.max)) }}>
                    {f.libelle}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>Nombre de séances
              <input type="number" min={2} max={max} value={nombre}
                onChange={(e) => setNombre(Math.max(0, Math.min(max, Number(e.target.value) || 0)))} />
              <span className="ta-choix ab-presets">
                {FREQUENCES[frequence].presets.map((n) => (
                  <button key={n} type="button" className={Number(nombre) === n ? 'is-actif' : ''} onClick={() => setNombre(n)}>{n}</button>
                ))}
              </span>
            </label>
          </div>

          {debut && apercu && (
            <div className="ab-apercu">
              <p className="ab-apercu-regle">
                <i className="fa-solid fa-repeat" aria-hidden="true" /> {libelleRegle(frequence, debut)}
              </p>
              <p>
                <strong>{apercu.disponibles} séance{apercu.disponibles > 1 ? 's' : ''} réservée{apercu.disponibles > 1 ? 's' : ''}</strong>
                {sautees > 0 && <span className="ab-sautees"> · {sautees} sautée{sautees > 1 ? 's' : ''} (déjà prise{sautees > 1 ? 's' : ''} ou fermée{sautees > 1 ? 's' : ''})</span>}
              </p>
              <Volet key={`${debut}-${frequence}-${nombre}`} titre="Voir les dates" icone="fa-calendar-days" ouvertParDefaut={sautees > 0}
                resume={`Du ${dateCourte(apercu.seances[0].debut)} au ${dateCourte(apercu.seances[apercu.seances.length - 1].debut)}`}>
                <ul className="ab-dates">
                  {apercu.seances.map((s) => (
                    <li key={s.debut} className={s.disponible ? '' : 'is-sautee'}>
                      <i className={`fa-solid ${s.disponible ? 'fa-check' : 'fa-xmark'}`} aria-hidden="true" />
                      <span>{dateCourte(s.debut)} · {heure(s.debut)}</span>
                      <small>{s.disponible ? formatFCFA(s.prix) : s.motif}</small>
                    </li>
                  ))}
                </ul>
              </Volet>
            </div>
          )}

          <div className="ta-form-ligne">
            <label>Prénom du client
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={40} autoComplete="off" />
            </label>
            <label>Nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={39} autoComplete="off" />
            </label>
          </div>
          <label>Téléphone
            <span className="ta-tel">
              <input value="+221" readOnly tabIndex={-1} aria-label="Indicatif du Sénégal" className="ta-tel-indicatif" />
              <input value={telephone} onChange={(e) => setTelephone(formaterSaisieLocale(e.target.value))} inputMode="numeric"
                placeholder="77 123 45 67" maxLength={12} autoComplete="off" aria-label="Numéro" />
            </span>
          </label>

          <fieldset>
            <legend>Règlement</legend>
            <div className="ta-choix" role="radiogroup" aria-label="Règlement">
              {Object.entries(REGLEMENTS).map(([code, libelle]) => (
                <button key={code} type="button" role="radio" aria-checked={reglement === code} className={reglement === code ? 'is-actif' : ''}
                  onClick={() => setReglement(code)}>
                  {libelle}
                </button>
              ))}
            </div>
            {reglement === 'AVANCE' ? (
              <div className="ta-choix ab-moyens" role="radiogroup" aria-label="Moyen de paiement">
                {MOYENS_COMPTOIR.map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={moyen === m} className={moyen === m ? 'is-actif' : ''} onClick={() => setMoyen(m)}>
                    {MOYENS[m]}
                  </button>
                ))}
              </div>
            ) : (
              <span className="ta-form-aide">Chaque séance est encaissée le jour J, depuis le planning ou cette page.</span>
            )}
          </fieldset>

          <label className="ab-remise">Remise <span className="ta-form-aide">facultatif, sur le total</span>
            <input type="number" min={0} step={500} value={remise} onChange={(e) => setRemise(e.target.value)} placeholder="0" />
          </label>

          {apercu && apercu.disponibles > 0 && (
            <div className="ta-total">
              <span>{reglement === 'AVANCE' ? 'À encaisser maintenant' : `Total sur ${apercu.disponibles} séances`}</span>
              <strong>{formatFCFA(net)}</strong>
            </div>
          )}
          {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}

          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={envoi}>
              {envoi ? 'Création…' : reglement === 'AVANCE' ? 'Encaisser et créer' : 'Créer l’abonnement'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
