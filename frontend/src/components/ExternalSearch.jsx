import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, InputGroup, Row, Spinner } from 'react-bootstrap'
import { api } from '../lib/api'
import { LANGUAGES } from '../lib/format'
import CardImage from './CardImage'

// Lingue di ricerca su TCGdex (coreano e cinese non sono disponibili)
const SEARCH_LANGUAGES = LANGUAGES.filter((l) => !['KOR', 'CHN'].includes(l.value))

// L'id di TCGdex è "codice set - numero" (es. base1-4, sm7.5-3): il codice distingue le carte con lo stesso nome
const setCode = (externalId) => externalId.slice(0, externalId.lastIndexOf('-')) || externalId

// Prima le carte con l'immagine: sono le più facili da riconoscere (sort è stabile, l'ordine resta)
const imagesFirst = (cards) => [...cards].sort((a, b) => Number(!a.thumbnailUrl) - Number(!b.thumbnailUrl))

// Ricerca nell'API esterna. Scelto un risultato:
// - con onSelect ne chiede il dettaglio e lo passa al form (aggiungi carta)
// - con onPick passa solo id e lingua (catalogo: si apre la pagina della carta)
// initialQuery fa partire subito una ricerca, es. arrivando dalla barra della landing page
export default function ExternalSearch({ defaultLanguage = 'it', onSelect, onPick, initialQuery = '', hint }) {
  const [q, setQ] = useState(initialQuery)
  const [lang, setLang] = useState(defaultLanguage)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(Boolean(initialQuery))
  // Le ricerche per nome arrivano a pagine da 30: "Mostra altri risultati" chiede la successiva
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectingId, setSelectingId] = useState(null)
  const [error, setError] = useState(null)
  // Dopo una ricerca riuscita il modulo si riduce a una riga: restano in vista solo le carte trovate
  const [collapsed, setCollapsed] = useState(false)
  const [lastSearch, setLastSearch] = useState(null)

  const showResults = (found, query, language) => {
    setResults(imagesFirst(found.results))
    setHasMore(found.hasMore)
    setPage(1)
    setLastSearch({ q: query, lang: language })
    setCollapsed(found.results.length > 0)
  }

  const showError = (err) => {
    setResults(null)
    setError(err.message)
  }

  // Ricerca iniziale (initialQuery): gli stati cambiano solo quando arriva la risposta
  useEffect(() => {
    const query = initialQuery.trim()
    if (query.length < 2) return
    api
      .searchExternal(query, defaultLanguage)
      .then((found) => showResults(found, query, defaultLanguage))
      .catch(showError)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo all'apertura della pagina
  }, [])

  const search = async (e) => {
    e.preventDefault()
    if (q.trim().length < 2) {
      setError('Scrivi almeno 2 caratteri')
      return
    }
    setLoading(true)
    setError(null)
    try {
      showResults(await api.searchExternal(q.trim(), lang), q.trim(), lang)
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  // Pagina successiva della stessa ricerca, aggiunta in fondo a quelle già mostrate
  const loadMore = async () => {
    setLoadingMore(true)
    setError(null)
    try {
      const found = await api.searchExternal(lastSearch.q, lastSearch.lang, page + 1)
      setResults((current) => {
        const known = new Set(current.map((r) => r.externalId))
        return [...current, ...imagesFirst(found.results.filter((r) => !known.has(r.externalId)))]
      })
      setHasMore(found.hasMore && found.results.length > 0)
      setPage(page + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const select = async (externalId) => {
    // La lingua è quella della ricerca fatta, anche se nel frattempo il menu è stato cambiato
    const language = lastSearch?.lang ?? lang
    if (onPick) {
      onPick(externalId, language)
      return
    }
    setSelectingId(externalId)
    setError(null)
    try {
      onSelect(await api.externalCard(externalId, language), language)
      setResults(null)
      setCollapsed(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSelectingId(null)
    }
  }

  const languageName = (code) => SEARCH_LANGUAGES.find((l) => l.tcgdex === code)?.label ?? code

  return (
    <div>
      {collapsed ? (
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <span>
            <span aria-hidden="true">🔍 </span>
            <strong>“{lastSearch.q}”</strong>
            <span className="text-secondary">
              {' '}
              · {languageName(lastSearch.lang)} · {results.length}
              {hasMore && '+'} {results.length === 1 ? 'risultato' : 'risultati'}
            </span>
          </span>
          <Button variant="outline-primary" size="sm" onClick={() => setCollapsed(false)}>
            Modifica ricerca
          </Button>
        </div>
      ) : (
        <>
          <h2 className="h6 mb-1">Cerca la carta</h2>
          <p className="text-secondary small mb-3">
            {hint ?? (
              <>
                Cerca per nome (<em>Charizard</em>), per numero stampato in basso sulla carta (<em>4/102</em>) o per
                entrambi (<em>Charizard 4/102</em>): i campi si compilano da soli, prezzo di mercato compreso.
              </>
            )}
          </p>
          <Form onSubmit={search}>
            <Row className="g-2">
              <Col xs={12} sm>
                <InputGroup>
                  <Form.Control
                    placeholder="Nome o numero, es. Charizard o 4/102"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Nome della carta da cercare"
                    autoFocus={lastSearch !== null}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : 'Cerca'}
                  </Button>
                </InputGroup>
              </Col>
              <Col xs={12} sm="auto">
                <Form.Select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Lingua della ricerca">
                  {SEARCH_LANGUAGES.map((l) => (
                    <option key={l.tcgdex} value={l.tcgdex}>
                      {l.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </>
      )}

      {error && (
        <Alert variant="warning" className="mt-3 mb-0 small">
          {error}
        </Alert>
      )}

      {results && results.length === 0 && (
        <p className="text-secondary small mt-3 mb-0">
          Nessuna carta trovata. Prova un altro nome, il numero stampato sulla carta o un'altra lingua, oppure compila i
          campi a mano.
        </p>
      )}

      {results && results.length > 0 && (
        <>
          <p className="text-secondary small mt-3 mb-2">
            Scegli la carta giusta per precompilare il form.
            {lang !== 'en' && ' Se mancano le immagini, prova la ricerca in inglese.'}
          </p>
          <div>
            <Row xs={3} md={4} lg={5} className="g-2 g-sm-3">
              {results.map((r) => (
                <Col key={r.externalId}>
                  <button
                    type="button"
                    className="cv-search-result"
                    onClick={() => select(r.externalId)}
                    disabled={selectingId !== null}
                    title={`${r.name} ${r.number ?? ''}`}
                  >
                    <CardImage src={r.thumbnailUrl} alt={r.name} />
                    <span className="d-block fw-semibold text-truncate mt-2">{r.name}</span>
                    <span className="d-block small text-secondary text-truncate">
                      {selectingId === r.externalId ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        `${setCode(r.externalId)} · #${r.number}`
                      )}
                    </span>
                  </button>
                </Col>
              ))}
            </Row>
          </div>
          {hasMore && (
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={loadMore} disabled={loadingMore || selectingId !== null}>
                {loadingMore ? <Spinner size="sm" animation="border" /> : 'Mostra altri risultati'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
