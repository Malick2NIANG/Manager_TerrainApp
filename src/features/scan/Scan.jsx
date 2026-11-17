import { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import { apiPost } from '../../api/client.js'
import { dateCourte, plage } from '../../utils/dates.js'
import '../../styles/terrains.css'
import EnTetePage from '../../components/EnTetePage.jsx'
import { AIDES } from '../../components/aidesPages.js'

// Controle a l'entree : le joueur presente le QR de son ticket (App Client),
// le serveur rend un verdict explique. Saisie de la reference (ex. R7K3P9Q)
// en secours si la camera est indisponible ou le QR illisible.
const ZONE_CAMERA_ID = 'scan-ticket-camera'
const PAUSE_APRES_SCAN_MS = 3000
const CLE_CAMERA = 'terrainapp_scan_camera'

/** Choix retenu sur ce poste : camera allumee ou eteinte (eteinte par defaut). */
function cameraRetenue() {
  try { return localStorage.getItem(CLE_CAMERA) === 'allumee' } catch { return false }
}

export const VERDICTS = {
  VALIDE: { titre: 'Entrée autorisée', icone: 'fa-circle-check', ton: 'is-valide' },
  DEJA_UTILISE: { titre: 'Ticket déjà utilisé', icone: 'fa-circle-xmark', ton: 'is-refuse' },
  TROP_TOT: { titre: 'Trop tôt', icone: 'fa-clock', ton: 'is-refuse' },
  EXPIRE: { titre: 'Créneau terminé', icone: 'fa-circle-xmark', ton: 'is-refuse' },
  NON_PAYE: { titre: 'Réservation non payée', icone: 'fa-circle-xmark', ton: 'is-refuse' },
  ANNULE: { titre: 'Réservation annulée', icone: 'fa-ban', ton: 'is-refuse' },
  INCONNU: { titre: 'Ticket inconnu', icone: 'fa-circle-question', ton: 'is-refuse' },
}

function arreterCamera(instance) {
  if (!instance) return Promise.resolve()
  try {
    const enCours = typeof instance.isScanning === 'boolean' ? instance.isScanning : true
    return Promise.resolve(enCours ? instance.stop() : null).catch(() => {}).then(() => {
      try { instance.clear?.() } catch { /* deja nettoye */ }
    })
  } catch {
    return Promise.resolve()
  }
}

export default function Scan() {
  const [allumee, setAllumee] = useState(cameraRetenue)
  const [camera, setCamera] = useState('demarrage') // demarrage | active | indisponible
  const [resultat, setResultat] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [saisie, setSaisie] = useState('')
  const instanceRef = useRef(null)
  const occupeRef = useRef(false)

  const verifier = useCallback(async (code) => {
    if (occupeRef.current || !code?.trim()) return
    occupeRef.current = true
    setEnvoi(true)
    try { instanceRef.current?.pause?.(true) } catch { /* camera arretee */ }
    try {
      setResultat(await apiPost('/tickets/scan', { code: code.trim() }))
    } catch (e) {
      setResultat({ verdict: 'ERREUR', message: e.message })
    } finally {
      setEnvoi(false)
      setTimeout(() => {
        occupeRef.current = false
        try { instanceRef.current?.resume?.() } catch { /* camera arretee */ }
      }, PAUSE_APRES_SCAN_MS)
    }
  }, [])

  const basculer = () => setAllumee((a) => {
    try { localStorage.setItem(CLE_CAMERA, a ? 'eteinte' : 'allumee') } catch { /* facultatif */ }
    return !a
  })

  // Camera eteinte : plus de flux video (batterie, vie privee) ; la saisie de la reference reste possible.
  useEffect(() => {
    if (!allumee) return undefined
    let annule = false
    setCamera('demarrage')
    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        if (annule) return undefined
        const instance = new Html5Qrcode(ZONE_CAMERA_ID)
        instanceRef.current = instance
        return instance
          .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } }, (valeur) => verifier(valeur), () => {})
          .then(() => (annule ? arreterCamera(instance) : setCamera('active')))
      })
      .catch(() => !annule && setCamera('indisponible'))
    return () => {
      annule = true
      arreterCamera(instanceRef.current)
      instanceRef.current = null
    }
  }, [verifier, allumee])

  const v = resultat ? VERDICTS[resultat.verdict] || { titre: 'Erreur', icone: 'fa-triangle-exclamation', ton: 'is-refuse' } : null
  const r = resultat?.reservation

  return (
    <Layout>
      <EnTetePage groupe="planning"
        aide={AIDES.scan} />

      <div className="scan-page">
        <div className="scan-panneau">
          <div className="scan-camera-tete">
            <span><i className="fa-solid fa-camera" aria-hidden="true" /> Caméra</span>
            <button type="button" role="switch" aria-checked={allumee} className={`ta-switch ${allumee ? 'is-on' : ''}`} onClick={basculer}
              aria-label={allumee ? 'Éteindre la caméra' : 'Allumer la caméra'}>
              <span className="ta-switch-rail"><span className="ta-switch-bouton" /></span>
              <span className="ta-switch-texte">{allumee ? 'Allumée' : 'Éteinte'}</span>
            </button>
          </div>
          {!allumee ? (
            <button type="button" className="scan-camera-eteinte" onClick={basculer}>
              <i className="fa-solid fa-video-slash" aria-hidden="true" />
              <strong>Caméra éteinte</strong>
              <span>Touchez pour l’allumer, ou saisissez la référence du ticket.</span>
            </button>
          ) : camera === 'indisponible' ? (
            <p className="scan-livraison-camera-indispo">
              <i className="fa-solid fa-camera" aria-hidden="true" /> Caméra indisponible : saisissez la référence du ticket.
            </p>
          ) : (
            <div id={ZONE_CAMERA_ID} className="scan-camera" aria-label="Caméra" />
          )}
          {allumee && camera === 'demarrage' && <p className="ta-form-aide" role="status">Démarrage de la caméra…</p>}
          <form className="scan-manuel" onSubmit={(e) => { e.preventDefault(); verifier(saisie); setSaisie('') }}>
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Référence, ex. R7K3P9Q" aria-label="Référence du ticket" autoComplete="off" />
            <button className="manager-button manager-button-primary" type="submit" disabled={!saisie.trim() || envoi}>Vérifier</button>
          </form>
        </div>

        <div className="scan-panneau" aria-live="polite">
          {!resultat ? (
            <div className="scan-verdict is-attente">
              <i className="fa-solid fa-qrcode" aria-hidden="true" />
              <h2>{envoi ? 'Vérification…' : 'En attente d’un ticket'}</h2>
            </div>
          ) : (
            <>
              <div className={`scan-verdict ${v.ton}`}>
                <button type="button" className="scan-verdict-fermer" aria-label="Effacer le résultat" title="Effacer"
                  onClick={() => setResultat(null)}>
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
                <i className={`fa-solid ${v.icone}`} aria-hidden="true" />
                <h2>{v.titre}</h2>
                {/* Le message n'apparait que s'il dit plus que le titre. */}
                {resultat.message && resultat.message.replace(/\.$/, '') !== v.titre && <p>{resultat.message}</p>}
              </div>
              {r && (
                <dl className="ta-fiche" style={{ marginTop: 16 }}>
                  <dt>Référence</dt><dd>{r.reference}</dd>
                  <dt>Client</dt><dd>{r.clientNom}</dd>
                  <dt>Terrain</dt><dd>{r.terrain} · {r.sport}</dd>
                  <dt>Créneau</dt><dd style={{ textTransform: 'capitalize' }}>{dateCourte(r.debut)} · {plage(r.debut, r.fin)}</dd>
                </dl>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
