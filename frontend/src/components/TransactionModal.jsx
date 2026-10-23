import { useState } from 'react'
import { Alert, Button, ButtonGroup, Col, Form, InputGroup, Modal, Row, Spinner, ToggleButton } from 'react-bootstrap'
import { api } from '../lib/api'
import { PLATFORMS, formatEuro, todayIso } from '../lib/format'

const emptyForm = (type, card) => ({
  type,
  quantity: '1',
  // In vendita proponiamo il valore stimato della carta come prezzo di partenza
  unitPrice: type === 'SELL' && card.estimatedValue != null ? String(card.estimatedValue) : '',
  date: todayIso(),
  platform: '',
  counterparty: '',
  notes: '',
})

// Stesse regole del backend (TransactionRequest), più il controllo sulle copie possedute per le vendite
function validate(form, owned) {
  const errors = {}
  const quantity = Number(form.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = 'Almeno 1 copia'
  else if (form.type === 'SELL' && quantity > owned) errors.quantity = `Ne possiedi ${owned}`
  if (form.unitPrice === '' || !(Number(form.unitPrice) >= 0)) errors.unitPrice = 'Inserisci il prezzo per copia'
  if (!form.date) errors.date = 'Inserisci la data'
  else if (form.date > todayIso()) errors.date = 'La data non può essere nel futuro'
  return errors
}

// Registra un acquisto o una vendita della carta: le copie possedute le aggiorna il backend
export default function TransactionModal({ show, card, defaultType = 'BUY', onHide, onSaved }) {
  const [form, setForm] = useState(() => emptyForm(defaultType, card))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Ogni volta che la modale si apre ripartiamo da un modulo pulito con il tipo scelto
  const handleEnter = () => {
    setForm(emptyForm(defaultType, card))
    setErrors({})
    setSaveError(null)
  }

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const changeType = (type) => {
    setForm((f) => ({ ...emptyForm(type, card), quantity: f.quantity, date: f.date, platform: f.platform }))
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form, card.quantity)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSaveError(null)
    const text = (v) => (v.trim() === '' ? null : v.trim())
    try {
      const saved = await api.addTransaction(card.id, {
        type: form.type,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        date: form.date,
        platform: text(form.platform),
        counterparty: text(form.counterparty),
        notes: text(form.notes),
      })
      onSaved(saved)
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selling = form.type === 'SELL'
  const total = Number(form.quantity) * Number(form.unitPrice)

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} onEnter={handleEnter} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title as="h2" className="h5">
            {selling ? 'Registra vendita' : 'Registra acquisto'}
            <span className="d-block small text-secondary fw-normal mt-1">{card.name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ButtonGroup className="w-100 mb-3">
            {[
              ['BUY', 'Acquisto', 'outline-info'],
              ['SELL', 'Vendita', 'outline-success'],
            ].map(([value, label, variant]) => (
              <ToggleButton
                key={value}
                id={`type-${value}`}
                type="radio"
                name="type"
                value={value}
                variant={variant}
                checked={form.type === value}
                onChange={() => changeType(value)}
                disabled={value === 'SELL' && card.quantity === 0}
              >
                {label}
              </ToggleButton>
            ))}
          </ButtonGroup>

          <Row className="g-3">
            <Col xs={5}>
              <Form.Group controlId="tx-quantity">
                <Form.Label>Copie</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  max={selling ? card.quantity : undefined}
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  isInvalid={!!errors.quantity}
                />
                <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
                {selling && !errors.quantity && <Form.Text>Ne possiedi {card.quantity}</Form.Text>}
              </Form.Group>
            </Col>
            <Col xs={7}>
              <Form.Group controlId="tx-unitPrice">
                <Form.Label>Prezzo per copia</Form.Label>
                <InputGroup hasValidation>
                  <InputGroup.Text>€</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(e) => set('unitPrice', e.target.value)}
                    isInvalid={!!errors.unitPrice}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">{errors.unitPrice}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group controlId="tx-date">
                <Form.Label>Data</Form.Label>
                <Form.Control
                  type="date"
                  max={todayIso()}
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  isInvalid={!!errors.date}
                />
                <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group controlId="tx-platform">
                <Form.Label>Piattaforma</Form.Label>
                <Form.Control
                  list="tx-platforms"
                  placeholder="es. Cardmarket"
                  value={form.platform}
                  onChange={(e) => set('platform', e.target.value)}
                  maxLength={50}
                />
                <datalist id="tx-platforms">
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="tx-counterparty">
                <Form.Label>{selling ? 'Acquirente' : 'Venditore'}</Form.Label>
                <Form.Control
                  placeholder="Facoltativo"
                  value={form.counterparty}
                  onChange={(e) => set('counterparty', e.target.value)}
                  maxLength={100}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="tx-notes">
                <Form.Label>Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  maxLength={2000}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4 p-3 rounded cv-total-box">
            <span className="text-secondary">Totale</span>
            <span className="fs-4 fw-bold">{Number.isFinite(total) ? formatEuro(total) : '—'}</span>
          </div>

          {saveError && !Object.values(errors).some(Boolean) && (
            <Alert variant="danger" className="mt-3 mb-0">
              {saveError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            Annulla
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : selling ? 'Registra vendita' : 'Registra acquisto'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
