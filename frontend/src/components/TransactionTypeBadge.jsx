import { Badge } from 'react-bootstrap'

// Etichetta colorata del tipo di transazione: azzurro per gli acquisti, verde per le vendite
export default function TransactionTypeBadge({ type }) {
  return (
    <Badge bg={type === 'BUY' ? 'info' : 'success'} className="text-dark">
      {type === 'BUY' ? 'Acquisto' : 'Vendita'}
    </Badge>
  )
}
