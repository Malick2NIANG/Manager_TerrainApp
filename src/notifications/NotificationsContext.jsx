import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import useFluxPlanning from '../hooks/useFluxPlanning.js'

// Notifications de la cloche, alimentees par le flux temps reel du planning
// (GET /temps-reel/planning) :
//   GERANT, ACCUEIL : nouvelle reservation payee en ligne, reservation annulee ;
//   CONTROLEUR, ADMIN : rien (le controleur travaille depuis le scan).

const MAX = 50
const NotificationsContext = createContext(null)

const HEURE = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function quand(reservation) {
  return reservation?.debut ? HEURE.format(new Date(reservation.debut)) : ''
}

/** Notification a afficher pour cet evenement et ce role, ou null. */
export function notificationPour(role, { type, reservation } = {}) {
  if (!reservation || !['GERANT', 'ACCUEIL'].includes(role)) return null
  const base = { cle: `${reservation.id}-${reservation.statut}`, reservationId: reservation.id }
  if (type === 'RESERVATION_CONFIRMEE' && reservation.canal === 'APP' && reservation.statut === 'CONFIRMEE') {
    return { ...base, kind: 'reservation', title: `Nouvelle réservation ${reservation.reference}`, text: `${reservation.terrain} · ${quand(reservation)} · ${Number(reservation.montant).toLocaleString('fr-FR')} F CFA`, target: '/planning' }
  }
  if (reservation.statut === 'ANNULEE') {
    return { ...base, kind: 'annulee', title: `Réservation ${reservation.reference} annulée`, text: `${reservation.terrain} · ${quand(reservation)} : créneau libéré.`, target: '/planning' }
  }
  return null
}

// "À l'instant", "Il y a 5 min", "Il y a 2 h", "Hier", "Il y a 3 j".
export function tempsEcoule(iso, maintenant = Date.now()) {
  const min = Math.max(0, Math.floor((maintenant - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'À l’instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  const j = Math.floor(h / 24)
  return j === 1 ? 'Hier' : `Il y a ${j} j`
}

function lire(cle) {
  try {
    const brut = JSON.parse(localStorage.getItem(cle))
    return Array.isArray(brut) ? brut : []
  } catch {
    return []
  }
}

// Signal sonore court (deux notes) a l'arrivee d'une notification, sans
// fichier audio. Desactivable : localStorage terrainapp_manager_son = "0".
let contexteAudio = null
export function jouerSonNotification() {
  try {
    if (localStorage.getItem('terrainapp_manager_son') === '0') return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    contexteAudio = contexteAudio || new Ctx()
    const t = contexteAudio.currentTime
    ;[880, 1320].forEach((frequence, i) => {
      const osc = contexteAudio.createOscillator()
      const gain = contexteAudio.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequence
      gain.gain.setValueAtTime(0.0001, t + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.15)
      osc.connect(gain).connect(contexteAudio.destination)
      osc.start(t + i * 0.16)
      osc.stop(t + i * 0.16 + 0.16)
    })
  } catch {
    // audio indisponible (navigateur, autoplay bloque) : la cloche suffit
  }
}

export function NotificationsProvider({ children }) {
  const { role, username } = useAuth()
  const cleStockage = username ? `terrainapp_manager_notifications_${username}` : null
  const [notifications, setNotifications] = useState(() => (cleStockage ? lire(cleStockage) : []))
  const cleCourante = useRef(cleStockage)
  const listeRef = useRef(notifications)
  listeRef.current = notifications

  // Changement d'utilisateur (deconnexion / autre compte) : sa propre liste.
  useEffect(() => {
    cleCourante.current = cleStockage
    setNotifications(cleStockage ? lire(cleStockage) : [])
  }, [cleStockage])

  useEffect(() => {
    if (!cleCourante.current) return
    try { localStorage.setItem(cleCourante.current, JSON.stringify(notifications.slice(0, MAX))) } catch { /* stockage plein ou bloque */ }
  }, [notifications])

  useFluxPlanning((evenement) => {
    const n = notificationPour(role, evenement)
    if (!n) return
    // Doublon (meme reservation, meme statut, ex. evenement rattrape) : rien.
    if (listeRef.current.some((x) => x.cle === n.cle)) return
    const nouvelle = true
    listeRef.current = [{ cle: n.cle }, ...listeRef.current]
    setNotifications((liste) => {
      if (liste.some((x) => x.cle === n.cle)) return liste
      return [{ ...n, id: `${n.cle}-${Date.now()}`, createdAt: new Date().toISOString(), unread: true }, ...liste].slice(0, MAX)
    })
    // Pas de son pour les evenements rattrapes de plus de 10 minutes
    // (reconnexion apres une coupure).
    const recente = !evenement.reservation?.creeLe || Date.now() - new Date(evenement.reservation.creeLe).getTime() < 10 * 60_000
    if (nouvelle && recente) jouerSonNotification()
  }, { actif: Boolean(role) })

  const marquerLue = useCallback((id) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n))), [])
  const toutMarquerLu = useCallback(() => setNotifications((l) => l.map((n) => ({ ...n, unread: false }))), [])
  const supprimer = useCallback((id) => setNotifications((l) => l.filter((n) => n.id !== id)), [])

  const valeur = useMemo(() => ({ notifications, marquerLue, toutMarquerLu, supprimer }), [notifications, marquerLue, toutMarquerLu, supprimer])
  return <NotificationsContext.Provider value={valeur}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext) || { notifications: [], marquerLue: () => {}, toutMarquerLu: () => {}, supprimer: () => {} }
}
