import { useEffect, useState } from 'react'
import { apiGet } from '../../api/client.js'

// Donnees de l'Admin servies par l'API (journal d'audit).

const JOURS_AUDIT = 92 // periode maximale acceptee par GET /audit
const TAILLE_PAGE = 200 // taille de page maximale
const MAX_ENTREES = 1000 // au-dela : filtrer par periode ou exporter

function isoJour(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Journal d'audit des 92 derniers jours (le plus recent d'abord). */
export function useJournalAudit() {
  const [etat, setEtat] = useState({ entrees: [], chargement: true, erreur: null })
  useEffect(() => {
    let annule = false
    ;(async () => {
      const du = new Date()
      du.setDate(du.getDate() - (JOURS_AUDIT - 1))
      const entrees = []
      try {
        for (let page = 0; entrees.length < MAX_ENTREES; page += 1) {
          const r = await apiGet(`/audit?du=${isoJour(du)}&au=${isoJour(new Date())}&page=${page}&taille=${TAILLE_PAGE}`)
          entrees.push(...(r?.entrees || []))
          if (!r?.entrees?.length || entrees.length >= (r.total ?? 0)) break
        }
        if (!annule) setEtat({ entrees, chargement: false, erreur: null })
      } catch (err) {
        if (!annule) setEtat({ entrees, chargement: false, erreur: err.message })
      }
    })()
    return () => { annule = true }
  }, [])
  return etat
}
