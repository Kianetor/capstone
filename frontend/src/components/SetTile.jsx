import { useState } from 'react'
import { Link } from 'react-router-dom'

// Riquadro di un set (espansione) con il logo: porta alla pagina del set nel catalogo.
// Senza logo, o se il logo non si carica, mostra il nome scritto
export default function SetTile({ set, lang }) {
  const [failed, setFailed] = useState(false)
  return (
    <Link to={`/explore/sets/${encodeURIComponent(set.id)}?lang=${lang}`} className="cv-set-tile" title={set.name}>
      <div className="cv-set-logo">
        {set.logoUrl && !failed ? (
          <img src={set.logoUrl} alt={set.name} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span>{set.name}</span>
        )}
      </div>
      <div className="small text-truncate mt-2">{set.name}</div>
      {/* Per alcuni set di promo TCGdex non conta le carte: meglio nessun numero che "0 carte" */}
      {set.officialCount > 0 && <div className="small text-secondary">{set.officialCount} carte</div>}
    </Link>
  )
}
