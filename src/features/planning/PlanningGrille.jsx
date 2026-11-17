import { useEffect, useRef } from 'react'
import { formatFCFA, heure, jourISO } from '../../utils/dates.js'
import { STATUTS, reservationDuCreneau } from './statuts.jsx'
import { aEncaisser } from '../abonnements/abonnements.js'
import { MINUTE_PX, bornes, correspond, heuresAxe, minutesDepuis, position } from './grille.js'

// Planning du jour comme un agenda : une colonne par terrain, les heures en
// lignes. Une reservation = un bloc plein (nom du client) ; un creneau libre
// = un bloc pointille cliquable (« + ») ; une fermeture = un bloc hachure.
// La ligne rouge marque l'heure actuelle. Defilement horizontal sur mobile,
// heures et noms des terrains toujours visibles.
export default function PlanningGrille({ jour, dispos, reservations, peutReserver, onReserver, onOuvrir, recherche = '', enTete = true }) {
  const zone = useRef(null)
  const axe = bornes(jour, dispos)
  const estAujourdhui = jour === jourISO()
  const maintenant = estAujourdhui ? minutesDepuis(jour, new Date()) : null

  // A l'ouverture : l'heure actuelle (aujourd'hui) ou la premiere reservation.
  useEffect(() => {
    if (!zone.current || !axe) return
    const premiere = reservations.filter((r) => r.statut !== 'ANNULEE' && r.statut !== 'EXPIREE')
      .map((r) => minutesDepuis(jour, r.debut)).sort((a, b) => a - b)[0]
    const cible = maintenant ?? premiere ?? axe.debut
    zone.current.scrollTop = Math.max(0, (cible - axe.debut - 60) * MINUTE_PX)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jour, Boolean(axe)])

  // Recherche : la premiere reservation trouvee est amenee a l'ecran.
  const actif = recherche.trim() !== ''
  useEffect(() => {
    if (!actif || !zone.current) return
    zone.current.querySelector('.pg-bloc.is-trouve')?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [recherche, actif])

  if (!axe) return <p className="planning-vide">Le complexe est fermé ce jour-là.</p>

  const hauteur = (axe.fin - axe.debut) * MINUTE_PX
  const heures = heuresAxe(axe)

  return (
    <div className={`pg ${actif ? 'is-recherche' : ''}`} ref={zone} style={{ '--pg-colonnes': dispos.length }}>
      {enTete && (
      <div className="pg-tete">
        <div className="pg-coin" />
        {dispos.map((t) => {
          const prises = t.creneaux.filter((c) => reservationDuCreneau(reservations, t.terrainId, c.debut, c.fin)).length
          return (
            <div key={t.terrainId} className="pg-terrain">
              <strong>{t.terrain}</strong>
              <small>{t.sport} · {prises} / {t.creneaux.length}</small>
            </div>
          )
        })}
      </div>

      )}

      <div className="pg-corps" style={{ height: hauteur }}>
        <div className="pg-heures" aria-hidden="true">
          {heures.map((h, i) => <span key={h + i} style={{ top: i * 60 * MINUTE_PX }}>{h}</span>)}
        </div>
        {dispos.map((t) => (
          <div key={t.terrainId} className="pg-colonne" aria-label={t.terrain}>
            {heures.map((h, i) => <span key={h + i} className="pg-ligne" style={{ top: i * 60 * MINUTE_PX }} />)}
            {t.creneaux.length === 0 && <span className="pg-ferme">Fermé</span>}
            {t.creneaux.map((c) => {
              const r = reservationDuCreneau(reservations, t.terrainId, c.debut, c.fin)
              const brut = position(jour, axe, c.debut, c.fin)
              const pos = { top: brut.top + 1, height: brut.height - 3 } // petit espace entre deux blocs
              const court = pos.height < 40
              if (r) {
                const s = STATUTS[r.statut] || {}
                return (
                  <button key={c.debut} type="button" className={`pg-bloc is-reserve ${s.classe || ''} ${actif && correspond(r, recherche) ? 'is-trouve' : ''}`} style={pos}
                    onClick={() => onOuvrir(r)} title={`${r.clientNom} · ${heure(c.debut)}–${heure(c.fin)} · ${s.libelle || r.statut}`}>
                    <strong>{r.clientNom}</strong>
                    {!court && (
                      <small>
                        {heure(c.debut)}–{heure(c.fin)}
                        {r.abonnementId && <i className="fa-solid fa-repeat" aria-label="Abonnement" />}
                        {aEncaisser(r) && <em>À encaisser</em>}
                      </small>
                    )}
                  </button>
                )
              }
              if (c.etat === 'BLOQUE') {
                return <div key={c.debut} className="pg-bloc is-bloque" style={pos}><small>Fermé</small></div>
              }
              if (c.etat === 'PASSE') return null
              if (!peutReserver) {
                return <div key={c.debut} className="pg-bloc is-libre" style={pos}><span className="pg-plus">{heure(c.debut)}</span></div>
              }
              return (
                <button key={c.debut} type="button" className="pg-bloc is-libre" style={pos}
                  onClick={() => onReserver({ terrainId: t.terrainId, debut: c.debut })}
                  aria-label={`Réserver ${t.terrain} à ${heure(c.debut)}, ${formatFCFA(c.prix)}`}>
                  <span className="pg-plus"><i className="fa-solid fa-plus" aria-hidden="true" /> {heure(c.debut)}</span>
                  {!court && <small>{formatFCFA(c.prix)}</small>}
                </button>
              )
            })}
          </div>
        ))}
        {maintenant !== null && maintenant >= axe.debut && maintenant <= axe.fin && (
          <div className="pg-maintenant" style={{ top: (maintenant - axe.debut) * MINUTE_PX }}>
            <span>{heure(new Date())}</span>
          </div>
        )}
      </div>
    </div>
  )
}
