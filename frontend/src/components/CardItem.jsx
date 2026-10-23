import { Badge, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { formatEuro } from '../lib/format'
import CardBadges from './CardBadges'
import CardImage from './CardImage'
import TiltCard from './TiltCard'

// Una carta nella griglia dell'inventario, con tutte le sue copie (gruppo restituito da /api/cards/groups).
// Una sola versione: tutta la card porta al dettaglio. Più versioni (condizioni, lingue, gradazioni diverse):
// la card apre il confronto tra le versioni (onOpen). Con 0 copie è sbiadita e ha l'etichetta "Venduta"
export default function CardItem({ group, onOpen }) {
  const single = group.variants.length === 1 ? group.variants[0].card : null
  const sold = group.quantity === 0
  const to = single ? `/cards/${single.id}` : undefined

  return (
    <Card className={`h-100 cv-card-item ${sold ? 'cv-card-sold' : ''}`}>
      <Card.Body className="p-2 p-sm-3 d-flex flex-column">
        <div className={`position-relative mb-3 ${single ? '' : 'cv-card-stack'}`}>
          <TiltCard to={to} onClick={single ? undefined : onOpen}>
            <CardImage src={group.imageUrl} alt={group.name} />
          </TiltCard>
          {sold && (
            <Badge bg="dark" className="position-absolute top-0 start-0 m-1 border">
              Venduta
            </Badge>
          )}
          {group.quantity > 1 && (
            <span className="cv-copies-badge" aria-hidden="true">
              ×{group.quantity}
            </span>
          )}
        </div>
        <Card.Title as="h3" className="h6 mb-1 text-truncate">
          {single ? (
            <Link to={to} className="stretched-link text-reset text-decoration-none">
              {group.name}
            </Link>
          ) : (
            <button type="button" onClick={onOpen} className="cv-link-button stretched-link text-reset">
              {group.name}
            </button>
          )}
        </Card.Title>
        <div className="small text-secondary text-truncate mb-2">
          {[group.setName, group.cardNumber].filter(Boolean).join(' · ') || 'Set non indicato'}
        </div>
        {single ? (
          <CardBadges card={single} />
        ) : (
          <div className="small text-secondary">{group.variants.length} versioni</div>
        )}
        <div className="d-flex justify-content-between align-items-end mt-auto pt-3 small">
          <span className="text-secondary">
            ×{group.quantity}
            <span className="visually-hidden"> copie</span>
          </span>
          <span className="fw-bold">{priceLabel(group)}</span>
        </div>
      </Card.Body>
    </Card>
  )
}

// Versioni con valori diversi: mostriamo il più basso ("da 12,00 €"), il dettaglio è nel confronto
function priceLabel(group) {
  if (group.minValue == null || group.minValue === group.maxValue) return formatEuro(group.maxValue)
  return `da ${formatEuro(group.minValue)}`
}
