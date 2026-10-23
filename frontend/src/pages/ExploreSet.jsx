import { useEffect, useState } from 'react'
import { Col, Form, InputGroup, Row } from 'react-bootstrap'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CatalogCard from '../components/CatalogCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import SetLogo from '../components/SetLogo'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'

// Pagina pubblica di un set: logo, dati e tutte le carte, con un filtro per nome o numero
export default function ExploreSet() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const lang = params.get('lang') ?? 'it'
  const [set, setSet] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let current = true
    api
      .externalSet(id, lang)
      .then((s) => current && setSet(s))
      .catch((e) => current && setError(e.message))
    return () => {
      current = false
    }
  }, [id, lang])

  const back = `/explore?lang=${lang}${set?.seriesId ? `&serie=${set.seriesId}` : ''}`

  if (error) {
    return (
      <>
        <Link to={back} className="small text-secondary text-decoration-none">
          ← Torna al catalogo
        </Link>
        <ErrorMessage message={error} className="mt-3" />
      </>
    )
  }
  if (!set) return <Loader text="Carico il set..." />

  const text = filter.trim().toLowerCase()
  const cards = text
    ? set.cards.filter((c) => c.name.toLowerCase().includes(text) || c.number.toLowerCase().includes(text))
    : set.cards
  const secret = set.totalCount != null && set.officialCount != null ? set.totalCount - set.officialCount : 0

  return (
    <>
      <Link to={back} className="small text-secondary text-decoration-none">
        ← {set.seriesName ?? 'Torna al catalogo'}
      </Link>

      <div className="d-flex align-items-center gap-4 flex-wrap mt-3 mb-4">
        <SetLogo key={set.logoUrl} url={set.logoUrl} name={set.name} large hideIfMissing />
        <div>
          <h1 className="h2 mb-1">{set.name}</h1>
          <div className="text-secondary">
            {[
              set.seriesName,
              set.releaseDate && `uscito il ${formatDate(set.releaseDate)}`,
              set.officialCount != null && `${set.officialCount} carte${secret > 0 ? ` + ${secret} segrete` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      </div>

      <InputGroup className="mb-4" style={{ maxWidth: 420 }}>
        <InputGroup.Text aria-hidden="true">🔍</InputGroup.Text>
        <Form.Control
          type="search"
          placeholder="Filtra per nome o numero"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtra le carte del set"
        />
      </InputGroup>

      {cards.length === 0 ? (
        <p className="text-secondary">Nessuna carta corrisponde al filtro.</p>
      ) : (
        <Row xs={3} md={4} lg={6} className="g-2 g-sm-3">
          {cards.map((card) => (
            <Col key={card.externalId}>
              <CatalogCard card={card} lang={lang} />
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}
