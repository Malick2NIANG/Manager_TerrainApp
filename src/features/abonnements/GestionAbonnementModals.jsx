import { useState } from 'react'
import { apiPut, apiPost } from '../../api/client.js'
import { dateCourte, formatFCFA } from '../../utils/dates.js'
import { MOYENS_COMPTOIR } from '../planning/statuts.jsx'
import { formaterSaisieLocale, normaliserTelephone } from '../planning/ComptoirModal.jsx'
import MoyensPaiement from '../caisse/MoyensPaiement.jsx'
import { FREQUENCES, libelleRegle } from './abonnements.js'

function Cadre({ titre, sousTitre, envoi, onFermer, children, actions }) {
  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="ab-gestion-titre">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{sousTitre}</p>
            <h2 id="ab-gestion-titre">{titre}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onFermer} disabled={envoi}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        {children}
        <div className="manager-modal-actions">{actions}</div>
      </section>
    </div>
  )
}

/** Corriger le nom ou le numero du client (seances a venir comprises). */
export function ClientAbonnementModal({ abonnement: a, onFermer, onFait }) {
  const [nom, setNom] = useState(a.clientNom)
  const [telephone, setTelephone] = useState(formaterSaisieLocale(a.clientTelephone))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  async function valider() {
    const tel = normaliserTelephone(telephone)
    if (nom.trim().length < 2) return setErreur('Indiquez le nom du client.')
    if (!tel) return setErreur('Numéro à 9 chiffres (ex. 77 123 45 67).')
    setEnvoi(true)
    try {
      onFait(await apiPut(`/abonnements/${a.id}/client`, { clientNom: nom.trim(), clientTelephone: tel }))
    } catch (e) {
      setErreur(e.message)
      setEnvoi(false)
    }
  }
  return (
    <Cadre titre="Modifier le client" sousTitre={`Abonnement · ${a.terrain}`} envoi={envoi} onFermer={onFermer}
      actions={<>
        <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
        <button className="manager-button manager-button-primary" type="button" onClick={valider} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
      </>}>
      <div className="ta-form">
        <label>Nom du client
          <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} />
        </label>
        <label>Téléphone
          <span className="ta-tel">
            <input value="+221" readOnly tabIndex={-1} aria-label="Indicatif du Sénégal" className="ta-tel-indicatif" />
            <input value={telephone} onChange={(e) => setTelephone(formaterSaisieLocale(e.target.value))} inputMode="numeric" aria-label="Numéro" />
          </span>
          <span className="ta-form-aide">Appliqué aux séances à venir ; les séances passées gardent leur historique.</span>
        </label>
        {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      </div>
    </Cadre>
  )
}

/** Ajouter des seances a la suite (meme regle), ou de nouvelles dates. */
export function ProlongationModal({ abonnement: a, onFermer, onFait }) {
  const personnalise = a.frequence === 'PERSONNALISEE'
  const [nombre, setNombre] = useState(4)
  const [dates, setDates] = useState([])
  const [dateAjout, setDateAjout] = useState('')
  const [moyen, setMoyen] = useState('especes')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const derniere = a.seances[a.seances.length - 1]
  async function valider() {
    if (personnalise && !dates.length) return setErreur('Ajoutez au moins une date.')
    setEnvoi(true)
    try {
      onFait(await apiPost(`/abonnements/${a.id}/prolongation`, {
        nombreSeances: Number(nombre), dates: personnalise ? dates : null,
        moyenPaiement: a.reglement === 'AVANCE' ? moyen : null,
      }))
    } catch (e) {
      setErreur(e.message)
      setEnvoi(false)
    }
  }
  return (
    <Cadre titre="Prolonger l’abonnement" sousTitre={`${a.clientNom} · ${libelleRegle(a.frequence, a.premiereSeance, a.jours, a.seances.length)}`}
      envoi={envoi} onFermer={onFermer}
      actions={<>
        <button className="manager-button manager-button-quiet" type="button" onClick={onFermer} disabled={envoi}>Annuler</button>
        <button className="manager-button manager-button-primary" type="button" onClick={valider} disabled={envoi}>
          {envoi ? 'Ajout…' : a.reglement === 'AVANCE' ? 'Encaisser et ajouter' : 'Ajouter les séances'}
        </button>
      </>}>
      <div className="ta-form">
        {derniere && <p className="ta-form-aide">Dernière séance : {dateCourte(derniere.debut)}. Les nouvelles séances suivent la même règle ; celles déjà prises ou fermées sont sautées.</p>}
        {personnalise ? (
          <fieldset>
            <legend>Nouvelles dates</legend>
            <div className="ab-ajout-date">
              <input type="date" value={dateAjout} onChange={(e) => setDateAjout(e.target.value)} aria-label="Date à ajouter" />
              <button type="button" className="manager-button manager-button-quiet" disabled={!dateAjout || dates.includes(dateAjout)}
                onClick={() => { setDates((d) => [...d, dateAjout].sort()); setDateAjout('') }}>
                <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter
              </button>
            </div>
            <div className="ab-dates-choisies">
              {dates.map((d) => (
                <span key={d} className="ab-date-choisie">{dateCourte(`${d}T12:00:00Z`)}
                  <button type="button" aria-label={`Retirer le ${d}`} onClick={() => setDates((x) => x.filter((y) => y !== d))}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                </span>
              ))}
            </div>
          </fieldset>
        ) : (
          <label>Séances à ajouter
            <input type="number" min={1} max={FREQUENCES[a.frequence]?.max || 52} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <span className="ta-choix ab-presets">
              {[2, 4, 8, 12].map((n) => (
                <button key={n} type="button" className={Number(nombre) === n ? 'is-actif' : ''} onClick={() => setNombre(n)}>{n}</button>
              ))}
            </span>
          </label>
        )}
        {a.reglement === 'AVANCE' ? (
          <fieldset>
            <legend>Payé d’avance : moyen de paiement</legend>
            <MoyensPaiement valeur={moyen} onChange={setMoyen} moyens={MOYENS_COMPTOIR} />
          </fieldset>
        ) : <p className="ta-form-aide">Payable à chaque séance, comme le reste de l’abonnement.</p>}
        {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      </div>
    </Cadre>
  )
}

/** Peut-on supprimer (cree par erreur : rien de paye ni de passe) ? */
export function supprimable(a, maintenant = new Date()) {
  return a.statut === 'ACTIF' && a.seances.every((s) => s.statut === 'ANNULEE' || (!s.payeeLe && new Date(s.debut) > maintenant))
}

export const resumeMontant = (a) => formatFCFA(a.montantTotal)
