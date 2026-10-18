import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { formatEuro } from '../lib/format'
import CardBadges from './CardBadges'
import CardImage from './CardImage'

// Una carta nella griglia dell'inventario: tutta la card porta al dettaglio
export default function CardItem({ card }) {
  return (
    <Card className="h-100 cv-card-item">
      <Card.Body className="p-2 p-sm-3 d-flex flex-column">
        <CardImage src={card.imageUrl} alt={card.name} className="mb-3" />
        <Card.Title as="h3" className="h6 mb-1 text-truncate">
          <Link to={`/cards/${card.id}`} className="stretched-link text-reset text-decoration-none">
            {card.name}
          </Link>
        </Card.Title>
        <div className="small text-secondary text-truncate mb-2">
          {[card.setName, card.cardNumber].filter(Boolean).join(' · ') || 'Set non indicato'}
        </div>
        <CardBadges card={card} />
        <div className="d-flex justify-content-between align-items-end mt-auto pt-3 small">
          <span className="text-secondary">×{card.quantity}</span>
          <span className="fw-semibold text-accent">{formatEuro(card.estimatedValue)}</span>
        </div>
      </Card.Body>
    </Card>
  )
}
