import { useCallback, useEffect, useMemo, useState } from 'react'
import { positionCadrage } from '../gerant/cadrage.js'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../api/client.js'
import { formatFCFA } from '../../utils/dates.js'
import TerrainFormModal from './TerrainFormModal.jsx'
import '../../styles/terrains.css'
import { estVideo } from '../annonces/annonces.js'
import EnTetePage from '../../components/EnTetePage.jsx'
import useChangementsPublics from '../../hooks/useChangementsPublics.js'
import { AIDES } from '../../components/aidesPages.js'
import Volet from '../../components/Volet.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import HorairesModal, { resumeOuverture } from './HorairesModal.jsx'
import { LIBELLES_STATUT, STATUTS_TERRAIN, statutTerrain } from './statutTerrain.js'
import StatusBadge from '../../components/crud/StatusBadge.jsx'

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
  const [horaires, setHoraires] = useState(null)
  const [horairesOuverts, setHorairesOuverts] = useState(false)
  const [filtre, setFiltre] = useState(null) // null : le 1er statut qui a des terrains
  const [changement, setChangement] = useState(null) // { terrain, statut } a confirmer
  const [sportEdite, setSportEdite] = useState(null) // { id, nom } en cours de renommage

  const notifier = (type, message) => setToast({ id: Date.now(), type, message })

  const charger = useCallback(async () => {
    try {
      const [s, t, h] = await Promise.all([apiGet('/sports'), apiGet('/terrains'), apiGet('/horaires')])
      setSports(s)
      setTerrains(t)
      setHoraires(h)
      setErreur(null)
    } catch (e) {
      setErreur(e.message)
    }
  }, [])

  useEffect(() => { charger() }, [charger])
  // Un autre poste publie, depublie ou archive : la liste suit en direct.
  useChangementsPublics(['terrains'], charger)

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

  async function renommerSport(e) {
    e.preventDefault()
    const s = sports.find((x) => x.id === sportEdite.id)
    const nom = sportEdite.nom.trim()
    if (!nom || nom === s.nom) { setSportEdite(null); return }
    try {
      await apiPut(`/sports/${s.id}`, { nom, ordre: s.ordre, actif: s.actif })
      setSportEdite(null)
      notifier('success', `Sport renommé en « ${nom} ».`)
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

  const comptes = useMemo(() => Object.fromEntries(STATUTS_TERRAIN.map((d) => [d.key, (terrains || []).filter((t) => statutTerrain(t) === d.key).length])), [terrains])
  const statut = filtre || STATUTS_TERRAIN.find((d) => comptes[d.key] > 0)?.key || 'ACTIF'
  const affiches = (terrains || []).filter((t) => statutTerrain(t) === statut)

  const MESSAGES = {
    ACTIF: (t) => `« ${t.nom} » publié : réservable dans l’app.`,
    BROUILLON: (t) => `« ${t.nom} » dépublié : vous pouvez le modifier, puis le republier.`,
    ARCHIVE: (t) => `« ${t.nom} » archivé.`,
  }

  async function changerStatut(t, statut) {
    setChangement(null)
    try {
      await apiPatch(`/terrains/${t.id}/statut`, { statut })
      notifier('success', statut === 'BROUILLON' && statutTerrain(t) === 'ARCHIVE' ? `« ${t.nom} » restauré en brouillon.` : MESSAGES[statut](t))
      charger()
    } catch (e) {
      notifier('error', e.message)
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
      <EnTetePage groupe="complexe"
        resume={terrains ? `${terrains.length} terrain${terrains.length > 1 ? 's' : ''} · ${sports.length} sport${sports.length > 1 ? 's' : ''}${horaires ? ` · horaires : ${resumeOuverture(horaires).replace(/^./, (c) => c.toLowerCase())}` : ''}` : null}
        aide={AIDES.complexe}
        actions={(
          <>
            <button className="manager-button manager-button-quiet ta-bouton-horaires" type="button" onClick={() => setHorairesOuverts(true)}>
              <i className="fa-solid fa-clock" aria-hidden="true" /> Horaires
            </button>
            {sports.length > 0 && (
              <button className="manager-button manager-button-primary" type="button" onClick={() => setEdition({})}>
                <i className="fa-solid fa-plus" aria-hidden="true" /> Nouveau terrain
              </button>
            )}
          </>
        )} />

      {terrains?.length > 0 && (
        <StatFilterCards
          items={STATUTS_TERRAIN.map((d) => ({ ...d, value: comptes[d.key] }))}
          selected={statut}
          onSelect={setFiltre}
          ariaLabel="Filtrer les terrains par statut"
        />
      )}
      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {terrains === null && !erreur && <p className="planning-vide">Chargement…</p>}
      {terrains?.length === 0 && <p className="planning-vide">{sports.length ? 'Aucun terrain pour le moment.' : 'Ajoutez d’abord un sport.'}</p>}

      {terrains?.length > 0 && affiches.length === 0 && (
        <p className="planning-vide">{STATUTS_TERRAIN.find((d) => d.key === statut)?.vide}</p>
      )}
      {affiches.length > 0 && (
        <div className="ta-liste">
          {affiches.map((t) => (
            <article className={`ta-carte ${t.actif ? '' : 'ta-inactif'}`} key={t.id}>
              <div className="ta-carte-photo" style={t.photoUrl && !estVideo(t.photoUrl) ? { backgroundImage: `url("${t.photoUrl}")`, backgroundPosition: positionCadrage(t.photoUrl) } : undefined}>
                {t.photoUrl && estVideo(t.photoUrl) && <video src={t.photoUrl} muted playsInline preload="metadata" aria-label="Vidéo de couverture" />}
                {!t.photoUrl && <i className="fa-solid fa-futbol" aria-hidden="true" />}
                <span className="ta-carte-statut"><StatusBadge statut={statutTerrain(t)} label={LIBELLES_STATUT[statutTerrain(t)]} /></span>
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
                  {t.plages.length > 0 && <span title={t.plages.map((p) => `${p.libelle} ${formatFCFA(p.tarifHeure)}`).join(' · ')}>
                    {` · ${t.plages.length} tarif${t.plages.length > 1 ? 's' : ''} particulier${t.plages.length > 1 ? 's' : ''}`}</span>}</p>
                {statutTerrain(t) !== 'ARCHIVE' && !(t.photos?.length) && <p className="ta-a-completer"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Ajoutez une photo : elle rassure les clients</p>}
              </div>
              {/* Actions selon le statut (comme les produits de l'app resto). */}
              <div className="ta-carte-actions crud-card-actions">
                {statutTerrain(t) === 'BROUILLON' && (
                  <button className="crud-action" type="button" onClick={() => setEdition({ terrain: t })}>
                    <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                  </button>
                )}
                {statutTerrain(t) === 'BROUILLON' && (
                  <button className="crud-action is-publish" type="button" onClick={() => changerStatut(t, 'ACTIF')}>
                    <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                  </button>
                )}
                {statutTerrain(t) === 'ACTIF' && (
                  <button className="crud-action is-accent-orange" type="button" onClick={() => setChangement({ terrain: t, statut: 'BROUILLON' })}>
                    <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                  </button>
                )}
                {statutTerrain(t) === 'BROUILLON' && (
                  <button className="crud-action is-accent-red" type="button" onClick={() => setChangement({ terrain: t, statut: 'ARCHIVE' })}>
                    <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                  </button>
                )}
                {statutTerrain(t) === 'ARCHIVE' && (
                  <button className="crud-action is-archive" type="button" onClick={() => setChangement({ terrain: t, statut: 'BROUILLON' })}>
                    <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Restaurer
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <Volet key={sports.length ? 'sports' : 'aucun-sport'} titre="Sports proposés" icone="fa-medal" ouvertParDefaut={!sports.length}
          resume={sports.length ? sports.map((s) => s.nom).join(' · ') : 'Ajoutez un sport pour créer vos terrains'}>
          <div className="ta-sports">
            {sports.map((s) => (sportEdite?.id === s.id ? (
              <form key={s.id} className="ta-sport is-edition" onSubmit={renommerSport}>
                <input value={sportEdite.nom} onChange={(e) => setSportEdite({ ...sportEdite, nom: e.target.value })} maxLength={60}
                  aria-label={`Nouveau nom de ${s.nom}`} autoFocus onKeyDown={(e) => e.key === 'Escape' && setSportEdite(null)} />
                <button type="submit" aria-label="Enregistrer le nom" title="Enregistrer"><i className="fa-solid fa-check" aria-hidden="true" /></button>
                <button type="button" aria-label="Annuler" title="Annuler" onClick={() => setSportEdite(null)}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
              </form>
            ) : (
              <span className={`ta-sport ${s.actif ? '' : 'ta-inactif'}`} key={s.id}>
                {s.nom}
                <button type="button" title="Renommer" aria-label={`Renommer ${s.nom}`} onClick={() => setSportEdite({ id: s.id, nom: s.nom })}>
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
                <button type="button" title={s.actif ? 'Masquer ce sport' : 'Réafficher ce sport'} aria-label={s.actif ? `Masquer ${s.nom}` : `Réafficher ${s.nom}`} onClick={() => basculerSport(s)}>
                  <i className={`fa-solid ${s.actif ? 'fa-eye' : 'fa-eye-slash'}`} aria-hidden="true" />
                </button>
                <button type="button" title="Supprimer" aria-label={`Supprimer ${s.nom}`} onClick={() => setSuppression(s)}>
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </span>
            )))}
            <form className="ta-form" style={{ flexDirection: 'row', gap: 8 }} onSubmit={ajouterSport}>
              <input value={nouveauSport} onChange={(e) => setNouveauSport(e.target.value)} placeholder="Nouveau sport (ex. Padel)" aria-label="Nouveau sport" maxLength={60} />
              <button className="manager-button manager-button-quiet" type="submit" disabled={!nouveauSport.trim()}>Ajouter</button>
            </form>
          </div>

        </Volet>
      </div>

      {changement && (() => {
        const t = changement.terrain
        const textes = {
          BROUILLON: statutTerrain(t) === 'ARCHIVE'
            ? { titre: `Restaurer « ${t.nom} » ?`, message: 'Il revient en brouillon : vérifiez-le puis publiez-le pour le rouvrir à la réservation.', bouton: 'Restaurer', ton: 'info', icone: 'fa-clock-rotate-left' }
            : { titre: `Dépublier « ${t.nom} » ?`, message: 'Il passe en brouillon : plus réservable dans l’app ni au comptoir, les réservations déjà prises sont conservées. Vous pourrez alors le modifier, puis le republier.', bouton: 'Dépublier', ton: 'warning', icone: 'fa-eye-slash' },
          ARCHIVE: { titre: `Archiver « ${t.nom} » ?`, message: 'Il disparaît de l’app et du planning (restaurable plus tard). Impossible s’il a des réservations à venir.', bouton: 'Archiver', ton: 'danger', icone: 'fa-box-archive' },
        }[changement.statut]
        return (
          <ConfirmModal title={textes.titre} message={textes.message} confirmLabel={textes.bouton} cancelLabel="Retour"
            tone={textes.ton} icon={textes.icone} onConfirm={() => changerStatut(t, changement.statut)} onCancel={() => setChangement(null)} />
        )
      })()}
      {horairesOuverts && (
        <HorairesModal onFermer={() => setHorairesOuverts(false)}
          onEnregistre={(h) => { setHoraires(h); setHorairesOuverts(false); notifier('success', 'Horaires enregistrés : les créneaux sont mis à jour.') }} />
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
