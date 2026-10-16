import { Container } from 'react-bootstrap'
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'

// Struttura comune a tutte le pagine: navbar in alto, contenuto della pagina, piè di pagina
export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="py-3 px-3 text-center small text-secondary border-top">
        Pokéteca · gestionale per collezionisti di carte Pokémon
      </footer>
    </div>
  )
}
