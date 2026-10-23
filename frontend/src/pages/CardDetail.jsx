import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Row, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CardBadges from '../components/CardBadges'
import CardImage from '../components/CardImage'
import TiltCard from '../components/TiltCard'
import ConfirmModal from '../components/ConfirmModal'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import MarketPriceChart from '../components/MarketPriceChart'
import TransactionChart from '../components/TransactionChart'
import TransactionModal from '../components/TransactionModal'
import TransactionTypeBadge from '../components/TransactionTypeBadge'
import { api } from '../lib/api'
import { condition, formatDate, formatEuro, languageLabel, tcgdexLanguage } from '../lib/format'

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  // Modale "Registra acquisto/vendita"
  const [showTx, setShowTx] = useState(false)
  const [txType, setTxType] = useState('BUY')
  // Transazione da annullare (in attesa di conferma)
  const [txToUndo, setTxToUndo] = useState(null)
  const [undoing, setUndoing] = useState(false)
  const [undoError, setUndoError] = useState(null)
  const [notice, setNotice] = useState(null)
  // Prezzi di Cardmarket per il grafico: solo per le carte aggiunte dal catalogo (con l'id di TCGdex)
  const [market, setMarket] = useState(null)

  const load = useCallback(
    () =>
      api
        .card(id)
        .then(setData)
        .catch((e) => (e.status === 404 ? setNotFound(true) : setError(e.message))),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  const externalId = data?.card.externalId
  const language = data?.card.language
  useEffect(() => {
    if (!externalId) return
    let current = true
    // Se il catalogo non risponde il grafico del mercato semplicemente non compare
    api
      .externalCard(externalId, tcgdexLanguage(language))
      .then((c) => current && setMarket(c.market))
      .catch(() => current && setMarket(null))
    return () => {
      current = false
    }
  }, [externalId, language])

  const retry = () => {
    setError(null)
    load()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.deleteCard(id)
      navigate('/cards', { replace: true })
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  const openTx = (type) => {
    setTxType(type)
    setShowTx(true)
  }

  // Dopo un acquisto o una vendita ricarichiamo la carta: le copie le ha aggiornate il backend
  const handleTxSaved = async (t) => {
    setShowTx(false)
    await load()
    const copies = `${t.quantity} ${t.quantity === 1 ? 'copia' : 'copie'}`
    setNotice(t.type === 'BUY' ? `Acquisto di ${copies} registrato.` : `Vendita di ${copies} registrata.`)
  }

  const handleUndo = async () => {
    setUndoing(true)
    setUndoError(null)
    try {
      await api.deleteTransaction(txToUndo.id)
      setTxToUndo(null)
      await load()
      setNotice('Transazione annullata, copie ripristinate.')
    } catch (e) {
      setUndoError(e.message)
    } finally {
      setUndoing(false)
    }
  }

  if (notFound) {
    return (
      <div className="text-center py-5">
        <h1 className="h4">Carta non trovata</h1>
        <p className="text-secondary">Forse è stata eliminata.</p>
        <Button as={Link} to="/cards" variant="outline-primary">
          Torna all'inventario
        </Button>
      </div>
    )
  }
  if (error) return <ErrorMessage message={error} onRetry={retry} />
  if (!data) return <Loader />

  const { card, transactions } = data
  const totalValue = card.estimatedValue != null ? card.estimatedValue * card.quantity : null

  const details = [
    ['Set', card.setName ?? '—'],
    ['Numero', card.cardNumber ?? '—'],
    ['Lingua', languageLabel(card.language)],
    ['Condizione', condition(card.condition).label],
    ['Gradazione', card.graded ? `${card.gradingCompany} ${card.grade}` : 'Non gradata'],
    ['Copie possedute', card.quantity],
    ['Valore per copia', formatEuro(card.estimatedValue)],
  ]

  return (
    <>
      <Link to="/cards" className="cv-hit small text-secondary text-decoration-none">
        ← Torna all'inventario
      </Link>

      <Row className="g-4 mt-1">
        <Col md={5} lg={4}>
          <TiltCard className="cv-card-image-lg mx-auto">
            <CardImage src={card.imageUrl} alt={card.name} />
          </TiltCard>
        </Col>
        <Col md={7} lg={8}>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
            <div>
              <h1 className="h2 mb-2">{card.name}</h1>
              <CardBadges card={card} />
            </div>
            <div className="d-flex gap-2">
              <Button as={Link} to={`/cards/${card.id}/edit`} variant="outline-primary">
                Modifica
              </Button>
              <Button variant="outline-danger" onClick={() => setConfirmDelete(true)}>
                Elimina
              </Button>
            </div>
          </div>

          {/* Grafici in alto, subito sotto il nome: si vedono senza scorrere la pagina */}
          {(transactions.length > 0 || market) && (
            <Row xs={1} xl={transactions.length > 0 && market ? 2 : 1} className="g-3 mt-2">
              {transactions.length > 0 && (
                <Col>
                  <Card className="h-100">
                    <Card.Body>
                      <h2 className="h6 mb-3">I tuoi acquisti e vendite (prezzo per copia)</h2>
                      <TransactionChart transactions={transactions} estimatedValue={card.estimatedValue} />
                    </Card.Body>
                  </Card>
                </Col>
              )}
              {market && (
                <Col>
                  <Card className="h-100">
                    <Card.Body>
                      <h2 className="h6 mb-3">Prezzo su Cardmarket</h2>
                      <MarketPriceChart market={market} />
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}

          <Card className="mt-3">
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
                  <tr>
                    <th scope="row" className="text-secondary fw-normal w-50">
                      Valore totale
                    </th>
                    <td className="fw-bold fs-5">{formatEuro(totalValue)}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button className="flex-grow-1" onClick={() => openTx('BUY')}>
              + Registra acquisto
            </Button>
            <Button
              variant="outline-success"
              className="flex-grow-1"
              onClick={() => openTx('SELL')}
              disabled={card.quantity === 0}
              title={card.quantity === 0 ? 'Non possiedi copie da vendere' : undefined}
            >
              − Registra vendita
            </Button>
          </div>

          {card.notes && (
            <Card className="mt-3">
              <Card.Body>
                <h2 className="h6 text-secondary">Note</h2>
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                  {card.notes}
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <section className="mt-5">
        <h2 className="h4 mb-3">Storico acquisti e vendite</h2>
        {notice && (
          <Alert variant="success" dismissible onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
        {transactions.length === 0 ? (
          <p className="text-secondary">Nessuna transazione registrata per questa carta.</p>
        ) : (
          <Card>
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Data</th>
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
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="text-nowrap">{formatDate(t.date)}</td>
                    <td>
                      <TransactionTypeBadge type={t.type} />
                    </td>
                    <td className="text-end">{t.quantity}</td>
                    <td className="text-end text-nowrap">{formatEuro(t.unitPrice)}</td>
                    <td className="text-end text-nowrap fw-semibold">{formatEuro(t.total)}</td>
                    <td>{t.platform ?? '—'}</td>
                    <td>{t.counterparty ?? '—'}</td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        size="sm"
                        className="cv-hit text-danger px-0"
                        onClick={() => setTxToUndo(t)}
                        aria-label="Annulla transazione"
                        title="Annulla transazione"
                      >
                        Annulla
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </section>

      <ConfirmModal
        show={confirmDelete}
        title="Eliminare la carta?"
        confirmLabel="Elimina"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDelete(false)
          setDeleteError(null)
        }}
      >
        <p className="mb-0">
          Stai per eliminare <strong>{card.name}</strong>
          {transactions.length > 0 && (
            <>
              {' '}
              e le sue <strong>{transactions.length}</strong>{' '}
              {transactions.length === 1 ? 'transazione' : 'transazioni'}
            </>
          )}
          . L'operazione non si può annullare.
        </p>
        <ErrorMessage message={deleteError} className="mt-3 mb-0" />
      </ConfirmModal>

      <TransactionModal
        show={showTx}
        card={card}
        defaultType={txType}
        onHide={() => setShowTx(false)}
        onSaved={handleTxSaved}
      />

      <ConfirmModal
        show={txToUndo !== null}
        title="Annullare la transazione?"
        confirmLabel="Annulla transazione"
        loading={undoing}
        onConfirm={handleUndo}
        onCancel={() => {
          setTxToUndo(null)
          setUndoError(null)
        }}
      >
        {txToUndo && (
          <p className="mb-0">
            {txToUndo.type === 'BUY' ? "L'acquisto" : 'La vendita'} di <strong>{txToUndo.quantity}</strong>{' '}
            {txToUndo.quantity === 1 ? 'copia' : 'copie'} del {formatDate(txToUndo.date)} verrà{' '}
            {txToUndo.type === 'BUY' ? 'eliminato' : 'eliminata'} e le copie possedute{' '}
            {txToUndo.type === 'BUY' ? 'diminuiranno' : 'aumenteranno'} di {txToUndo.quantity}.
          </p>
        )}
        <ErrorMessage message={undoError} className="mt-3 mb-0" />
      </ConfirmModal>
    </>
  )
}
