import { Container } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'
import MobileTabBar from './MobileTabBar'

// Struttura comune a tutte le pagine: navbar in alto, contenuto della pagina, piè di pagina.
// Su telefono, da collegati, c'è anche la barra delle sezioni in basso
export default function Layout() {
  const user = useSelector((state) => state.auth.user)
  return (
    <div className={`d-flex flex-column min-vh-100 ${user ? 'cv-with-tabbar' : ''}`}>
      <AppNavbar />
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="py-3 px-3 text-center small text-secondary border-top">
        Pokéteca · gestionale per collezionisti di carte Pokémon
      </footer>
      {user && <MobileTabBar />}
    </div>
  )
}
