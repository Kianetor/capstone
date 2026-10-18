import { useEffect, useState } from 'react'
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { CONDITIONS, LANGUAGES, SORT_OPTIONS } from '../lib/format'
import { DEFAULT_FILTERS, resetFilters, setFilters } from '../store/cardsSlice'

// Ricerca e filtri dell'inventario, salvati nello slice cards
export default function FilterBar() {
  const dispatch = useDispatch()
  const filters = useSelector((state) => state.cards.filters)
  const [text, setText] = useState(filters.q)
  const [lastQ, setLastQ] = useState(filters.q)

  // Se la ricerca cambia da fuori (es. "Azzera filtri" nella pagina) aggiorniamo anche il campo di testo
  if (filters.q !== lastQ) {
    setLastQ(filters.q)
    setText(filters.q)
  }

  // La ricerca testuale parte 400 ms dopo l'ultimo tasto: niente una chiamata per ogni lettera
  useEffect(() => {
    if (text === filters.q) return
    const timer = setTimeout(() => dispatch(setFilters({ q: text })), 400)
    return () => clearTimeout(timer)
  }, [text, filters.q, dispatch])

  const change = (e) => dispatch(setFilters({ [e.target.name]: e.target.value }))

  const reset = () => {
    setText('')
    dispatch(resetFilters())
  }

  const active = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <Form className="mb-4" onSubmit={(e) => e.preventDefault()}>
      <Row className="g-2">
        <Col xs={12} lg={3}>
          <InputGroup>
            <InputGroup.Text aria-hidden="true">🔍</InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Cerca per nome, set o numero"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Cerca nell'inventario"
            />
          </InputGroup>
        </Col>
        <Col xs={6} md={3} lg={2}>
          <Form.Select name="language" value={filters.language} onChange={change} aria-label="Lingua">
            <option value="">Tutte le lingue</option>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={3} lg={2}>
          <Form.Select name="condition" value={filters.condition} onChange={change} aria-label="Condizione">
            <option value="">Ogni condizione</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={3} lg={2}>
          <Form.Select name="graded" value={filters.graded} onChange={change} aria-label="Gradazione">
            <option value="">Gradate e non</option>
            <option value="true">Solo gradate</option>
            <option value="false">Non gradate</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={3} lg={3}>
          <Form.Select name="sort" value={filters.sort} onChange={change} aria-label="Ordina per">
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      {active && (
        <Button variant="link" size="sm" className="px-0 mt-2" onClick={reset}>
          Azzera filtri
        </Button>
      )}
    </Form>
  )
}
