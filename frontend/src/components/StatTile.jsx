import { Card } from 'react-bootstrap'

// Riquadro con un numero chiave della dashboard: etichetta, valore e una riga di dettaglio.
// tone ('positive' | 'negative') colora solo la riga di dettaglio, che ha sempre anche segno e parola:
// il significato non è mai affidato al solo colore
export default function StatTile({ label, value, detail, tone }) {
  const toneClass =
    tone === 'positive' ? 'cv-tone-positive' : tone === 'negative' ? 'cv-tone-negative' : 'text-secondary'
  return (
    <Card className="h-100">
      <Card.Body className="p-3 p-md-4">
        <div className="small text-secondary mb-1">{label}</div>
        <div className="cv-stat-value">{value}</div>
        {detail && <div className={`small mt-1 ${toneClass}`}>{detail}</div>}
      </Card.Body>
    </Card>
  )
}
