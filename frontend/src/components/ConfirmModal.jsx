import { Button, Modal, Spinner } from 'react-bootstrap'

// Finestra di conferma per le azioni che non si possono annullare
export default function ConfirmModal({
  show,
  title,
  children,
  confirmLabel = 'Conferma',
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={loading ? undefined : onCancel} centered>
      <Modal.Header closeButton={!loading}>
        <Modal.Title as="h2" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
