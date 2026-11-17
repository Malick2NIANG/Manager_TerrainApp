import { apiEnvoyerFichier } from '../../api/client.js'
import { urlMediaSure } from '../../utils/urlMedia.js'
import { imageEnvoyee } from '../../hooks/useRessourceApi.js'

// Cycle d'une annonce, comme le backend (StatutAnnonce).
export const STATUTS = { BROUILLON: 'BROUILLON', ACTIF: 'ACTIF', ARCHIVE: 'ARCHIVE' }
export const STATUT_LABELS = { BROUILLON: 'Brouillon', ACTIF: 'Active', ARCHIVE: 'Archivée' }

export function countByStatut(items) {
  return items.reduce((acc, i) => ({ ...acc, [i.statut]: (acc[i.statut] || 0) + 1 }), { BROUILLON: 0, ACTIF: 0, ARCHIVE: 0 })
}

// Videos : MP4 ou WebM, 30 Mo et 60 s au plus (une annonce se regarde en
// quelques secondes, et le client la charge souvent en 4G).
export const VIDEO_TYPES = ['video/mp4', 'video/webm']
export const VIDEO_MAX_OCTETS = 30 * 1024 * 1024
export const VIDEO_MAX_SECONDES = 60

/** Raison du refus d'une video (taille, format), ou null si elle convient. */
export function refusVideo(fichier, duree = null) {
  if (!VIDEO_TYPES.includes(fichier.type)) return 'Format non pris en charge : choisissez une vidéo MP4 ou WebM.'
  if (fichier.size > VIDEO_MAX_OCTETS) return `Vidéo trop lourde (${Math.round(fichier.size / 1048576)} Mo) : 30 Mo maximum.`
  if (duree !== null && duree > VIDEO_MAX_SECONDES + 0.5) return `Vidéo trop longue (${Math.round(duree)} s) : 60 secondes maximum.`
  return null
}

/** Duree d'une video locale (blob:), lue dans ses metadonnees. */
export function dureeVideo(url) {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? v.duration : null)
    v.onerror = () => resolve(null)
    v.src = urlMediaSure(url)
  })
}

/** Adresse definitive du visuel d'une slide : envoye au serveur s'il n'existe que dans le navigateur. */
export async function mediaEnvoye(url, type) {
  if (type !== 'VIDEO') return imageEnvoyee(url)
  if (!url || !url.startsWith('blob:')) return url
  const fichier = await (await fetch(url)).blob()
  const extension = fichier.type === 'video/webm' ? 'webm' : 'mp4'
  const { url: definitive } = await apiEnvoyerFichier('/videos', 'fichier', fichier, `video.${extension}`)
  return definitive
}

/** Slides pretes pour l'API : visuels envoyes, champs du formulaire seulement. */
export async function slidesEnvoyees(data) {
  if (!Array.isArray(data?.slides)) return data
  const slides = []
  for (const { titre, message, mediaUrl, mediaType } of data.slides) {
    const type = mediaUrl ? mediaType || 'IMAGE' : 'IMAGE'
    slides.push({ titre, message, mediaUrl: (await mediaEnvoye(mediaUrl, type)) || null, mediaType: type })
  }
  return { ...data, slides }
}

// Videos choisies mais pas encore envoyees (adresse blob: sans extension).
const videosLocales = new Set()

export function marquerVideoLocale(url) {
  videosLocales.add(url)
}

/** Video deja enregistree (.mp4 / .webm) ou choisie dans ce navigateur. */
export function estVideo(url) {
  return videosLocales.has(url) || /\.(mp4|webm)(?:[?#].*)?$/i.test(String(url || ''))
}
