import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Form, InputGroup, Row, Spinner } from 'react-bootstrap'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CardImage from '../components/CardImage'
import ErrorMessage from '../components/ErrorMessage'
import ExternalSearch from '../components/ExternalSearch'
import Loader from '../components/Loader'
import { api } from '../lib/api'
import {
  CONDITIONS,
  GRADING_COMPANIES,
  LANGUAGES,
  PLATFORMS,
  formatEuro,
  tcgdexLanguage,
  todayIso,
} from '../lib/format'
import { setPage } from '../store/cardsSlice'

const EMPTY_FORM = {
  name: '',
  setName: '',
  cardNumber: '',
  language: 'ITA',
  condition: 'NEAR_MINT',
  graded: false,
  gradingCompany: '',
  grade: '',
  quantity: '1',
  estimatedValue: '',
  imageUrl: '',
  externalId: '',
  notes: '',
  // Solo in aggiunta: l'acquisto delle copie viene registrato insieme alla carta
  buyEnabled: true,
  buyPrice: '',
  buyDate: todayIso(),
  buyPlatform: '',
}

// Errori del backend sull'acquisto (purchase.*) -> campi del form
const PURCHASE_ERRORS = { 'purchase.unitPrice': 'buyPrice', 'purchase.date': 'buyDate', purchaseValid: 'quantity' }

// Dalla carta del backend ai valori del form (i campi input vogliono stringhe, non null)
function toForm(card) {
  const form = { ...EMPTY_FORM }
  Object.keys(EMPTY_FORM).forEach((key) => {
    if (card[key] !== null && card[key] !== undefined)
      form[key] = typeof card[key] === 'boolean' ? card[key] : String(card[key])
  })
  return form
}

// Dal form al corpo della richiesta: stringhe vuote -> null, numeri come numeri
function toPayload(form, editing) {
  const text = (v) => (v.trim() === '' ? null : v.trim())
  return {
    name: form.name.trim(),
    setName: text(form.setName),
    cardNumber: text(form.cardNumber),
    language: form.language,
    condition: form.condition,
    graded: form.graded,
    gradingCompany: form.graded ? text(form.gradingCompany) : null,
    grade: form.graded && form.grade !== '' ? Number(form.grade) : null,
    quantity: Number(form.quantity),
    estimatedValue: form.estimatedValue === '' ? null : Number(form.estimatedValue),
    imageUrl: text(form.imageUrl),
    externalId: text(form.externalId),
    notes: text(form.notes),
    purchase:
      !editing && form.buyEnabled
        ? { unitPrice: Number(form.buyPrice), date: form.buyDate, platform: text(form.buyPlatform) }
        : null,
  }
}

// Stesse regole del backend (CardRequest)
function validate(form, editing) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Il nome è obbligatorio'
  const quantity = Number(form.quantity)
  if (form.quantity === '' || !Number.isInteger(quantity) || quantity < 0) errors.quantity = 'Numero intero, 0 o più'
  if (form.estimatedValue !== '' && !(Number(form.estimatedValue) >= 0)) errors.estimatedValue = 'Valore non valido'
  if (form.graded) {
    if (!form.gradingCompany) errors.gradingCompany = 'Scegli la compagnia'
    const grade = Number(form.grade)
    if (form.grade === '' || grade < 1 || grade > 10) errors.grade = 'Voto da 1 a 10'
  }
  if (form.imageUrl.trim() && !/^https:\/\/\S+$/.test(form.imageUrl.trim()))
    errors.imageUrl = 'Deve essere un indirizzo https'
  if (!editing && form.buyEnabled) {
    if (!errors.quantity && quantity < 1) errors.quantity = "Almeno una copia per registrare l'acquisto"
    if (form.buyPrice === '' || !(Number(form.buyPrice) >= 0))
      errors.buyPrice = 'Inserisci il prezzo pagato (0 se regalata)'
    if (!form.buyDate) errors.buyDate = 'Inserisci la data'
    else if (form.buyDate > todayIso()) errors.buyDate = 'La data non può essere nel futuro'
  }
  return errors
}

export default function CardForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [prefilled, setPrefilled] = useState(null)
  // Aggiungendo una carta il form compare solo dopo aver scelto un risultato o "Inserisci carta manualmente"
  const [showForm, setShowForm] = useState(editing)
  const formRef = useRef(null)

  const openForm = () => {
    setShowForm(true)
    // Aspettiamo che il form sia nella pagina, poi ci scorriamo sopra
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // In modifica carichiamo la carta esistente
  useEffect(() => {
    if (!editing) return
    api
      .card(id)
      .then(({ card }) => setForm(toForm(card)))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false))
  }, [id, editing])

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({
      ...e,
      [name]: undefined,
      ...(name === 'grade' || name === 'graded' ? { gradingValid: undefined } : {}),
    }))
  }
  const handleChange = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value)

  // Scelta una carta su TCGdex: precompiliamo i campi, il resto (condizione, copie...) lo decide l'utente
  const handleExternalSelect = (detail, lang) => {
    const language = LANGUAGES.find((l) => l.tcgdex === lang && !['KOR', 'CHN'].includes(l.value))?.value
    setForm((f) => ({
      ...f,
      name: detail.name ?? f.name,
      setName: detail.setName ?? '',
      cardNumber: detail.cardNumber ?? '',
      imageUrl: detail.imageUrl ?? '',
      externalId: detail.externalId ?? '',
      estimatedValue: detail.marketPrice != null ? String(detail.marketPrice) : f.estimatedValue,
      language: language ?? f.language,
    }))
    setErrors({})
    setPrefilled(detail)
    openForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form, editing)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = toPayload(form, editing)
      const saved = editing ? await api.updateCard(id, payload) : await api.createCard(payload)
      if (editing) {
        navigate(`/cards/${saved.id}`)
      } else {
        // Carta nuova: torniamo alla prima pagina dell'inventario, dove compare per prima, con un messaggio di conferma
        dispatch(setPage(0))
        navigate('/cards', { state: { added: saved.name, purchased: form.buyEnabled } })
      }
    } catch (err) {
      if (err.errors) {
        const mapped = {}
        Object.entries(err.errors).forEach(([key, message]) => (mapped[PURCHASE_ERRORS[key] ?? key] = message))
        setErrors(mapped)
      }
      setSaveError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loader />
  if (loadError) return <ErrorMessage message={loadError} />

  // L'errore "gradingValid" del backend riguarda compagnia e voto insieme: lo mostriamo sotto il voto
  const gradeError = errors.grade ?? errors.gradingValid

  return (
    <>
      <div className="mb-4">
        <Link to={editing ? `/cards/${id}` : '/cards'} className="small text-secondary text-decoration-none">
          ← {editing ? 'Torna alla carta' : "Torna all'inventario"}
        </Link>
        <h1 className="h2 mt-2 mb-0">{editing ? 'Modifica carta' : 'Aggiungi carta'}</h1>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <ExternalSearch defaultLanguage={tcgdexLanguage(form.language)} onSelect={handleExternalSelect} />
        </Card.Body>
      </Card>

      {!showForm && (
        <div className="text-center py-3">
          <p className="text-secondary small mb-2">Non trovi la carta o preferisci fare da te?</p>
          <Button variant="outline-primary" onClick={openForm}>
            Inserisci carta manualmente
          </Button>
        </div>
      )}

      {showForm && (
        <div ref={formRef} className="cv-scroll-anchor">
          {prefilled && (
            <Alert variant="success" dismissible onClose={() => setPrefilled(null)}>
              Dati di <strong>{prefilled.name}</strong> precompilati
              {prefilled.marketPrice != null && (
                <> · prezzo di tendenza su Cardmarket {formatEuro(prefilled.marketPrice)}</>
              )}
              . Controlla condizione e copie prima di salvare.
            </Alert>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={4} lg={3}>
                <CardImage
                  src={form.imageUrl}
                  alt={form.name || 'Anteprima carta'}
                  className="cv-card-image-form mx-auto"
                />
              </Col>
              <Col md={8} lg={9}>
                <Card>
                  <Card.Body className="p-3 p-md-4">
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group controlId="name">
                          <Form.Label>Nome *</Form.Label>
                          <Form.Control
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            isInvalid={!!errors.name}
                            maxLength={100}
                          />
                          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col sm={8}>
                        <Form.Group controlId="setName">
                          <Form.Label>Set</Form.Label>
                          <Form.Control
                            name="setName"
                            value={form.setName}
                            onChange={handleChange}
                            placeholder="es. Base Set"
                            maxLength={100}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group controlId="cardNumber">
                          <Form.Label>Numero</Form.Label>
                          <Form.Control
                            name="cardNumber"
                            value={form.cardNumber}
                            onChange={handleChange}
                            placeholder="es. 4/102"
                            maxLength={20}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="language">
                          <Form.Label>Lingua *</Form.Label>
                          <Form.Select name="language" value={form.language} onChange={handleChange}>
                            {LANGUAGES.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="condition">
                          <Form.Label>Condizione *</Form.Label>
                          <Form.Select name="condition" value={form.condition} onChange={handleChange}>
                            {CONDITIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label} ({c.short})
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Check
                          type="switch"
                          id="graded"
                          name="graded"
                          label="Carta gradata (in custodia PSA, BGS, CGC...)"
                          checked={form.graded}
                          onChange={handleChange}
                        />
                      </Col>
                      {form.graded && (
                        <>
                          <Col xs={6}>
                            <Form.Group controlId="gradingCompany">
                              <Form.Label>Compagnia *</Form.Label>
                              <Form.Select
                                name="gradingCompany"
                                value={form.gradingCompany}
                                onChange={handleChange}
                                isInvalid={!!errors.gradingCompany}
                              >
                                <option value="">Scegli...</option>
                                {GRADING_COMPANIES.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.gradingCompany}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col xs={6}>
                            <Form.Group controlId="grade">
                              <Form.Label>Voto *</Form.Label>
                              <Form.Control
                                type="number"
                                name="grade"
                                min="1"
                                max="10"
                                step="0.5"
                                value={form.grade}
                                onChange={handleChange}
                                isInvalid={!!gradeError}
                              />
                              <Form.Control.Feedback type="invalid">{gradeError}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </>
                      )}

                      <Col sm={6}>
                        <Form.Group controlId="quantity">
                          <Form.Label>Copie possedute *</Form.Label>
                          <Form.Control
                            type="number"
                            name="quantity"
                            min="0"
                            step="1"
                            value={form.quantity}
                            onChange={handleChange}
                            isInvalid={!!errors.quantity}
                          />
                          <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
                          {editing && <Form.Text>Acquisti e vendite registrati aggiornano le copie da soli.</Form.Text>}
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="estimatedValue">
                          <Form.Label>Valore stimato (per copia)</Form.Label>
                          <InputGroup hasValidation>
                            <InputGroup.Text>€</InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="estimatedValue"
                              min="0"
                              step="0.01"
                              value={form.estimatedValue}
                              onChange={handleChange}
                              isInvalid={!!errors.estimatedValue}
                            />
                            <Form.Control.Feedback type="invalid">{errors.estimatedValue}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      {!editing && (
                        <Col xs={12}>
                          <div className="cv-purchase-box p-3 rounded">
                            <Form.Check
                              type="switch"
                              id="buyEnabled"
                              name="buyEnabled"
                              label="Registra anche come acquisto"
                              checked={form.buyEnabled}
                              onChange={handleChange}
                            />
                            <div className="small text-secondary mt-1">
                              {form.buyEnabled
                                ? "L'acquisto delle copie finisce nello storico e nella spesa della dashboard."
                                : "Viene salvata solo la carta, senza spesa. Puoi registrare l'acquisto più tardi dal dettaglio."}
                            </div>
                            {form.buyEnabled && (
                              <Row className="g-3 mt-1">
                                <Col sm={4}>
                                  <Form.Group controlId="buyPrice">
                                    <Form.Label>Prezzo pagato per copia *</Form.Label>
                                    <InputGroup hasValidation>
                                      <InputGroup.Text>€</InputGroup.Text>
                                      <Form.Control
                                        type="number"
                                        name="buyPrice"
                                        min="0"
                                        step="0.01"
                                        value={form.buyPrice}
                                        onChange={handleChange}
                                        isInvalid={!!errors.buyPrice}
                                      />
                                      <Form.Control.Feedback type="invalid">{errors.buyPrice}</Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                                <Col xs={6} sm={4}>
                                  <Form.Group controlId="buyDate">
                                    <Form.Label>Data acquisto *</Form.Label>
                                    <Form.Control
                                      type="date"
                                      name="buyDate"
                                      max={todayIso()}
                                      value={form.buyDate}
                                      onChange={handleChange}
                                      isInvalid={!!errors.buyDate}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.buyDate}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                                <Col xs={6} sm={4}>
                                  <Form.Group controlId="buyPlatform">
                                    <Form.Label>Piattaforma</Form.Label>
                                    <Form.Control
                                      list="buy-platforms"
                                      name="buyPlatform"
                                      placeholder="es. Cardmarket"
                                      value={form.buyPlatform}
                                      onChange={handleChange}
                                      maxLength={50}
                                    />
                                    <datalist id="buy-platforms">
                                      {PLATFORMS.map((p) => (
                                        <option key={p} value={p} />
                                      ))}
                                    </datalist>
                                  </Form.Group>
                                </Col>
                                {form.buyPrice !== '' && Number(form.quantity) > 0 && (
                                  <Col xs={12} className="small text-secondary">
                                    Spesa registrata: {form.quantity} × {formatEuro(form.buyPrice)} ={' '}
                                    <strong className="text-accent">
                                      {formatEuro(Number(form.quantity) * Number(form.buyPrice))}
                                    </strong>
                                  </Col>
                                )}
                              </Row>
                            )}
                          </div>
                        </Col>
                      )}

                      <Col xs={12}>
                        <Form.Group controlId="imageUrl">
                          <Form.Label>Indirizzo immagine</Form.Label>
                          <Form.Control
                            name="imageUrl"
                            value={form.imageUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                            isInvalid={!!errors.imageUrl}
                            maxLength={500}
                          />
                          <Form.Control.Feedback type="invalid">{errors.imageUrl}</Form.Control.Feedback>
                          <Form.Text>
                            Si compila dalla ricerca. Potrai anche caricare una foto della tua copia.
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group controlId="notes">
                          <Form.Label>Note</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            maxLength={2000}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {saveError && !Object.keys(errors).some((k) => errors[k]) && (
                      <Alert variant="danger" className="mt-3 mb-0">
                        {saveError}
                      </Alert>
                    )}

                    <div className="d-flex gap-2 justify-content-end mt-4">
                      <Button variant="outline-secondary" onClick={() => navigate(-1)} disabled={saving}>
                        Annulla
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <Spinner size="sm" animation="border" />
                        ) : editing ? (
                          'Salva modifiche'
                        ) : (
                          'Aggiungi carta'
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </div>
      )}
    </>
  )
}
