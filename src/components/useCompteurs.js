import { useEffect, useState } from 'react'
import { apiGet } from '../api/client.js'
import { decalerJour, jourISO } from '../utils/dates.js'

// Chiffre affiche sur la carte de chaque page d'un groupe. Garde en memoire
// (pas de clignotement d'une page a l'autre) et recharge a chaque visite.
const memoire = {}

const ACTIVES = ['EN_ATTENTE_PAIEMENT', 'CONFIRMEE', 'HONOREE']

const CALCULS = {
  '/planning': async () => (await apiGet(`/planning?date=${jourISO()}`)).filter((r) => ACTIVES.includes(r.statut)).length,
  '/abonnements': async () => (await apiGet('/abonnements')).filter((a) => a.statut === 'ACTIF').length,
  '/blocages': async () => {
    const aujourdhui = jourISO()
    const liste = await apiGet(`/blocages?debut=${aujourdhui}T00:00:00Z&fin=${decalerJour(aujourdhui, 90)}T00:00:00Z`)
    return liste.filter((b) => new Date(b.fin) > new Date()).length
  },
  '/scan': async () => (await apiGet(`/planning?date=${jourISO()}`)).filter((r) => r.statut === 'HONOREE').length,
  '/terrains': async () => (await apiGet('/terrains')).length,
  '/horaires': async () => (await apiGet('/horaires')).filter((h) => h.ouvert).length,
  '/annonces': async () => (await apiGet('/annonces')).length,
  '/avis': async () => (await apiGet('/avis')).length,
}

/** { chemin: nombre } pour les onglets donnes ; '–' si indisponible. */
export default function useCompteurs(onglets) {
  const chemins = onglets.map((o) => o.path).join('|')
  const [valeurs, setValeurs] = useState(() => Object.fromEntries(onglets.map((o) => [o.path, memoire[o.path]])))

  useEffect(() => {
    let actif = true
    chemins.split('|').filter(Boolean).forEach((chemin) => {
      const calcul = CALCULS[chemin]
      if (!calcul) return
      calcul()
        .then((n) => { memoire[chemin] = n; if (actif) setValeurs((v) => ({ ...v, [chemin]: n })) })
        .catch(() => { if (actif) setValeurs((v) => ({ ...v, [chemin]: v[chemin] ?? '–' })) })
    })
    return () => { actif = false }
  }, [chemins])

  return valeurs
}
