import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import SetTile from '../components/SetTile'
import { pokemonArtwork } from '../lib/format'
import { api } from '../lib/api'

// Anteprima della dashboard nella pagina iniziale: carte e numeri dell'account demo (immagini di TCGdex)
const PREVIEW_CARDS = [
  {
    name: 'Umbreon VMAX',
    detail: 'Evolving Skies · PSA 10',
    value: '1.772,15 €',
    gain: '+422,15 €',
    image: 'https://assets.tcgdex.net/en/swsh/swsh7/215/low.webp',
  },
  {
    name: 'Lugia',
    detail: 'Neo Genesis · Good',
    value: '760,83 €',
    gain: '+280,83 €',
    image: 'https://assets.tcgdex.net/en/neo/neo1/9/low.webp',
  },
  {
    name: 'Charizard',
    detail: 'Base Set · Excellent',
    value: '682,59 €',
    gain: '+162,59 €',
    image: 'https://assets.tcgdex.net/en/base/base1/4/low.webp',
  },
]

// Andamento del valore negli ultimi mesi (illustrativo): punti del grafico da sinistra a destra, da 0 a 1
const TREND = [0.18, 0.22, 0.2, 0.34, 0.31, 0.45, 0.52, 0.49, 0.63, 0.71, 0.68, 0.86]

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
      <Row className="align-items-center g-4 g-lg-5 py-md-5">
        <Col lg={6} className="text-center text-lg-start">
          <h1 className="display-4 fw-bold mb-3">
            La tua collezione, <span className="cv-holo-text">sotto controllo</span>.
          </h1>
          <p className="lead text-secondary mb-4">
            Tieni traccia di ogni carta Pokémon, di quanto hai speso e di quanto vale oggi la tua collezione. Tutto in
            un unico posto, dal telefono o dal computer.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
            {user ? (
              <Button as={Link} to="/dashboard" size="lg">
                Vai alla dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" size="lg">
                  Registrati
                </Button>
                <Button as={Link} to="/login" size="lg" variant="outline-primary">
                  Accedi
                </Button>
              </>
            )}
          </div>
        </Col>
        <Col lg={6}>
          <CollectionPreview />
        </Col>
      </Row>

      <Card className="my-4 cv-landing-search cv-holo-border">
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

// Finta dashboard con i numeri dell'account demo: fa vedere subito cosa fa l'app. Solo decorativa
function CollectionPreview() {
  const width = 320
  const height = 72
  const points = TREND.map((y, i) => [(i / (TREND.length - 1)) * width, height - y * height])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

  return (
    <div className="cv-preview" aria-hidden="true">
      <div className="cv-preview-panel">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="cv-avatar" style={{ width: 32, height: 32 }}>
            <img src={pokemonArtwork(25)} alt="" />
          </span>
          <span className="small text-secondary">Collezione di demo</span>
          <span className="cv-preview-live ms-auto">Prezzi Cardmarket</span>
        </div>
        <div className="small text-secondary">Valore della collezione</div>
        <div className="d-flex align-items-baseline flex-wrap gap-2 mb-2">
          <span className="cv-preview-value">8.635,32 €</span>
          <span className="cv-preview-gain">▲ +2.031,82 €</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="cv-preview-chart" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cv-preview-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--cv-success)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--cv-success)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${width} ${height} L0 ${height} Z`} fill="url(#cv-preview-fill)" />
          <path d={line} fill="none" stroke="var(--cv-success)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <ul className="list-unstyled mb-0 mt-3">
          {PREVIEW_CARDS.map((card) => (
            <li key={card.name} className="cv-preview-row">
              <img src={card.image} alt="" className="cv-preview-thumb" />
              <div className="min-w-0 flex-grow-1">
                <div className="fw-semibold text-truncate">{card.name}</div>
                <div className="small text-secondary text-truncate">{card.detail}</div>
              </div>
              <div className="text-end">
                <div className="fw-bold">{card.value}</div>
                <div className="small cv-tone-positive">{card.gain}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="cv-preview-toast">
        <span className="cv-preview-toast-icon">✓</span>
        <div>
          <div className="fw-semibold">Vendita registrata</div>
          <div className="small text-secondary">Blastoise · +65,00 € di guadagno</div>
        </div>
      </div>
    </div>
  )
}
