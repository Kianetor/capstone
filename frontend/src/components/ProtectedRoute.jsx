import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from './Loader'

// Protegge le pagine riservate: senza login si va a /login e dopo l'accesso si torna qui.
// È solo comodità per l'interfaccia: il controllo vero lo fa il backend su ogni richiesta
export default function ProtectedRoute() {
  const { user, token, initializing } = useSelector((state) => state.auth)
  const location = useLocation()

  // Token salvato ma utente non ancora caricato: aspettiamo invece di rimandare al login per un attimo
  if (initializing || (token && !user)) return <Loader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
