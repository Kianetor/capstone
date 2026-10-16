import { Button, Card, Col, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Inventario completo',
    text: 'Cataloga ogni carta con set, numero, lingua, condizione e gradazione. Cerca e filtra in un attimo.',
  },
  {
    icon: '💶',
    title: 'Acquisti e vendite',
    text: 'Registra ogni operazione: le copie possedute si aggiornano da sole e lo storico resta sempre a portata di mano.',
  },
  {
    icon: '📈',
    title: 'Valore della collezione',
    text: 'Valore stimato, spesa, ricavi e margine in una dashboard. Il prezzo di mercato arriva da Cardmarket.',
  },
]

export default function Landing() {
  const user = useSelector((state) => state.auth.user)

  return (
    <>
      <Row className="align-items-center g-5 py-md-5">
        <Col lg={6} className="text-center text-lg-start">
          <span className="badge rounded-pill text-bg-dark border mb-3 px-3 py-2 fw-normal">
            Il gestionale per collezionisti di carte Pokémon
          </span>
          <h1 className="display-4 fw-bold mb-3">
            La tua collezione, <span className="text-accent">sotto controllo</span>.
          </h1>
          <p className="lead text-secondary mb-4">
            Tieni traccia di ogni carta, di quanto hai speso e di quanto vale oggi la tua collezione. Tutto in un unico
            posto, dal telefono o dal computer.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
            {user ? (
              <Button as={Link} to="/dashboard" size="lg">
                Vai alla dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" size="lg">
                  Inizia gratis
                </Button>
                <Button as={Link} to="/login" size="lg" variant="outline-primary">
                  Accedi
                </Button>
              </>
            )}
          </div>
        </Col>
        <Col lg={6} className="d-none d-md-block">
          <div className="cv-hero-cards" aria-hidden="true">
            <div className="cv-hero-card cv-hero-card-1" />
            <div className="cv-hero-card cv-hero-card-2" />
            <div className="cv-hero-card cv-hero-card-3">
              <span>★</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row xs={1} md={3} className="g-4 py-5">
        {FEATURES.map((f) => (
          <Col key={f.title}>
            <Card className="h-100">
              <Card.Body className="p-4">
                <div className="fs-2 mb-3" aria-hidden="true">
                  {f.icon}
                </div>
                <Card.Title as="h2" className="h5">
                  {f.title}
                </Card.Title>
                <Card.Text className="text-secondary">{f.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
