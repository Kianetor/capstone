import { Spinner } from 'react-bootstrap'

// Spinner centrato da mostrare mentre si aspettano i dati dal backend
export default function Loader({ text = 'Caricamento...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-3 text-secondary" role="status">
      <Spinner animation="border" className="text-accent" />
      <span className="small">{text}</span>
    </div>
  )
}
