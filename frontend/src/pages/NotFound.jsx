import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-5 text-center">
      <p className="display-4 fw-bold text-accent display-font mb-2">404</p>
      <h1 className="h4">Pagina non trovata</h1>
      <p className="text-secondary">L'indirizzo che hai aperto non esiste.</p>
      <Link to="/" className="btn btn-outline-primary">
        Torna alla home
      </Link>
    </div>
  )
}
