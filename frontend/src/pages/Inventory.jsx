import { useEffect, useState } from 'react'
import { Alert, Button, Col, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppPagination from '../components/AppPagination'
import CardItem from '../components/CardItem'
import ErrorMessage from '../components/ErrorMessage'
import FilterBar from '../components/FilterBar'
import Loader from '../components/Loader'
import { DEFAULT_FILTERS, fetchCards, resetFilters, setPage } from '../store/cardsSlice'

export default function Inventory() {
  const dispatch = useDispatch()
  const { items, page, totalPages, totalElements, filters, loading, error } = useSelector((state) => state.cards)
  const location = useLocation()
  const navigate = useNavigate()
  // Nome della carta appena aggiunta (arriva dal form): mostriamo la conferma una volta sola
  const [added, setAdded] = useState(location.state?.added ?? null)
  const [purchased] = useState(Boolean(location.state?.purchased))

  // Togliamo il messaggio dalla cronologia: ricaricando la pagina o tornando indietro non ricompare
  useEffect(() => {
    if (location.state?.added) navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  // Ricarichiamo a ogni cambio di filtri o pagina (e quando si torna sulla pagina)
  useEffect(() => {
    dispatch(fetchCards())
  }, [filters, page, dispatch])

  const changePage = (p) => {
    dispatch(setPage(p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-0">Inventario</h1>
          <span className="text-secondary small">
            {totalElements} {totalElements === 1 ? 'carta' : 'carte'}
            {filtered && (totalElements === 1 ? ' trovata' : ' trovate')}
          </span>
        </div>
        <Button as={Link} to="/cards/new">
          + Aggiungi carta
        </Button>
      </div>

      {added && (
        <Alert variant="success" dismissible onClose={() => setAdded(null)}>
          <strong>{added}</strong> aggiunta all'inventario{purchased && ' e acquisto registrato'}.
        </Alert>
      )}

      <FilterBar />

      <ErrorMessage message={error} onRetry={() => dispatch(fetchCards())} />

      {loading && items.length === 0 ? (
        <Loader text="Carico l'inventario..." />
      ) : items.length === 0 && !error ? (
        <EmptyState filtered={filtered} onReset={() => dispatch(resetFilters())} />
      ) : (
        // Durante il cambio pagina lasciamo visibili le carte vecchie, un po' trasparenti
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <Row xs={3} md={4} lg={5} xl={6} className="g-2 g-sm-3">
            {items.map((card) => (
              <Col key={card.id}>
                <CardItem card={card} />
              </Col>
            ))}
          </Row>
          <AppPagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      )}
    </>
  )
}

function EmptyState({ filtered, onReset }) {
  return (
    <div className="text-center py-5">
      <div className="display-4 mb-3" aria-hidden="true">
        {filtered ? '🔎' : '🗂️'}
      </div>
      {filtered ? (
        <>
          <h2 className="h5">Nessuna carta corrisponde ai filtri</h2>
          <Button variant="link" onClick={onReset}>
            Azzera filtri
          </Button>
        </>
      ) : (
        <>
          <h2 className="h5">Il tuo inventario è vuoto</h2>
          <p className="text-secondary">Aggiungi la prima carta della tua collezione.</p>
          <Button as={Link} to="/cards/new">
            + Aggiungi carta
          </Button>
        </>
      )}
    </div>
  )
}
