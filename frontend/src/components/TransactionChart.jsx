import { useState } from 'react'
import { formatDate, formatEuro } from '../lib/format'
import { niceTicks, useWidth } from '../lib/useWidth'

const HEIGHT = 220
const PAD = { top: 20, right: 16, bottom: 28, left: 52 }
const DAY = 24 * 60 * 60 * 1000

// Acquisti (cerchi blu) e vendite (rombi verdi) della carta nel tempo, con il prezzo per copia,
// e la linea del valore stimato attuale per confrontarli. Colori verificati anche per il daltonismo
export default function TransactionChart({ transactions, estimatedValue }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  // "Oggi" letto una volta sola: l'asse dei tempi arriva fino a qui
  const [now] = useState(() => Date.now())

  const points = transactions
    .map((t) => ({ ...t, time: new Date(t.date).getTime(), price: Number(t.unitPrice) }))
    .sort((a, b) => a.time - b.time)
  const value = estimatedValue != null ? Number(estimatedValue) : null

  // Asse dei tempi dal primo movimento a oggi, con un po' di margine ai lati
  const start = points[0].time - 7 * DAY
  const end = Math.max(now, points[points.length - 1].time) + 7 * DAY
  const ticks = niceTicks(Math.max(...points.map((p) => p.price), value ?? 0))
  const top = ticks[ticks.length - 1]
  const plotW = Math.max(width - PAD.left - PAD.right, 0)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (time) => PAD.left + ((time - start) / (end - start)) * plotW
  const y = (v) => PAD.top + plotH - (v / top) * plotH

  // Etichette dei mesi sull'asse orizzontale: al massimo 5, distribuite sul periodo
  const months = []
  const first = new Date(start)
  for (
    let d = new Date(first.getFullYear(), first.getMonth() + 1, 1);
    d.getTime() < end;
    d.setMonth(d.getMonth() + 1)
  ) {
    months.push(d.getTime())
  }
  const every = Math.ceil(months.length / 5)
  const monthFormat = new Intl.DateTimeFormat('it-IT', {
    month: 'short',
    year: months.length > 11 ? '2-digit' : undefined,
  })

  const active = hover !== null ? points[hover] : null

  return (
    <figure className="cv-chart mb-0">
      <div className="d-flex flex-wrap gap-3 small text-secondary mb-2">
        <span className="d-inline-flex align-items-center gap-1">
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="5" className="cv-chart-buy" />
          </svg>
          Acquisti
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <svg width="12" height="12" aria-hidden="true">
            <path d="M6 0.5 11.5 6 6 11.5 0.5 6Z" className="cv-chart-sell" />
          </svg>
          Vendite
        </span>
        {value != null && (
          <span className="d-inline-flex align-items-center gap-1">
            <svg width="16" height="12" aria-hidden="true">
              <line x1="0" x2="16" y1="6" y2="6" className="cv-chart-value-line" />
            </svg>
            Valore stimato oggi
          </span>
        )}
      </div>
      <div ref={ref} className="position-relative">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Prezzi di acquisto e vendita nel tempo">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="cv-chart-grid" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="cv-chart-tick">
                  {formatEuro(t).replace(',00', '')}
                </text>
              </g>
            ))}
            {months
              .filter((_, i) => i % every === 0)
              .map((m) => (
                <text key={m} x={x(m)} y={HEIGHT - 8} textAnchor="middle" className="cv-chart-tick">
                  {monthFormat.format(m)}
                </text>
              ))}
            {value != null && (
              <g>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(value)}
                  y2={y(value)}
                  className="cv-chart-value-line"
                />
                <text x={width - PAD.right} y={y(value) - 6} textAnchor="end" className="cv-chart-value">
                  {formatEuro(value)}
                </text>
              </g>
            )}
            {points.map((p, i) => {
              const cx = x(p.time)
              const cy = y(p.price)
              const faded = hover !== null && hover !== i
              return (
                <g
                  key={p.id}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => setHover(i)}
                  opacity={faded ? 0.45 : 1}
                >
                  {/* Area sensibile più grande del punto: facile da prendere anche col dito */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />
                  {p.type === 'BUY' ? (
                    <circle cx={cx} cy={cy} r="6" className="cv-chart-buy cv-chart-ring" />
                  ) : (
                    <path
                      d={`M${cx} ${cy - 7.5} L${cx + 7.5} ${cy} L${cx} ${cy + 7.5} L${cx - 7.5} ${cy} Z`}
                      className="cv-chart-sell cv-chart-ring"
                    />
                  )}
                </g>
              )
            })}
          </svg>
        )}
        {active && (
          <div className="cv-chart-tooltip" style={{ left: x(active.time), top: y(active.price) }}>
            <div className="small text-secondary">
              {active.type === 'BUY' ? 'Acquisto' : 'Vendita'} · {formatDate(active.date)}
            </div>
            <div className="fw-bold">
              {active.quantity} × {formatEuro(active.unitPrice)}
            </div>
            {active.platform && <div className="small text-secondary">{active.platform}</div>}
          </div>
        )}
      </div>
      <table className="visually-hidden">
        <caption>Acquisti e vendite della carta</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.id}>
              <th scope="row">
                {p.type === 'BUY' ? 'Acquisto' : 'Vendita'} del {formatDate(p.date)}
              </th>
              <td>
                {p.quantity} × {formatEuro(p.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
