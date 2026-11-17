import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImageUrl, getResizedImageUrl } from './cropImage.js'
import { avecCadrage } from './cadrage.js'

export default function ImageCropModal({ imageSrc, onCancel, onConfirm, aspect = 4 / 3, eyebrow = 'Photo du produit', title = 'Recadrer la photo', cadrageSeul = false }) {
  // cadrageSeul : la photo est gardee entiere, seul le cadre affiche sur les
  // cartes est choisi (pas de zoom), note en #c=x,y sur son adresse.
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [zone, setZone] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCropComplete = useCallback((area, pixels) => {
    setZone(area)
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleValider() {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    setError('')
    try {
      if (cadrageSeul) {
        // Position en % du cadre dans la photo, comme object-position l'attend.
        const pct = (debut, taille) => (taille >= 99.9 ? 50 : (debut / (100 - taille)) * 100)
        const url = await getResizedImageUrl(imageSrc)
        onConfirm(avecCadrage(url, pct(zone.x, zone.width), pct(zone.y, zone.height)))
        return
      }
      const url = await getCroppedImageUrl(imageSrc, croppedAreaPixels)
      onConfirm(url)
    } catch {
      setError('Le recadrage a échoué. Réessayez ou choisissez une autre image.')
      setIsSaving(false)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <section className="manager-modal manager-modal-wide crud-crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{eyebrow}</p>
            <h2 id="crop-modal-title">{title}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onCancel}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="crud-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {cadrageSeul ? (
          <p className="crud-crop-aide">
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> Déplacez la photo pour choisir ce qui s'affiche sur les cartes. La photo entière reste visible quand le joueur clique dessus.
          </p>
        ) : (
        <div className="crud-crop-zoom">
          <i className="fa-solid fa-magnifying-glass-minus" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
          <i className="fa-solid fa-magnifying-glass-plus" aria-hidden="true" />
        </div>
        )}

        {error && <p className="crud-crop-error">{error}</p>}

        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={onCancel} disabled={isSaving}>
            Annuler
          </button>
          <button className="manager-button manager-button-primary" type="button" onClick={handleValider} disabled={isSaving || !croppedAreaPixels}>
            {isSaving ? 'Préparation…' : cadrageSeul ? 'Valider le cadrage' : 'Valider le recadrage'}
          </button>
        </div>
      </section>
    </div>
  )
}
