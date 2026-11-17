import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import EnTetePage from '../../components/EnTetePage.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import { AIDES } from '../../components/aidesPages.js'
import { apiGet, apiPost } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { marque } from '../../config/marque.js'
import { dateCourte, formatFCFA, plage } from '../../utils/dates.js'
import { BadgeStatut, MOYENS, telephoneLisible } from '../planning/statuts.jsx'
import { LogoMoyen } from '../caisse/MoyensPaiement.jsx'
import { reimprimerRecu } from '../caisse/caisse.js'
import { PERIODES, bornesPeriode, exporterHistorique, requeteHistorique } from './historique.js'
import '../../styles/terrains.css'

// Historique des reservations (gerant) : une periode (date du match), des
// filtres, la recette encaissee et la liste paginee par le serveur.
const CARTES = [
  { key: '', label: 'Toutes', icon: 'fa-list', accent: '#5b5b5f', accentBg: '#ececea' },
  { key: 'HONOREE', label: 'Entrées validées', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'CONFIRMEE', label: 'Confirmées', icon: 'fa-calendar-check', accent: '#2f6fed', accentBg: '#e8eefc' },
  { key: 'ANNULEE', label: 'Annulées', icon: 'fa-ban', accent: '#b3261e', accentBg: '#fbe4e2' },
  { key: 'EXPIREE', label: 'Expirées', icon: 'fa-hourglass-end', accent: '#9c6b0c', accentBg: '#f6ecd9' },
]
const LIGNES = [10, 25, 50]

export default function Historique() {
  const [periode, setPeriode] = useState('30j')
  const [bornes, setBornes] = useState(() => bornesPeriode('30j'))
  const [terrainId, setTerrainId] = useState('')
  const [moyen, setMoyen] = useState('')
  const [statut, setStatut] = useState('')
  const [saisie, setSaisie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const [taille, setTaille] = useState(10)
  const [donnees, setDonnees] = useState(null)
  const [terrains, setTerrains] = useState([])
  const [erreur, setErreur] = useState(null)
  const [export_, setExport] = useState(false)
  const [toast, setToast] = useState(null)

  const filtres = useMemo(() => ({ ...bornes, terrainId, moyen, statut, recherche }), [bornes, terrainId, moyen, statut, recherche])
  const notifier = (type, message) => setToast({ id: Date.now(), type, message })
  const { username } = useAuth() || {}

  useEffect(() => { apiGet('/terrains').then(setTerrains).catch(() => setTerrains([])) }, [])

  // Recherche : envoyee 350 ms apres la derniere frappe.
  useEffect(() => {
    const t = setTimeout(() => { setRecherche(saisie); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [saisie])

  useEffect(() => {
    let annule = false
    apiGet(requeteHistorique({ ...filtres, page: page - 1, taille }))
      .then((d) => { if (!annule) { setDonnees(d); setErreur(null) } })
      .catch((e) => { if (!annule) setErreur(e.message) })
    return () => { annule = true }
  }, [filtres, page, taille])

  function filtrer(setter) {
    return (valeur) => { setter(valeur); setPage(1) }
  }

  function choisirPeriode(cle) {
    setPeriode(cle)
    if (cle !== 'perso') setBornes(bornesPeriode(cle))
    setPage(1)
  }

  async function exporter() {
    setExport(true)
    try {
      const tout = await apiGet(requeteHistorique({ ...filtres, page: 0, taille: 5000 }))
      const date = (iso) => iso.split('-').reverse().join('/')
      await exporterHistorique({
        reservations: tout.elements,
        etablissement: marque.etablissement || marque.nom,
        nomFichier: `historique-reservations_${filtres.du}_${filtres.au}.xlsx`,
        resume: {
          periode: `du ${date(filtres.du)} au ${date(filtres.au)}`,
          terrain: terrains.find((t) => String(t.id) === String(terrainId))?.nom || 'Tous',
          statut: CARTES.find((c) => c.key === statut)?.label || 'Toutes',
          moyen: MOYENS[moyen] || 'Tous',
          recherche: recherche.trim() || '—',
        },
      })
      if (tout.total > tout.elements.length) notifier('warning', `Export limité aux ${tout.elements.length} premières réservations : réduisez la période.`)
    } catch (e) {
      notifier('error', e.message)
    } finally {
      setExport(false)
    }
  }

  const parStatut = donnees?.parStatut || {}
  const totalPeriode = Object.values(parStatut).reduce((a, b) => a + b, 0)
  const pages = donnees ? Math.max(1, Math.ceil(donnees.total / taille)) : 1
  const moyensEncaisses = Object.entries(donnees?.encaisseParMoyen || {}).sort((a, b) => b[1] - a[1])

  return (
    <Layout>
      <EnTetePage titre="Historique"
        resume={donnees ? `Du ${dateCourte(`${donnees.du}T12:00:00Z`)} au ${dateCourte(`${donnees.au}T12:00:00Z`)} · ${totalPeriode} réservation${totalPeriode > 1 ? 's' : ''}` : null}
        aide={AIDES.historique}
        actions={(
          <button className="manager-button manager-button-primary" type="button" onClick={exporter} disabled={export_ || !donnees?.total}>
            <i className={`fa-solid ${export_ ? 'fa-spinner fa-spin' : 'fa-file-excel'}`} aria-hidden="true" /> {export_ ? 'Export…' : 'Exporter en Excel'}
          </button>
        )} />

      <div className="hist-periodes" role="group" aria-label="Période">
        {PERIODES.map((p) => (
          <button key={p.cle} type="button" className={`hist-periode ${periode === p.cle ? 'is-active' : ''}`}
            aria-pressed={periode === p.cle} onClick={() => choisirPeriode(p.cle)}>{p.libelle}</button>
        ))}
        {periode === 'perso' && (
          <span className="hist-dates">
            <label>Du <input type="date" value={bornes.du} max={bornes.au} onChange={(e) => e.target.value && filtrer(setBornes)({ ...bornes, du: e.target.value })} /></label>
            <label>au <input type="date" value={bornes.au} min={bornes.du} onChange={(e) => e.target.value && filtrer(setBornes)({ ...bornes, au: e.target.value })} /></label>
          </span>
        )}
      </div>

      <StatFilterCards className="hist-cartes"
        items={CARTES.map((c) => ({ ...c, value: c.key ? parStatut[c.key] ?? 0 : totalPeriode }))}
        selected={statut} onSelect={filtrer(setStatut)} ariaLabel="Filtrer par statut" />

      <section className="hist-recette" aria-label="Recette encaissée">
        <div>
          <p className="manager-eyebrow">Encaissé sur la période</p>
          <strong>{formatFCFA(donnees?.encaisse || 0)}</strong>
          <small>{donnees?.nombreEncaisses || 0} réservation{donnees?.nombreEncaisses > 1 ? 's' : ''} payée{donnees?.nombreEncaisses > 1 ? 's' : ''} (annulations exclues)</small>
        </div>
        {moyensEncaisses.length > 0 && (
          <ul className="hist-moyens">
            {moyensEncaisses.map(([m, somme]) => (
              <li key={m}><LogoMoyen moyen={m} /><span>{MOYENS[m] || m}</span><strong>{formatFCFA(somme)}</strong></li>
            ))}
          </ul>
        )}
      </section>

      <div className="ta-toolbar hist-filtres">
        <div className="crud-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input type="search" placeholder="Client, téléphone ou référence…" value={saisie} onChange={(e) => setSaisie(e.target.value)} aria-label="Rechercher" />
        </div>
        <select className="ta-select" value={terrainId} onChange={(e) => filtrer(setTerrainId)(e.target.value)} aria-label="Terrain">
          <option value="">Tous les terrains</option>
          {terrains.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
        <select className="ta-select" value={moyen} onChange={(e) => filtrer(setMoyen)(e.target.value)} aria-label="Moyen de paiement">
          <option value="">Tous les paiements</option>
          {Object.entries(MOYENS).map(([code, libelle]) => <option key={code} value={code}>{libelle}</option>)}
        </select>
      </div>

      {erreur && <p className="ta-form-erreur" role="alert">{erreur}</p>}
      {!donnees && !erreur && <p className="planning-vide">Chargement…</p>}
      {donnees && donnees.total === 0 && <p className="planning-vide">Aucune réservation pour ces critères.</p>}

      {donnees?.total > 0 && (
        <div className="ta-table-wrap">
          <table className="ta-table hist-table">
            <thead>
              <tr><th>Match</th><th>Terrain</th><th>Client</th><th>Montant</th><th>Paiement</th><th>Statut</th><th /></tr>
            </thead>
            <tbody>
              {donnees.elements.map((r) => (
                <tr key={r.id} className={r.statut === 'ANNULEE' || r.statut === 'EXPIREE' ? 'is-annulee' : ''}>
                  <td data-label="Match">
                    <strong style={{ textTransform: 'capitalize' }}>{dateCourte(r.debut)}</strong>
                    <small>{plage(r.debut, r.fin)} · {r.reference}</small>
                  </td>
                  <td data-label="Terrain">{r.terrain}<small>{r.sport}</small></td>
                  <td data-label="Client">{r.clientNom}<small>{telephoneLisible(r.clientTelephone)}{r.abonnementId ? ' · abonnement' : ''}</small></td>
                  <td data-label="Montant"><strong>{formatFCFA(r.montant)}</strong></td>
                  <td data-label="Paiement">
                    {r.payeeLe
                      ? <span className="hist-paiement"><LogoMoyen moyen={r.moyenPaiement} /> {MOYENS[r.moyenPaiement] || r.moyenPaiement}</span>
                      : <span className="ta-form-aide">{r.statut === 'ANNULEE' || r.statut === 'EXPIREE' ? '—' : 'À encaisser'}</span>}
                    <small>{r.canal === 'APP' ? 'Réservée dans l’app' : 'Au comptoir'}</small>
                  </td>
                  <td data-label="Statut">
                    <BadgeStatut statut={r.statut} />
                    {r.motifAnnulation && <small title={r.motifAnnulation}>{r.motifAnnulation}</small>}
                  </td>
                  <td className="hist-actions">
                    {r.payeeLe && (r.statut === 'CONFIRMEE' || r.statut === 'HONOREE') && (
                      <button type="button" className="ta-sport-action" title="Réimprimer le reçu" aria-label={`Réimprimer le reçu ${r.reference}`}
                        onClick={() => reimprimerRecu(r.id, { etablissement: marque.etablissement || marque.nom, moyens: MOYENS, caissier: username }, apiPost)
                          .catch((e) => notifier('error', e.message))}>
                        <i className="fa-solid fa-print" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {donnees?.total > LIGNES[0] && (
        <Pagination page={Math.min(page, pages)} pageCount={pages} rowsPerPage={taille} totalItems={donnees.total}
          onPageChange={setPage} onRowsPerPageChange={(n) => { setTaille(n); setPage(1) }} rowsOptions={LIGNES} />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
