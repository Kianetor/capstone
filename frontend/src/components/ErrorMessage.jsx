import { Alert, Button } from 'react-bootstrap'

// Messaggio d'errore uniforme, con il bottone "Riprova" quando ha senso ripetere la richiesta
export default function ErrorMessage({ message, onRetry, className = '' }) {
  if (!message) return null
  return (
    <Alert
      variant="danger"
      className={`d-flex align-items-center justify-content-between gap-3 flex-wrap ${className}`}
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </Alert>
  )
}
