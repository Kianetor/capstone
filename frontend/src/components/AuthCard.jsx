import { Card } from 'react-bootstrap'
import Logo from './Logo'

// Riquadro centrato comune a login e registrazione
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="d-flex justify-content-center py-md-4">
      <Card className="w-100" style={{ maxWidth: 440 }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <span className="cv-logo d-inline-block mb-2">
              <Logo size={40} />
            </span>
            <h1 className="h3 mb-1">{title}</h1>
            {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
          </div>
          {children}
        </Card.Body>
        {footer && <Card.Footer className="text-center py-3 bg-transparent">{footer}</Card.Footer>}
      </Card>
    </div>
  )
}
