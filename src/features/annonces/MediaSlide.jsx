// Visuel d'une slide d'annonce : photo, ou video lue en boucle sans le son
// (lecture automatique autorisee par les navigateurs uniquement en muet).
export default function MediaSlide({ url, type, className = '', controles = false }) {
  if (!url) return null
  if (type === 'VIDEO') {
    return (
      <video key={url} src={url} className={className} autoPlay muted loop playsInline preload="metadata" controls={controles}
        aria-label="Vidéo de l’annonce" />
    )
  }
  return <img src={url} alt="" className={className} />
}
