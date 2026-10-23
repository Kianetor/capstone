import { useState } from 'react'
import { formatDate, formatEuro } from '../lib/format'
import { niceTicks, useWidth } from '../lib/useWidth'

const HEIGHT = 200
const PAD = { top: 24, right: 12, bottom: 28, left: 52 }
const BAR = 24 // larghezza massima di una colonna: il resto dello spazio resta vuoto

// Prezzo della carta su Cardmarket: media a 30 giorni, a 7 giorni e dell'ultimo giorno, più il prezzo minimo.
// TCGdex non dà lo storico, quindi sono colonne (medie su periodi diversi) e non una linea nel tempo
export default function MarketPriceChart({ market }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)

  const bars = [
    { label: 'Media 30 giorni', short: '30 giorni', value: market.avg30 },
    { label: 'Media 7 giorni', short: '7 giorni', value: market.avg7 },
    { label: 'Media ultimo giorno', short: 'Ultimo giorno', value: market.avg1 },
  ].filter((b) => b.value != null)

  const ticks = niceTicks(Math.max(...bars.map((b) => b.value), market.low ?? 0))
  const top = ticks[ticks.length - 1]
  const plotW = Math.max(width - PAD.left - PAD.right, 0)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const y = (v) => PAD.top + plotH - (v / top) * plotH
  const slot = plotW / bars.length
  const barW = Math.min(BAR, slot * 0.6)

  return (
    <figure className="cv-chart mb-0">
      {market.low != null && (
        <div className="d-flex align-items-center gap-1 small text-secondary mb-2">
          <svg width="16" height="12" aria-hidden="true">
            <line x1="0" x2="16" y1="6" y2="6" className="cv-chart-ref" />
          </svg>
          Prezzo più basso in vendita: {formatEuro(market.low)}
        </div>
      )}
      <div ref={ref} className="position-relative">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Prezzi medi su Cardmarket">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="cv-chart-grid" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="cv-chart-tick">
                  {formatEuro(t).replace(',00', '')}
                </text>
              </g>
            ))}
            {market.low != null && (
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(market.low)}
                y2={y(market.low)}
                className="cv-chart-ref"
              />
            )}
            {bars.map((b, i) => {
              const cx = PAD.left + slot * i + slot / 2
              const h = Math.max(y(0) - y(b.value), 2)
              const r = Math.min(4, h / 2)
              const x = cx - barW / 2
              const yTop = y(b.value)
              // Angoli arrotondati solo in cima: la colonna parte "piatta" dalla base
              const path = `M${x} ${y(0)} V${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} H${x + barW - r} Q${x + barW} ${yTop} ${x + barW} ${yTop + r} V${y(0)} Z`
              return (
                <g
                  key={b.label}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => setHover(i)}
                >
                  <rect x={cx - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent" />
                  <path d={path} className="cv-chart-bar" opacity={hover === null || hover === i ? 1 : 0.55} />
                  <text x={cx} y={yTop - 6} textAnchor="middle" className="cv-chart-value">
                    {formatEuro(b.value)}
                  </text>
                  <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="cv-chart-tick">
                    {b.short}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
        {hover !== null && (
          <div
            className="cv-chart-tooltip"
            style={{ left: PAD.left + slot * hover + slot / 2, top: y(bars[hover].value) }}
          >
            <div className="small text-secondary">{bars[hover].label}</div>
            <div className="fw-bold">{formatEuro(bars[hover].value)}</div>
          </div>
        )}
      </div>
      <figcaption className="small text-secondary mt-2">
        Prezzi di vendita su Cardmarket{market.updated && `, aggiornati il ${formatDate(market.updated)}`}.
      </figcaption>
      <table className="visually-hidden">
        <caption>Prezzi medi su Cardmarket</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{formatEuro(b.value)}</td>
            </tr>
          ))}
          {market.low != null && (
            <tr>
              <th scope="row">Prezzo minimo</th>
              <td>{formatEuro(market.low)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </figure>
  )
}
