import { useState } from 'react'

// Immagine della carta in proporzione 63x88 mm; senza immagine (o se non si carica) mostra un segnaposto
export default function CardImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={`cv-card-image ${className}`}>
      {showImage ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="cv-card-placeholder" role="img" aria-label="Immagine non disponibile">
          <span aria-hidden="true">★</span>
          <small>Nessuna immagine</small>
        </div>
      )}
    </div>
  )
}
