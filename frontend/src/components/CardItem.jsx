import { Badge, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { formatEuro } from '../lib/format'
import CardBadges from './CardBadges'
import CardImage from './CardImage'

// Una carta nella griglia dell'inventario: tutta la card porta al dettaglio.
// Con 0 copie (vendute tutte) è sbiadita e ha l'etichetta "Venduta"
export default function CardItem({ card }) {
  const sold = card.quantity === 0
  return (
    <Card className={`h-100 cv-card-item ${sold ? 'cv-card-sold' : ''}`}>
      <Card.Body className="p-2 p-sm-3 d-flex flex-column">
        <div className="position-relative mb-3">
          <CardImage src={card.imageUrl} alt={card.name} />
          {sold && (
            <Badge bg="dark" className="position-absolute top-0 start-0 m-1 border">
              Venduta
            </Badge>
          )}
        </div>
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
