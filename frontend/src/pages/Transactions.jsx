import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import AppPagination from '../components/AppPagination'
import ConfirmModal from '../components/ConfirmModal'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import TransactionTypeBadge from '../components/TransactionTypeBadge'
import { api } from '../lib/api'
import { formatDate, formatEuro, todayIso } from '../lib/format'

const PAGE_SIZE = 20
const NO_FILTERS = { type: '', from: '', to: '' }

// Storico di acquisti e vendite di tutte le carte, con filtri per tipo e periodo
export default function Transactions() {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toUndo, setToUndo] = useState(null)
  const [undoing, setUndoing] = useState(false)
  const [undoError, setUndoError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(
    () =>
      filters.from && filters.to && filters.from > filters.to
        ? Promise.resolve().then(() => setLoading(false))
        : api
            .transactions({ ...filters, page, size: PAGE_SIZE })
            .then((d) => {
              setData(d)
              setError(null)
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false)),
    [filters, page],
  )

  useEffect(() => {
    load()
  }, [load])

  // Cambiando un filtro si riparte dalla prima pagina
  const changeFilter = (e) => {
    setLoading(true)
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }))
    setPage(0)
  }

  const resetFilters = () => {
    setLoading(true)
    setFilters(NO_FILTERS)
    setPage(0)
  }

  const changePage = (p) => {
    setLoading(true)
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUndo = async () => {
    setUndoing(true)
    setUndoError(null)
    try {
      await api.deleteTransaction(toUndo.id)
      setToUndo(null)
      setNotice(`Transazione di ${toUndo.cardName} annullata, copie ripristinate.`)
      await load()
    } catch (e) {
      setUndoError(e.message)
    } finally {
      setUndoing(false)
    }
  }

  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS)
  const invalidRange = filters.from && filters.to && filters.from > filters.to
  const items = data?.content ?? []

  return (
    <>
      <div className="mb-4">
        <h1 className="h2 mb-0">Transazioni</h1>
        <span className="text-secondary small">
          {data ? `${data.totalElements} ${data.totalElements === 1 ? 'transazione' : 'transazioni'}` : ' '}
          {data && filtered && (data.totalElements === 1 ? ' trovata' : ' trovate')}
        </span>
      </div>

      <Form className="mb-4" onSubmit={(e) => e.preventDefault()}>
        <Row className="g-2 align-items-end">
          <Col xs={12} md={4}>
            <Form.Label className="small text-secondary mb-1" htmlFor="filter-type">
              Tipo
            </Form.Label>
            <Form.Select id="filter-type" name="type" value={filters.type} onChange={changeFilter}>
              <option value="">Acquisti e vendite</option>
              <option value="BUY">Solo acquisti</option>
              <option value="SELL">Solo vendite</option>
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small text-secondary mb-1" htmlFor="filter-from">
              Dal
            </Form.Label>
            <Form.Control
              id="filter-from"
              type="date"
              name="from"
              max={todayIso()}
              value={filters.from}
              onChange={changeFilter}
            />
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small text-secondary mb-1" htmlFor="filter-to">
              Al
            </Form.Label>
            <Form.Control
              id="filter-to"
              type="date"
              name="to"
              max={todayIso()}
              value={filters.to}
              onChange={changeFilter}
            />
          </Col>
          <Col xs={12} md={2}>
            {filtered && (
              <Button variant="outline-secondary" className="w-100" onClick={resetFilters}>
                Azzera filtri
              </Button>
            )}
          </Col>
        </Row>
      </Form>

      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {/* La data iniziale dopo quella finale la rifiuta anche il backend: qui lo diciamo con parole chiare */}
      {invalidRange ? (
        <Alert variant="warning">La data "Dal" deve essere precedente alla data "Al".</Alert>
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : loading && !data ? (
        <Loader text="Carico le transazioni..." />
      ) : items.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-4 mb-3" aria-hidden="true">
            {filtered ? '🔎' : '💶'}
          </div>
          {filtered ? (
            <>
              <h2 className="h5">Nessuna transazione nel periodo scelto</h2>
              <Button variant="link" onClick={resetFilters}>
                Azzera filtri
              </Button>
            </>
          ) : (
            <>
              <h2 className="h5">Nessuna transazione registrata</h2>
              <p className="text-secondary">
                Apri una carta dell'inventario e usa "Registra acquisto" o "Registra vendita".
              </p>
              <Button as={Link} to="/cards">
                Vai all'inventario
              </Button>
            </>
          )}
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {/* Computer e tablet: tabella completa */}
          <Card className="d-none d-md-block">
            <Table hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Carta</th>
                  <th>Tipo</th>
                  <th className="text-end">Copie</th>
                  <th className="text-end">Prezzo</th>
                  <th className="text-end">Totale</th>
                  <th>Piattaforma</th>
                  <th>Controparte</th>
                  <th>
                    <span className="visually-hidden">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className="text-nowrap">{formatDate(t.date)}</td>
                    <td>
                      <Link to={`/cards/${t.cardId}`} className="text-reset fw-semibold">
                        {t.cardName}
                      </Link>
                    </td>
                    <td>
                      <TransactionTypeBadge type={t.type} />
                    </td>
                    <td className="text-end">{t.quantity}</td>
                    <td className="text-end text-nowrap">{formatEuro(t.unitPrice)}</td>
                    <td className="text-end text-nowrap fw-semibold">{formatEuro(t.total)}</td>
                    <td>{t.platform ?? '—'}</td>
                    <td>{t.counterparty ?? '—'}</td>
                    <td className="text-end">
                      <Button variant="link" size="sm" className="cv-hit text-danger px-0" onClick={() => setToUndo(t)}>
                        Annulla
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Telefono: una riga compatta per transazione */}
          <div className="d-md-none d-flex flex-column gap-2">
            {items.map((t) => (
              <Card key={t.id}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="min-w-0">
                      <Link to={`/cards/${t.cardId}`} className="text-reset fw-semibold d-block text-truncate">
                        {t.cardName}
                      </Link>
                      <div className="small text-secondary">
                        {formatDate(t.date)}
                        {t.platform && ` · ${t.platform}`}
                      </div>
                    </div>
                    <TransactionTypeBadge type={t.type} />
                  </div>
                  <div className="d-flex justify-content-between align-items-end mt-2">
                    <span className="small text-secondary">
                      {t.quantity} × {formatEuro(t.unitPrice)}
                      {t.counterparty && ` · ${t.counterparty}`}
                    </span>
                    <span className="fw-bold">{formatEuro(t.total)}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="cv-hit text-danger px-0 mt-1"
                    onClick={() => setToUndo(t)}
                  >
                    Annulla
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>

          <AppPagination page={page} totalPages={data.totalPages} onChange={changePage} />
        </div>
      )}

      <ConfirmModal
        show={toUndo !== null}
        title="Annullare la transazione?"
        confirmLabel="Annulla transazione"
        loading={undoing}
        onConfirm={handleUndo}
        onCancel={() => {
          setToUndo(null)
          setUndoError(null)
        }}
      >
        {toUndo && (
          <p className="mb-0">
            {toUndo.type === 'BUY' ? "L'acquisto" : 'La vendita'} di <strong>{toUndo.quantity}</strong>{' '}
            {toUndo.quantity === 1 ? 'copia' : 'copie'} di <strong>{toUndo.cardName}</strong> del{' '}
            {formatDate(toUndo.date)} verrà {toUndo.type === 'BUY' ? 'eliminato' : 'eliminata'} e le copie possedute{' '}
            {toUndo.type === 'BUY' ? 'diminuiranno' : 'aumenteranno'} di {toUndo.quantity}.
          </p>
        )}
        <ErrorMessage message={undoError} className="mt-3 mb-0" />
      </ConfirmModal>
    </>
  )
}
