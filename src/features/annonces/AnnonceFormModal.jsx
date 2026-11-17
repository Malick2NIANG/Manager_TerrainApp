import { useRef, useState } from 'react'
import ImageCropModal from '../gerant/ImageCropModal.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import AideFormulaire from '../../components/crud/AideFormulaire.jsx'
import MediaSlide from './MediaSlide.jsx'
import { dureeVideo, refusVideo } from './annonces.js'

let nextTemporarySlideId = 1

function createEmptySlide() {
  return { id: `slide-temp-${nextTemporarySlideId++}`, titre: '', message: '', mediaUrl: '', mediaType: 'IMAGE' }
}

export default function AnnonceFormModal({ annonce, onSave, onClose }) {
  const isEdit = Boolean(annonce)
  const [titre, setTitre] = useState(annonce?.titre || '')
  const [slides, setSlides] = useState(() => {
    if (annonce?.slides?.length) {
      return annonce.slides.map((slide) => ({ ...slide, message: slide.message || '', mediaUrl: slide.mediaUrl || '', mediaType: slide.mediaType || 'IMAGE' }))
    }
    return [createEmptySlide()]
  })
  const [dragOverSlideId, setDragOverSlideId] = useState(null)
  const [cropSource, setCropSource] = useState(null)
  const [cropTargetId, setCropTargetId] = useState(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [erreursMedia, setErreursMedia] = useState({})
  const fileInputRefs = useRef({})
  const initialValues = useRef({
    titre: annonce?.titre || '',
    slides: slides.map((slide) => ({ ...slide })),
  })

  const isDirty =
    titre !== initialValues.current.titre ||
    JSON.stringify(slides) !== JSON.stringify(initialValues.current.slides)

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  // Photo : recadree avant envoi. Video : verifiee (format, 30 Mo, 60 s)
  // puis gardee telle quelle ; envoyee au serveur a l'enregistrement.
  async function applyFile(file, slideId) {
    if (!file) return
    setErreursMedia((e) => ({ ...e, [slideId]: null }))
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      const refus = refusVideo(file, await dureeVideo(url))
      if (refus) {
        URL.revokeObjectURL(url)
        setErreursMedia((e) => ({ ...e, [slideId]: refus }))
        return
      }
      const avant = slides.find((sl) => sl.id === slideId)?.mediaUrl
      if (avant?.startsWith('blob:')) URL.revokeObjectURL(avant)
      setSlides((current) => current.map((sl) => (sl.id === slideId ? { ...sl, mediaUrl: url, mediaType: 'VIDEO' } : sl)))
      return
    }
    if (!file.type.startsWith('image/')) {
      setErreursMedia((e) => ({ ...e, [slideId]: 'Choisissez une photo ou une vidéo.' }))
      return
    }
    setCropSource(URL.createObjectURL(file))
    setCropTargetId(slideId)
  }

  function handleInputChange(e, slideId) {
    applyFile(e.target.files?.[0], slideId)
    e.target.value = ''
  }

  function handleDrop(e, slideId) {
    e.preventDefault()
    setDragOverSlideId(null)
    applyFile(e.dataTransfer.files?.[0], slideId)
  }

  function updateSlide(slideId, field, value) {
    setSlides((current) => current.map((slide) => (
      slide.id === slideId ? { ...slide, [field]: value } : slide
    )))
  }

  function handleRemoveImage(e, slide) {
    e.stopPropagation()
    if (slide.mediaUrl.startsWith('blob:')) URL.revokeObjectURL(slide.mediaUrl)
    setSlides((current) => current.map((sl) => (sl.id === slide.id ? { ...sl, mediaUrl: '', mediaType: 'IMAGE' } : sl)))
    if (fileInputRefs.current[slide.id]) fileInputRefs.current[slide.id].value = ''
  }

  function handleRecadrer(e, slide) {
    e.stopPropagation()
    setCropSource(slide.mediaUrl)
    setCropTargetId(slide.id)
  }

  function handleCropConfirm(croppedUrl) {
    const currentSlide = slides.find((slide) => slide.id === cropTargetId)
    if (currentSlide?.mediaUrl.startsWith('blob:') && currentSlide.mediaUrl !== cropSource) URL.revokeObjectURL(currentSlide.mediaUrl)
    if (cropSource && cropSource.startsWith('blob:')) URL.revokeObjectURL(cropSource)
    setSlides((current) => current.map((sl) => (sl.id === cropTargetId ? { ...sl, mediaUrl: croppedUrl, mediaType: 'IMAGE' } : sl)))
    setCropSource(null)
    setCropTargetId(null)
  }

  function handleCropCancel() {
    const isCurrentImage = slides.some((slide) => slide.mediaUrl === cropSource)
    if (cropSource && cropSource.startsWith('blob:') && !isCurrentImage) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    setCropTargetId(null)
  }

  function moveSlide(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= slides.length) return
    setSlides((current) => {
      const reordered = [...current]
      const [slide] = reordered.splice(index, 1)
      reordered.splice(targetIndex, 0, slide)
      return reordered
    })
  }

  function removeSlide(slide) {
    if (slides.length <= 1) return
    if (slide.mediaUrl.startsWith('blob:')) URL.revokeObjectURL(slide.mediaUrl)
    setSlides((current) => current.filter((item) => item.id !== slide.id))
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      titre: titre.trim(),
      slides: slides.map((slide) => ({
        ...slide,
        titre: slide.titre.trim(),
        message: slide.message.trim(),
      })),
    }
    if (!isEdit) {
      payload.statut = e.nativeEvent.submitter?.value || 'BROUILLON'
    }
    onSave(payload)
  }

  const canSubmit = Boolean(titre.trim()) && slides.every((slide) => slide.titre.trim())
  const manquants = [
    !titre.trim() && 'le nom de l’annonce',
    !slides.every((slide) => slide.titre.trim()) && 'le titre de chaque slide',
  ]

  return (
    <>
      <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
        <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="annonce-modal-title">
          <div className="manager-modal-header">
            <div>
              <p className="manager-eyebrow">{isEdit ? 'Modifier l’annonce' : 'Nouvelle annonce'}</p>
              <h2 id="annonce-modal-title">{isEdit ? annonce.titre : 'Créer une annonce'}</h2>
            </div>
            <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <form className="manager-modal-form crud-product-form" onSubmit={submit}>
            <label className="crud-annonce-chain-title">
              Nom de l’annonce
              <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Promos de la semaine" required />
            </label>

            <div className="crud-annonce-slides-heading">
              <div><h3>Slides du carrousel</h3><span>{slides.length} slide{slides.length > 1 ? 's' : ''}</span></div>
              <button className="manager-button manager-button-quiet" type="button" onClick={() => setSlides((current) => [...current, createEmptySlide()])}>
                <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une slide
              </button>
            </div>

            <div className="crud-annonce-slides">
              {slides.map((slide, index) => (
                <article className="crud-annonce-slide-editor" key={slide.id}>
                  <div className="crud-annonce-slide-heading">
                    <h4>Slide {index + 1}</h4>
                    <div>
                      <button className="manager-icon-button" type="button" aria-label={`Monter la slide ${index + 1}`} disabled={index === 0} onClick={() => moveSlide(index, -1)}>
                        <i className="fa-solid fa-arrow-up" aria-hidden="true" />
                      </button>
                      <button className="manager-icon-button" type="button" aria-label={`Descendre la slide ${index + 1}`} disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)}>
                        <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                      </button>
                      <button className="manager-icon-button" type="button" aria-label={`Supprimer la slide ${index + 1}`} disabled={slides.length === 1} onClick={() => removeSlide(slide)}>
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="crud-annonce-slide-fields">
                    <div className="crud-dropzone-field">
                      <span>Photo ou vidéo (optionnel)</span>
                      <div
                        className={`crud-dropzone ${slide.mediaUrl ? 'has-image' : ''} ${dragOverSlideId === slide.id ? 'is-dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverSlideId(slide.id) }}
                        onDragLeave={() => setDragOverSlideId(null)}
                        onDrop={(e) => handleDrop(e, slide.id)}
                        onClick={() => fileInputRefs.current[slide.id]?.click()}
                      >
                        {slide.mediaUrl ? (
                          <div className="crud-dropzone-preview">
                            <MediaSlide url={slide.mediaUrl} type={slide.mediaType} />
                            {slide.mediaType === 'VIDEO' && <span className="ta-annonce-video-badge"><i className="fa-solid fa-play" aria-hidden="true" /> Vidéo</span>}
                            <div className="crud-dropzone-preview-actions">
                              {slide.mediaType !== 'VIDEO' && slide.mediaUrl.startsWith('blob:') && (
                                <button className="crud-dropzone-action" type="button" aria-label="Recadrer l'image" onClick={(e) => handleRecadrer(e, slide)}>
                                  <i className="fa-solid fa-crop-simple" aria-hidden="true" />
                                </button>
                              )}
                              <button className="crud-dropzone-action" type="button" aria-label="Retirer le visuel" onClick={(e) => handleRemoveImage(e, slide)}>
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="crud-dropzone-text"><i className="fa-solid fa-photo-film crud-dropzone-icon" aria-hidden="true" /><strong>Ajouter une photo ou une vidéo</strong><span>Vidéo MP4 ou WebM : 60 s et 30 Mo max</span></span>
                        )}
                        <input ref={(node) => { fileInputRefs.current[slide.id] = node }} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => handleInputChange(e, slide.id)} />
                      </div>
                      {erreursMedia[slide.id] && <p className="ta-form-erreur" role="alert">{erreursMedia[slide.id]}</p>}
                    </div>
                    <div className="crud-product-form-fields">
                      <label>Titre de la slide<input type="text" value={slide.titre} onChange={(e) => updateSlide(slide.id, 'titre', e.target.value)} placeholder="Ex : Tournoi du mois, inscrivez votre équipe !" required /></label>
                      <label>Message<textarea rows={3} value={slide.message} onChange={(e) => updateSlide(slide.id, 'message', e.target.value)} placeholder="Texte court affiché sous le titre (optionnel)…" /></label>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <AideFormulaire manquants={manquants} />
            <div className="manager-modal-actions">
              <button className="manager-button manager-button-quiet" type="button" onClick={requestClose}>Annuler</button>
              {isEdit ? (
                <button className="manager-button manager-button-primary" type="submit" disabled={!canSubmit}>
                  Enregistrer
                </button>
              ) : (
                <>
                  <button className="manager-button manager-button-warning" type="submit" value="BROUILLON" disabled={!canSubmit}>
                    Enregistrer en brouillon
                  </button>
                  <button className="manager-button manager-button-primary" type="submit" value="ACTIF" disabled={!canSubmit}>
                    Publier
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </div>

      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          aspect={4 / 3}
          eyebrow="Visuel de la slide"
          title="Recadrer l'affiche"
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmModal
          title="Quitter sans enregistrer ?"
          message="Les modifications apportées à cette annonce seront perdues."
          confirmLabel="Quitter sans enregistrer"
          cancelLabel="Continuer l'édition"
          tone="danger"
          icon="fa-triangle-exclamation"
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
    </>
  )
}
