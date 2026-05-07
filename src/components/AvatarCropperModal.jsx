import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import './AvatarCropperModal.css'

// Crop the original image to the selected pixel area and return a JPEG Blob.
async function getCroppedBlob(imageSrc, areaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = areaPixels.width
  canvas.height = areaPixels.height
  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    image,
    areaPixels.x,
    areaPixels.y,
    areaPixels.width,
    areaPixels.height,
    0,
    0,
    areaPixels.width,
    areaPixels.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas is empty'))
      },
      'image/jpeg',
      0.9,
    )
  })
}

function AvatarCropperModal({ imageSrc, onCancel, onConfirm, isSaving }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } catch (err) {
      console.error('Failed to crop image:', err)
      onConfirm(null, err)
    }
  }

  return (
    <div className="cropper-modal-overlay" onClick={isSaving ? undefined : onCancel}>
      <div className="cropper-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="cropper-modal-title">Crop Profile Picture</h2>

        <div className="cropper-modal-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="cropper-modal-controls">
          <label className="cropper-modal-zoom-label">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="cropper-modal-zoom-slider"
              disabled={isSaving}
            />
          </label>
        </div>

        <div className="cropper-modal-actions">
          <button
            type="button"
            className="cropper-modal-cancel"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cropper-modal-confirm"
            onClick={handleConfirm}
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? 'Uploading…' : 'Crop & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarCropperModal
