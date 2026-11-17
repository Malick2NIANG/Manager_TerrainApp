import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api/client.js'
import { marque } from '../config/marque.js'
import { NomMarque, Initiales } from '../components/Marque.jsx'

// Panneau de presentation de l'ecran de connexion. Fonds : les vraies
// photos des terrains du complexe (catalogue public, lisible sans compte),
// donc propres a chaque installation ; a defaut, pelouse dessinee aux
// couleurs de la marque. Titres "maillot" comme l'App Client.
const DUREE = 6500
const PELOUSE = 'repeating-linear-gradient(90deg, rgb(255 255 255 / 4%) 0 60px, transparent 60px 120px)'
const FONDS_DESSINES = [
  `${PELOUSE}, linear-gradient(135deg, var(--marque) 0%, #0b2a1b 100%)`,
  `${PELOUSE}, linear-gradient(200deg, var(--marque) 0%, #08160f 100%)`,
  `${PELOUSE}, linear-gradient(160deg, #0b2a1b 0%, var(--marque) 100%)`,
]
const TEXTES = [
  {
    eyebrow: 'Le match commence ici',
    title: 'Chaque créneau compte.',
    description: 'Réservations en ligne et au comptoir, au même endroit, en temps réel.',
  },
  {
    eyebrow: 'Une équipe, un même planning',
    title: 'De l’accueil au terrain, sans attente.',
    description: 'Planning du jour, encaissement et contrôle des tickets à l’entrée.',
  },
  {
    eyebrow: `L’expérience ${marque.nom}`,
    title: 'Des terrains toujours bien remplis.',
    description: 'Annonces, photos et vidéos : vos terrains donnent envie de réserver.',
  },
]

const estVideo = (url) => /\.(mp4|webm)(?:[?#].*)?$/i.test(String(url || ''))

/** Photos des terrains (pas les videos), une par terrain d'abord, 3 au plus. */
export function photosDeFond(terrains) {
  const listes = (terrains || []).map((t) => (t.photos?.length ? t.photos : [t.photoUrl]).filter((u) => u && !estVideo(u)))
  const choisies = []
  for (let rang = 0; choisies.length < 3 && listes.some((l) => l[rang]); rang += 1) {
    for (const l of listes) if (l[rang] && !choisies.includes(l[rang]) && choisies.length < 3) choisies.push(l[rang])
  }
  return choisies
}

function LignesTerrain() {
  return (
    <svg className="auth-lignes" viewBox="0 0 600 400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
      preserveAspectRatio="xMidYMid slice">
      <rect x="20" y="20" width="560" height="360" rx="6" />
      <line x1="300" y1="20" x2="300" y2="380" />
      <circle cx="300" cy="200" r="62" />
      <circle cx="300" cy="200" r="4" fill="currentColor" />
      <rect x="20" y="110" width="90" height="180" />
      <rect x="490" y="110" width="90" height="180" />
    </svg>
  )
}

export default function AuthCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [photos, setPhotos] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let annule = false
    fetch(`${API_BASE_URL}/terrains`)
      .then((r) => (r.ok ? r.json() : []))
      .then((terrains) => {
        if (annule || !Array.isArray(terrains)) return
        setPhotos(photosDeFond(terrains))
        setStats({ terrains: terrains.length, sports: new Set(terrains.map((t) => t.sportId)).size })
      })
      .catch(() => {})
    return () => { annule = true }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveIndex((i) => (i + 1) % TEXTES.length), DUREE)
    return () => window.clearTimeout(timer)
  }, [activeIndex])

  const slide = TEXTES[activeIndex]
  const fond = (i) => (photos.length ? `url("${photos[i % photos.length]}")` : FONDS_DESSINES[i])

  return (
    <aside className="auth-carousel" aria-label={`Présentation ${marque.nom}`}>
      {TEXTES.map((item, index) => (
        <div className={`auth-slide-image ${index === activeIndex ? 'is-active' : ''}`} key={item.title}
          style={{ backgroundImage: fond(index) }} aria-hidden="true" />
      ))}
      <div className="auth-carousel-overlay" />
      <LignesTerrain />
      <div className="auth-carousel-content">
        <div className="auth-brand-mark" aria-label={marque.nom}>
          <Initiales className="auth-brand-monogramme" />
          <NomMarque className="auth-brand-nom" />
        </div>
        <div className="auth-slide-copy" key={slide.title}>
          {stats?.terrains > 0 && (
            <p className="auth-direct">
              <span aria-hidden="true" /> {stats.terrains} terrain{stats.terrains > 1 ? 's' : ''}
              {stats.sports > 1 ? ` · ${stats.sports} sports` : ''} · réservation en direct
            </p>
          )}
          <p className="auth-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
        </div>
        <div className="auth-carousel-controls">
          <div className="auth-carousel-dots" aria-label="Choisir une présentation">
            {TEXTES.map((item, index) => (
              <button aria-label={`Afficher la présentation ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined}
                className={index === activeIndex ? 'is-active' : index < activeIndex ? 'is-vu' : ''}
                key={`${item.title}-${index === activeIndex ? activeIndex : 'x'}`} onClick={() => setActiveIndex(index)} type="button">
                <span style={index === activeIndex ? { animationDuration: `${DUREE}ms` } : undefined} />
              </button>
            ))}
          </div>
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(TEXTES.length).padStart(2, '0')}</span>
        </div>
      </div>
    </aside>
  )
}
