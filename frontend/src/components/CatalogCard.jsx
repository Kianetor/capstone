import { Link } from 'react-router-dom'
import CardImage from './CardImage'

// Una carta del catalogo pubblico (risultato di TCGdex): porta alla sua pagina
export default function CatalogCard({ card, lang }) {
  return (
    <Link
      to={`/explore/cards/${encodeURIComponent(card.externalId)}?lang=${lang}`}
      className="cv-search-result d-block text-decoration-none"
      title={card.name}
    >
      <CardImage src={card.thumbnailUrl} alt={card.name} />
      <span className="d-block fw-semibold text-truncate mt-2">{card.name}</span>
      <span className="d-block small text-secondary">#{card.number}</span>
    </Link>
  )
}
