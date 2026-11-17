import { useEffect, useMemo, useRef, useState } from 'react'
import { apiGet, apiPostAvecEntetes } from '../../api/client.js'
import { decalerJour, formatFCFA, heure, jourISO } from '../../utils/dates.js'
import { MOYENS, MOYENS_COMPTOIR } from './statuts.jsx'

function nouvelleCle() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cle-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** "77 123 45 67" -> "+221771234567", null si invalide (meme regle que le serveur et l'App Client). */
export function normaliserTelephone(saisie) {
  let chiffres = String(saisie || '').replace(/[^\d]/g, '')
  if (chiffres.startsWith('00221')) chiffres = chiffres.slice(5)
  else if (chiffres.startsWith('221') && chiffres.length === 12) chiffres = chiffres.slice(3)
  return /^(7[015678]|33)\d{7}$/.test(chiffres) ? `+221${chiffres}` : null
}

/** Saisie du numero local mise en forme : "771234567" -> "77 123 45 67" (l'indicatif +221 est fixe). */
export function formaterSaisieLocale(saisie) {
  let c = String(saisie || '').replace(/\D/g, '')
  if (c.startsWith('221') && c.length > 9) c = c.slice(3)
  c = c.slice(0, 9)
  return [c.slice(0, 2), c.slice(2, 5), c.slice(5, 7), c.slice(7, 9)].filter(Boolean).join(' ')
}

// Reservation saisie au comptoir : encaissee sur place (especes ou paiement
// mobile verifie par l'accueil), confirmee aussitot.
export default function ComptoirModal({ jour: jourInitial, terrains, initial, onFermer, onCree }) {
  const [terrainId, setTerrainId] = useState(initial.terrainId ?? terrains[0]?.terrainId ?? '')
  const [jour, setJour] = useState(initial.debut ? initial.debut.slice(0, 10) : jourInitial)
  const [creneaux, setCreneaux] = useState(null)
  const [debut, setDebut] = useState(initial.debut || null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [moyen, setMoyen] = useState('especes')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const cle = useRef(nouvelleCle())

  useEffect(() => {
    if (!terrainId) return undefined
    let actif = true
    setCreneaux(null)
    apiGet(`/disponibilites?date=${jour}&terrainId=${terrainId}`)
      .then((d) => {
        if (!actif) return
        const libres = (d[0]?.creneaux || []).filter((c) => c.etat === 'LIBRE')
        setCreneaux(libres)
        setDebut((cur) => (libres.some((c) => c.debut === cur) ? cur : null))
      })
      .catch((e) => actif && setErreur(e.message))
    return () => { actif = false }
  }, [terrainId, jour])

  const creneau = useMemo(() => creneaux?.find((c) => c.debut === debut) || null, [creneaux, debut])
  const tel = normaliserTelephone(telephone)
  async function valider(e) {
    e.preventDefault()
    const probleme = !creneau ? 'Choisissez un créneau.'
      : prenom.trim().length < 2 ? 'Indiquez le prénom du client.'
        : nom.trim().length < 2 ? 'Indiquez le nom du client.'
          : !tel ? 'Numéro à 9 chiffres (ex. 77 123 45 67).' : null
    if (probleme) {
      setErreur(probleme)
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await apiPostAvecEntetes('/reservations/comptoir', {
        terrainId: Number(terrainId), debut: creneau.debut, clientNom: `${prenom.trim()} ${nom.trim()}`, clientTelephone: tel,
        moyenPaiement: moyen,
      }, { 'Idempotency-Key': cle.current })
      onCree(r.reservation)
    } catch (err) {
      setEnvoi(false)
      if (err.status) cle.current = nouvelleCle()
      setErreur(err.message)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="comptoir-titre">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Comptoir</p>
            <h2 id="comptoir-titre">Nouvelle réservation</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className="ta-form" onSubmit={valider} noValidate>
          <div className="ta-form-ligne">
            <label>Terrain
              <select value={terrainId} onChange={(e) => setTerrainId(Number(e.target.value))}>
                {terrains.map((t) => <option key={t.terrainId} value={t.terrainId}>{t.terrain} · {t.sport}</option>)}
              </select>
            </label>
            <label>Jour
              <input type="date" value={jour} min={jourISO()} max={decalerJour(jourISO(), 60)} onChange={(e) => e.target.value && setJour(e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>Créneau</legend>
            {creneaux === null ? <span className="ta-form-aide">Chargement des créneaux…</span>
              : creneaux.length === 0 ? <span className="ta-form-aide">Aucun créneau libre ce jour-là.</span>
                : (
                  <div className="ta-creneaux-choix">
                    {creneaux.map((c) => (
                      <button key={c.debut} type="button" className={c.debut === debut ? 'is-actif' : ''} aria-pressed={c.debut === debut} onClick={() => setDebut(c.debut)}>
                        {heure(c.debut)}<small>{formatFCFA(c.prix)}</small>
                      </button>
                    ))}
                  </div>
                )}
          </fieldset>

          <div className="ta-form-ligne">
            <label>Prénom
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={40} autoComplete="off" />
            </label>
            <label>Nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={39} autoComplete="off" />
            </label>
          </div>
          <div className="ta-form-ligne">
            <label>Téléphone
              <span className="ta-tel">
                <input value="+221" readOnly tabIndex={-1} aria-label="Indicatif du Sénégal" className="ta-tel-indicatif" />
                <input value={telephone} onChange={(e) => setTelephone(formaterSaisieLocale(e.target.value))} inputMode="numeric"
                  placeholder="77 123 45 67" maxLength={12} autoComplete="off" aria-label="Numéro" />
              </span>
              <span className="ta-form-aide">Le client retrouvera sa réservation et son ticket dans l’app avec ce numéro (code par SMS).</span>
            </label>
          </div>

          <fieldset>
            <legend>Encaissement</legend>
            <div className="ta-choix" role="radiogroup" aria-label="Moyen de paiement">
              {MOYENS_COMPTOIR.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={moyen === m} className={moyen === m ? 'is-actif' : ''} onClick={() => setMoyen(m)}>
                  {MOYENS[m]}
                </button>
              ))}
            </div>
          </fieldset>

          {creneau && (
            <div className="ta-total"><span>À encaisser</span><strong>{formatFCFA(creneau.prix)}</strong></div>
          )}
          {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}

          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Encaisser et réserver'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
