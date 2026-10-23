import { useEffect, useState } from 'react'
import { Button, Card, Col, Row, Table } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CardImage from '../components/CardImage'
import TiltCard from '../components/TiltCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import MarketPriceChart from '../components/MarketPriceChart'
import { api } from '../lib/api'
import { CATALOG_LANGUAGES, formatEuro } from '../lib/format'

// L'id di TCGdex è "codice set - numero": il codice porta alla pagina del set
const setIdOf = (externalId) => externalId.slice(0, externalId.lastIndexOf('-'))

// Pagina pubblica di una carta del catalogo, con il bottone per aggiungerla alla propria collezione
export default function ExploreCard() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const lang = params.get('lang') ?? 'it'
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [card, setCard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let current = true
    api
      .externalCard(id, lang)
      .then((c) => current && setCard(c))
      .catch((e) => current && setError(e.message))
    return () => {
      current = false
    }
  }, [id, lang])

  const setLink = `/explore/sets/${encodeURIComponent(setIdOf(id))}?lang=${lang}`

  if (error) {
    return (
      <>
        <Link to={`/explore?lang=${lang}`} className="small text-secondary text-decoration-none">
          ← Torna al catalogo
        </Link>
        <ErrorMessage message={error} className="mt-3" />
      </>
    )
  }
  if (!card) return <Loader text="Carico la carta..." />

  // Il form "Aggiungi carta" riceve la carta scelta e si compila da solo
  const addToCollection = () => navigate('/cards/new', { state: { external: { id: card.externalId, lang } } })

  const details = [
    [
      'Set',
      card.setName ? (
        <Link key="set" to={setLink}>
          {card.setName}
        </Link>
      ) : (
        '—'
      ),
    ],
    ['Numero', card.cardNumber ?? '—'],
    ['Rarità', card.rarity ?? '—'],
    ['Lingua', CATALOG_LANGUAGES.find((l) => l.code === lang)?.label ?? lang],
  ]

  return (
    <>
      <Link to={setLink} className="small text-secondary text-decoration-none">
        ← {card.setName ?? 'Torna al set'}
      </Link>

      <Row className="g-4 mt-1">
        <Col md={5} lg={4}>
          <TiltCard className="cv-card-image-lg mx-auto">
            <CardImage src={card.imageUrl} alt={card.name} />
          </TiltCard>
        </Col>
        <Col md={7} lg={8}>
          <h1 className="h2 mb-3">{card.name}</h1>

          <Card className="mb-3 cv-hero-stat">
            <Card.Body>
              <div className="text-secondary small mb-1">Prezzo medio su Cardmarket (ultimi 30 giorni)</div>
              <div className="cv-stat-value fs-2">{formatEuro(card.marketPrice)}</div>
              <div className="small text-secondary mt-1">
                {card.marketPrice != null
                  ? 'aggiornato ogni giorno da TCGdex'
                  : 'prezzo non disponibile per questa carta'}
              </div>
            </Card.Body>
          </Card>

          {card.market && (
            <Card className="mb-3">
              <Card.Body>
                <h2 className="h6 mb-3">Andamento del prezzo su Cardmarket</h2>
                <MarketPriceChart market={card.market} />
              </Card.Body>
            </Card>
          )}

          <Card className="mb-3">
            <Card.Body className="p-0">
              <Table className="mb-0 cv-details-table" borderless>
                <tbody>
                  {details.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row" className="text-secondary fw-normal w-50">
                        {label}
                      </th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {user ? (
            <Button size="lg" className="w-100" onClick={addToCollection}>
              + Aggiungi alla mia collezione
            </Button>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p className="mb-3">Ce l'hai? Crea un account gratuito per tenerla nella tua collezione.</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button as={Link} to="/register">
                    Registrati
                  </Button>
                  <Button
                    as={Link}
                    to="/login"
                    state={{ from: `/explore/cards/${id}?lang=${lang}` }}
                    variant="outline-primary"
                  >
                    Accedi
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  )
}
