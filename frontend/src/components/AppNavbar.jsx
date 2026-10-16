import { Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import Logo from './Logo'

export default function AppNavbar() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    // collapseOnSelect: su telefono il menu si richiude dopo aver scelto una voce
    <Navbar expand="md" sticky="top" collapseOnSelect className="cv-navbar py-2">
      <Container>
        <Navbar.Brand as={Link} to={user ? '/dashboard' : '/'} className="d-flex align-items-center gap-2 fw-bold">
          <span className="cv-logo">
            <Logo />
          </span>
          Pokéteca
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={NavLink} to="/dashboard" eventKey="dashboard">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={NavLink} to="/cards" end eventKey="cards">
                  Inventario
                </Nav.Link>
                <Nav.Link as={NavLink} to="/transactions" eventKey="transactions">
                  Transazioni
                </Nav.Link>
              </Nav>
              <Nav>
                <NavDropdown title={user.username} align="end" id="user-menu">
                  <NavDropdown.ItemText className="small text-secondary">{user.email}</NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Esci</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto align-items-md-center gap-md-2">
              <Nav.Link as={NavLink} to="/login" eventKey="login">
                Accedi
              </Nav.Link>
              <Button as={Link} to="/register" size="sm" className="px-3 my-2 my-md-0 align-self-start align-self-md-center">
                Registrati
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
