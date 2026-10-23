import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Col, ListGroup, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import CardImage from '../components/CardImage'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import StatTile from '../components/StatTile'
import TransactionTypeBadge from '../components/TransactionTypeBadge'
import { api } from '../lib/api'
import { formatDate, formatEuro } from '../lib/format'

// Importo con il segno davanti: +12,00 € / −5,00 €
const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatEuro(Math.abs(value))}`

// Riepilogo della collezione: numeri chiave, ultime transazioni e carte di maggior valore
export default function Dashboard() {
  const user = useSelector((state) => state.auth.user)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // Le tre richieste partono insieme: la pagina aspetta solo la più lenta
  const load = useCallback(
    () =>
      Promise.all([
        api.stats(),
        api.transactions({ page: 0, size: 5 }),
        api.cards({ page: 0, size: 5, sort: 'estimatedValue,desc' }),
      ])
        .then(([stats, transactions, topCards]) =>
          setData({ stats, transactions: transactions.content, topCards: topCards.content }),
        )
        .catch((e) => setError(e.message)),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const retry = () => {
    setError(null)
    load()
  }

  if (error) return <ErrorMessage message={error} onRetry={retry} />
  if (!data) return <Loader text="Carico la dashboard..." />

  const { stats, transactions, topCards } = data
  const margin = Number(stats.margin)
  const balance = Number(stats.netBalance)

  return (
    <>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-0">Ciao {user?.username}</h1>
          <span className="text-secondary">Ecco come sta la tua collezione.</span>
        </div>
        <Button as={Link} to="/cards/new">
          + Aggiungi carta
        </Button>
      </div>

      {stats.distinctCards === 0 && transactions.length === 0 ? (
        <Card className="text-center">
          <Card.Body className="py-5">
            <div className="display-4 mb-3" aria-hidden="true">
              🗂️
            </div>
            <h2 className="h4">La tua collezione è ancora vuota</h2>
            <p className="text-secondary mb-4">
              Aggiungi la prima carta: cerca il nome o il numero e i dati si compilano da soli.
            </p>
            <Button as={Link} to="/cards/new" size="lg">
              Aggiungi la prima carta
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* In alto le due risposte che contano: quanto vale la collezione e se, tutto compreso, ci stai guadagnando */}
          <Card className="mb-3 cv-hero-stat cv-holo-border">
            <Card.Body className="p-4">
              <Row className="g-4 align-items-end">
                <Col md={7}>
                  <div className="text-secondary mb-1">Valore della collezione</div>
                  <div className="cv-hero-value cv-holo-text">{formatEuro(stats.inventoryValue)}</div>
                  <div className="small text-secondary mt-1">
                    {stats.distinctCards} {stats.distinctCards === 1 ? 'carta' : 'carte'} · {stats.totalCopies}{' '}
                    {stats.totalCopies === 1 ? 'copia' : 'copie'} · valore stimato × copie possedute
                  </div>
                </Col>
                <Col md={5} className="cv-hero-side">
                  <div className="text-secondary mb-1">Guadagno complessivo</div>
                  <div className="cv-stat-value fs-2">{signed(balance)}</div>
                  <div
                    className={`small mt-1 ${balance > 0 ? 'cv-tone-positive' : balance < 0 ? 'cv-tone-negative' : 'text-secondary'}`}
                  >
                    {balance > 0 ? '▲ sei in guadagno' : balance < 0 ? '▼ sei in perdita' : 'in pari'}
                    <span className="text-secondary"> · valore delle carte + incassato − speso</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* I movimenti di denaro: dati neutri, il giudizio lo dà il guadagno complessivo qui sopra */}
          <Row xs={1} sm={3} className="g-3 mb-4">
            <Col>
              <StatTile label="Speso" value={formatEuro(stats.totalSpent)} detail="totale degli acquisti" />
            </Col>
            <Col>
              <StatTile label="Incassato" value={formatEuro(stats.totalRevenue)} detail="totale delle vendite" />
            </Col>
            <Col>
              <StatTile
                label="Saldo di cassa"
                value={signed(margin)}
                detail="incassato − speso, senza contare le carte che hai ancora"
              />
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={7}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3">
                  <h2 className="h5 mb-0">Ultime transazioni</h2>
                  <Link to="/transactions" className="cv-hit small">
                    Vedi tutte →
                  </Link>
                </Card.Header>
                {transactions.length === 0 ? (
                  <Card.Body className="text-secondary">
                    Nessuna transazione ancora. Registra un acquisto o una vendita dal dettaglio di una carta.
                  </Card.Body>
                ) : (
                  <ListGroup variant="flush">
                    {transactions.map((t) => (
                      <ListGroup.Item
                        key={t.id}
                        className="d-flex justify-content-between align-items-center gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <Link to={`/cards/${t.cardId}`} className="text-reset fw-semibold d-block text-truncate">
                            {t.cardName}
                          </Link>
                          <div className="small text-secondary">
                            {formatDate(t.date)} · {t.quantity} × {formatEuro(t.unitPrice)}
                          </div>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <TransactionTypeBadge type={t.type} />
                          <div className="fw-semibold mt-1">{formatEuro(t.total)}</div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent py-3">
                  <h2 className="h5 mb-0">Carte di maggior valore</h2>
                  <Link to="/cards" className="cv-hit small">
                    Inventario →
                  </Link>
                </Card.Header>
                <ListGroup variant="flush">
                  {topCards.map((c, i) => (
                    <ListGroup.Item key={c.id} className="d-flex align-items-center gap-3 py-2">
                      <span className="text-secondary small cv-rank">{i + 1}</span>
                      <CardImage src={c.imageUrl} alt={c.name} className="cv-thumb flex-shrink-0" />
                      <div className="min-w-0 flex-grow-1">
                        <Link to={`/cards/${c.id}`} className="text-reset fw-semibold d-block text-truncate">
                          {c.name}
                        </Link>
                        <div className="small text-secondary text-truncate">
                          {[c.setName, c.cardNumber].filter(Boolean).join(' · ') || '—'} · ×{c.quantity}
                        </div>
                      </div>
                      <span className="fw-semibold flex-shrink-0">{formatEuro(c.estimatedValue)}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  )
}
