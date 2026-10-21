import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import SetTile from '../components/SetTile'
import { api } from '../lib/api'

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Inventario completo',
    text: 'Cataloga ogni carta con set, numero, lingua, condizione e gradazione. Cerca e filtra in un attimo.',
  },
  {
    icon: '💶',
    title: 'Acquisti e vendite',
    text: 'Registra ogni operazione: le copie possedute si aggiornano da sole e lo storico resta sempre a portata di mano.',
  },
  {
    icon: '📈',
    title: 'Valore della collezione',
    text: 'Valore stimato, spesa, ricavi e margine in una dashboard. Il prezzo di mercato arriva da Cardmarket.',
  },
]

export default function Landing() {
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [latestSets, setLatestSets] = useState(null)

  // Vetrina delle ultime espansioni: se il catalogo non risponde la sezione semplicemente non compare
  useEffect(() => {
    api
      .latestSets('it', 12)
      .then(setLatestSets)
      .catch(() => setLatestSets([]))
  }, [])

  // La ricerca si apre nel catalogo, che funziona anche senza account
  const search = (e) => {
    e.preventDefault()
    if (q.trim().length >= 2) navigate(`/explore?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <Row className="align-items-center g-5 py-md-5">
        <Col lg={6} className="text-center text-lg-start">
          <span className="badge rounded-pill text-bg-dark border mb-3 px-3 py-2 fw-normal">
            Il gestionale per collezionisti di carte Pokémon
          </span>
          <h1 className="display-4 fw-bold mb-3">
            La tua collezione, <span className="text-accent">sotto controllo</span>.
          </h1>
          <p className="lead text-secondary mb-4">
            Tieni traccia di ogni carta, di quanto hai speso e di quanto vale oggi la tua collezione. Tutto in un unico
            posto, dal telefono o dal computer.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
            {user ? (
              <Button as={Link} to="/dashboard" size="lg">
                Vai alla dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" size="lg">
                  Inizia gratis
                </Button>
                <Button as={Link} to="/login" size="lg" variant="outline-primary">
                  Accedi
                </Button>
              </>
            )}
          </div>
        </Col>
        <Col lg={6} className="d-none d-md-block">
          <div className="cv-hero-cards" aria-hidden="true">
            <div className="cv-hero-card cv-hero-card-1" />
            <div className="cv-hero-card cv-hero-card-2" />
            <div className="cv-hero-card cv-hero-card-3">
              <span>★</span>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="my-4 cv-landing-search">
        <Card.Body className="p-4 p-md-5 text-center">
          <h2 className="h3 mb-2">Cerca una carta</h2>
          <p className="text-secondary mb-4">
            Migliaia di carte con immagini e prezzo di mercato. Non serve un account.
          </p>
          <Form onSubmit={search} className="mx-auto" style={{ maxWidth: 560 }}>
            <InputGroup size="lg">
              <Form.Control
                placeholder="Nome o numero, es. Charizard o 4/102"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Cerca una carta"
              />
              <Button type="submit">Cerca</Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {latestSets === null || latestSets.length > 0 ? (
        <section className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
            <h2 className="h4 mb-0">Ultime espansioni</h2>
            <Link to="/explore">Tutte le serie →</Link>
          </div>
          {latestSets === null ? (
            <div className="text-secondary small">Carico le espansioni...</div>
          ) : (
            <Row xs={2} sm={3} md={4} lg={6} className="g-3">
              {latestSets.map((set) => (
                <Col key={set.id}>
                  <SetTile set={set} lang="it" />
                </Col>
              ))}
            </Row>
          )}
        </section>
      ) : null}

      <Row xs={1} md={3} className="g-4 py-5">
        {FEATURES.map((f) => (
          <Col key={f.title}>
            <Card className="h-100">
              <Card.Body className="p-4">
                <div className="fs-2 mb-3" aria-hidden="true">
                  {f.icon}
                </div>
                <Card.Title as="h2" className="h5">
                  {f.title}
                </Card.Title>
                <Card.Text className="text-secondary">{f.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
