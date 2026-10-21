import { useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import ExternalSearch from '../components/ExternalSearch'
import Loader from '../components/Loader'
import SetTile from '../components/SetTile'
import { api } from '../lib/api'
import { CATALOG_LANGUAGES } from '../lib/format'

// Catalogo pubblico: ricerca carte e tutte le serie con i loro set. Lingua e serie scelte stanno nell'indirizzo
export default function Explore() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const lang = params.get('lang') ?? 'it'
  const [series, setSeries] = useState(null)
  const [seriesError, setSeriesError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState(null)

  // Elenco delle serie nella lingua scelta
  useEffect(() => {
    let current = true
    api
      .series(lang)
      .then((s) => current && setSeries(s))
      .catch((e) => current && setSeriesError(e.message))
    return () => {
      current = false
    }
  }, [lang])

  // Serie selezionata: quella nell'indirizzo, altrimenti la più recente
  const selected = series ? (series.find((s) => s.id === params.get('serie')) ?? series[0]) : null

  useEffect(() => {
    if (!selected) return
    let current = true
    api
      .seriesDetail(selected.id, lang)
      .then((d) => current && setDetail(d))
      .catch((e) => current && setDetailError(e.message))
    return () => {
      current = false
    }
  }, [selected?.id, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const changeLanguage = (e) => {
    setSeries(null)
    setDetail(null)
    setSeriesError(null)
    setDetailError(null)
    update({ lang: e.target.value, serie: null })
  }

  const chooseSeries = (id) => {
    setDetail(null)
    setDetailError(null)
    update({ serie: id })
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h2 mb-1">Esplora le carte</h1>
        <p className="text-secondary mb-0">
          Cerca qualsiasi carta Pokémon o sfoglia le espansioni: prezzi di mercato compresi, anche senza account.
        </p>
      </div>

      <Card className="mb-5">
        <Card.Body>
          <ExternalSearch
            key={params.get('q') ?? ''}
            defaultLanguage={lang}
            hint={
              <>
                Per nome (<em>Charizard</em>), per numero stampato sulla carta (<em>4/102</em>) o per entrambi (
                <em>Charizard 4/102</em>). Clicca una carta per vederne immagine, rarità e prezzo.
              </>
            }
            initialQuery={params.get('q') ?? ''}
            onPick={(externalId, language) =>
              navigate(`/explore/cards/${encodeURIComponent(externalId)}?lang=${language}`)
            }
          />
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="h4 mb-0">Serie ed espansioni</h2>
        <Form.Select value={lang} onChange={changeLanguage} aria-label="Lingua del catalogo" style={{ width: 'auto' }}>
          {CATALOG_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </Form.Select>
      </div>

      {seriesError ? (
        <ErrorMessage message={seriesError} />
      ) : !series ? (
        <Loader text="Carico le serie..." />
      ) : (
        <>
          {/* Le serie come pulsanti scorrevoli in orizzontale, dalla più recente */}
          <div className="cv-series-strip mb-4" role="tablist" aria-label="Serie">
            {series.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === selected?.id}
                className={`cv-series-pill ${s.id === selected?.id ? 'active' : ''}`}
                onClick={() => chooseSeries(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>

          {detailError ? (
            <ErrorMessage message={detailError} />
          ) : !detail ? (
            <Loader text="Carico i set..." />
          ) : (
            <>
              <p className="text-secondary small mb-3">
                {detail.name} · {detail.sets.length} {detail.sets.length === 1 ? 'espansione' : 'espansioni'}
              </p>
              <Row xs={2} sm={3} md={4} lg={6} className="g-3">
                {detail.sets.map((set) => (
                  <Col key={set.id}>
                    <SetTile set={set} lang={lang} />
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}
    </>
  )
}
