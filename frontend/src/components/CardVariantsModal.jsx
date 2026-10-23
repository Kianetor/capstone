import { Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { formatEuro } from '../lib/format'
import CardBadges from './CardBadges'
import CardImage from './CardImage'

// Confronto tra le versioni della stessa carta: condizione, lingua, gradazione, copie, prezzi.
// Ogni riga porta al dettaglio di quella versione (storico, modifica, vendita)
export default function CardVariantsModal({ group, onHide }) {
  return (
    <Modal show={Boolean(group)} onHide={onHide} centered scrollable>
      {group && (
        <>
          <Modal.Header closeButton>
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div className="cv-variants-thumb">
                <CardImage src={group.imageUrl} alt="" />
              </div>
              <div className="min-w-0">
                <Modal.Title as="h2" className="h5 mb-1">
                  {group.name}
                </Modal.Title>
                <div className="small text-secondary">
                  {[group.setName, group.cardNumber].filter(Boolean).join(' · ') || 'Set non indicato'}
                </div>
                <div className="small text-secondary">
                  {group.quantity} {group.quantity === 1 ? 'copia' : 'copie'} in {group.variants.length} versioni
                </div>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-0">
            <ul className="list-unstyled mb-0">
              {group.variants.map(({ card, averagePurchasePrice }) => (
                <li key={card.id} className="cv-variant-row">
                  <Link to={`/cards/${card.id}`} className="d-block text-reset text-decoration-none px-3 py-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <CardBadges card={card} />
                      <span className="small fw-semibold text-nowrap">
                        {card.quantity === 0 ? 'Venduta' : `×${card.quantity}`}
                      </span>
                    </div>
                    <dl className="cv-variant-prices mb-0">
                      <div>
                        <dt>Valore stimato</dt>
                        <dd>{formatEuro(card.estimatedValue)}</dd>
                      </div>
                      <div>
                        <dt>Pagata in media</dt>
                        <dd>{formatEuro(averagePurchasePrice)}</dd>
                      </div>
                      <div>
                        <dt>Differenza</dt>
                        <dd className={toneOf(card.estimatedValue, averagePurchasePrice)}>
                          {difference(card.estimatedValue, averagePurchasePrice)}
                        </dd>
                      </div>
                    </dl>
                    {card.notes && <p className="small text-secondary mt-2 mb-0 text-truncate">{card.notes}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </Modal.Body>
        </>
      )}
    </Modal>
  )
}

// Valore stimato meno prezzo pagato, per copia: quanto vale in più (o in meno) di quanto l'hai pagata
function difference(value, paid) {
  if (value == null || paid == null) return '—'
  const diff = Number(value) - Number(paid)
  return `${diff > 0 ? '+' : ''}${formatEuro(diff)}`
}

function toneOf(value, paid) {
  if (value == null || paid == null) return ''
  const diff = Number(value) - Number(paid)
  return diff > 0 ? 'cv-tone-positive' : diff < 0 ? 'cv-tone-negative' : ''
}
