import { useRef, useState } from 'react'
import ImageCropModal from '../gerant/ImageCropModal.jsx'
import { dureeVideo, estVideo, marquerVideoLocale, refusVideo } from '../annonces/annonces.js'

export const MAX_PHOTOS = 10

/** Deplace l'element i d'un cran (sens = -1 ou +1). */
export function deplacer(liste, i, sens) {
  const j = i + sens
  if (j < 0 || j >= liste.length) return liste
  const copie = [...liste]
  ;[copie[i], copie[j]] = [copie[j], copie[i]]
  return copie
}

// Galerie de l'annonce : photos et videos, le premier media est la
// couverture (cartes de l'App Client). Plusieurs fichiers a la fois : les
// photos sont recadrees l'une apres l'autre, les videos verifiees (MP4 ou
// WebM, 60 s et 30 Mo au plus) puis ajoutees telles quelles.
export default function GaleriePhotos({ photos, onChange }) {
  const [file, setFile] = useState([])
  const [refus, setRefus] = useState(null)
  const entree = useRef(null)
  const place = MAX_PHOTOS - photos.length

  async function choisir(e) {
    const fichiers = [...(e.target.files || [])].slice(0, place)
    e.target.value = ''
    setRefus(null)
    const videos = []
    for (const f of fichiers.filter((x) => x.type.startsWith('video/'))) {
      const url = URL.createObjectURL(f)
      const raison = refusVideo(f, await dureeVideo(url))
      if (raison) {
        URL.revokeObjectURL(url)
        setRefus(`${f.name} : ${raison}`)
      } else {
        marquerVideoLocale(url)
        videos.push(url)
      }
    }
    if (videos.length) onChange([...photos, ...videos].slice(0, MAX_PHOTOS))
    setFile(fichiers.filter((x) => x.type.startsWith('image/')).map((f) => URL.createObjectURL(f)))
  }

  function suivant(url) {
    URL.revokeObjectURL(file[0])
    if (url) onChange([...photos, url].slice(0, MAX_PHOTOS))
    setFile((f) => f.slice(1))
  }

  return (
    <fieldset>
      <legend>Photos et vidéos <span className="ta-form-aide">{photos.length}/{MAX_PHOTOS} · le premier média est la couverture</span></legend>
      <p className="ta-form-aide">Des photos nettes du terrain, des vestiaires et des abords, et une courte vidéo (60 s max), rassurent les clients avant de réserver.</p>
      <ul className="ta-galerie">
        {photos.map((url, i) => (
          <li key={url} className="ta-galerie-photo">
            {estVideo(url)
              ? <video src={url} muted playsInline preload="metadata" aria-label={`Vidéo ${i + 1}`} />
              : <img src={url} alt={`Photo ${i + 1}`} />}
            {estVideo(url) && <span className="ta-annonce-video-badge"><i className="fa-solid fa-play" aria-hidden="true" /> Vidéo</span>}
            {i === 0 && <span className="ta-galerie-couverture">Couverture</span>}
            <div className="ta-galerie-actions">
              <button type="button" aria-label={`Avancer le média ${i + 1}`} disabled={i === 0}
                onClick={() => onChange(deplacer(photos, i, -1))}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>
              <button type="button" aria-label={`Reculer le média ${i + 1}`} disabled={i === photos.length - 1}
                onClick={() => onChange(deplacer(photos, i, 1))}>
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
              <button type="button" aria-label={`Retirer le média ${i + 1}`}
                onClick={() => onChange(photos.filter((_, k) => k !== i))}>
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
        {place > 0 && (
          <li>
            <button type="button" className="ta-galerie-ajout" onClick={() => entree.current?.click()}>
              <i className="fa-solid fa-camera" aria-hidden="true" />
              <span>{photos.length ? 'Ajouter' : 'Photos ou vidéos'}</span>
            </button>
          </li>
        )}
      </ul>
      {refus && <p className="ta-form-erreur" role="alert">{refus}</p>}
      <input ref={entree} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden onChange={choisir} />
      {file.length > 0 && (
        <ImageCropModal key={file[0]} imageSrc={file[0]} aspect={4 / 3}
          eyebrow={file.length > 1 ? `Cadre identique à l'app · encore ${file.length - 1} après celle-ci` : "Cadre identique à l'app joueur"}
          onCancel={() => suivant(null)}
          onConfirm={(url) => suivant(url)} />
      )}
    </fieldset>
  )
}
