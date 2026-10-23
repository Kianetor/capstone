import { Link } from 'react-router-dom'
import SetLogo from './SetLogo'

// Riquadro di un set (espansione) con il logo: porta alla pagina del set nel catalogo.
// Senza logo, o se il logo non si carica, mostra il nome scritto
export default function SetTile({ set, lang }) {
  return (
    <Link to={`/explore/sets/${encodeURIComponent(set.id)}?lang=${lang}`} className="cv-set-tile" title={set.name}>
      <SetLogo key={set.logoUrl} url={set.logoUrl} name={set.name} />
      <div className="small text-truncate mt-2">{set.name}</div>
      {/* Per alcuni set di promo TCGdex non conta le carte: meglio nessun numero che "0 carte" */}
      {set.officialCount > 0 && <div className="small text-secondary">{set.officialCount} carte</div>}
    </Link>
  )
}
