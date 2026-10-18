import { Badge } from 'react-bootstrap'
import { condition } from '../lib/format'

// Condizione, lingua e gradazione della carta come piccole etichette
export default function CardBadges({ card }) {
  const c = condition(card.condition)
  return (
    <div className="d-flex flex-wrap gap-1">
      <Badge bg={c.variant} className="text-dark" title={c.label}>
        {c.short}
      </Badge>
      <Badge bg="secondary">{card.language}</Badge>
      {card.graded && (
        <Badge bg="light" text="dark">
          {card.gradingCompany} {card.grade}
        </Badge>
      )}
    </div>
  )
}
