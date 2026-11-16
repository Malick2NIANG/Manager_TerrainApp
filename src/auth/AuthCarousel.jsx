import { useEffect, useState } from 'react'
import { fontFamily } from '../theme.js'
import { marque } from '../config/marque.js'
import { NomMarque } from '../components/Marque.jsx'

// Fonds dessines aux couleurs de la marque (bandes de pelouse), sans photo :
// le meme ecran convient a tous les complexes et tous les sports.
const PELOUSE = 'repeating-linear-gradient(90deg, rgb(255 255 255 / 4%) 0 60px, transparent 60px 120px)'
const slides = [
  {
    fond: `${PELOUSE}, linear-gradient(135deg, var(--marque) 0%, #0b2a1b 100%)`,
    eyebrow: 'Le match commence ici',
    title: 'Chaque créneau compte.',
    description: 'Réservations en ligne et au comptoir, au même endroit, en temps réel.',
  },
  {
    fond: `${PELOUSE}, linear-gradient(200deg, var(--marque) 0%, #08160f 100%)`,
    eyebrow: 'Une équipe, un même planning',
    title: 'De l’accueil au terrain, sans attente.',
    description: 'Planning du jour, encaissement et contrôle des tickets à l’entrée.',
  },
  {
    fond: `${PELOUSE}, linear-gradient(160deg, #0b2a1b 0%, var(--marque) 100%)`,
    eyebrow: `L’expérience ${marque.nom}`,
    title: 'Des terrains toujours bien remplis.',
    description: 'Un espace simple pour chaque rôle, pensé pour les soirées qui vont vite.',
  },
]

export default function AuthCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [])

  const slide = slides[activeIndex]

  return (
    <aside className="auth-carousel" aria-label={`Présentation ${marque.nom}`}>
      {slides.map((item, index) => (
        <div
          className={`auth-slide-image ${index === activeIndex ? 'is-active' : ''}`}
          key={item.title}
          style={{ backgroundImage: item.fond }}
          aria-hidden={index !== activeIndex}
        />
      ))}
      <div className="auth-carousel-overlay" />
      <div className="auth-carousel-content" style={{ fontFamily }}>
        <div className="auth-brand-mark" aria-label={marque.nom}>
          <NomMarque className="auth-brand-nom" />
        </div>
        <div className="auth-slide-copy" key={slide.title}>
          <p className="auth-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
        </div>
        <div className="auth-carousel-controls">
          <div className="auth-carousel-dots" aria-label="Sélectionner une image">
            {slides.map((item, index) => (
              <button
                aria-label={`Afficher la présentation ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={index === activeIndex ? 'is-active' : ''}
                key={item.title}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
          <span>01 / 03</span>
        </div>
      </div>
    </aside>
  )
}