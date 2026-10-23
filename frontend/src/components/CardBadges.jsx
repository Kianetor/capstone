import { Badge } from 'react-bootstrap'
import { condition } from '../lib/format'

// Condizione, lingua e gradazione della carta come piccole etichette.
// La condizione ha uno stile neutro (contorno): i colori verde/giallo/rosso nell'app indicano altro (guadagno, vendite...)
export default function CardBadges({ card }) {
  const c = condition(card.condition)
  return (
    <div className="d-flex flex-wrap gap-1">
      <span className="badge cv-badge-condition" title={c.label}>
        {c.short}
        <span className="visually-hidden"> ({c.label})</span>
      </span>
      <Badge bg="secondary">{card.language}</Badge>
      {card.graded && (
        <span className="badge cv-badge-graded">
          {card.gradingCompany} {card.grade}
        </span>
      )}
    </div>
  )
}
