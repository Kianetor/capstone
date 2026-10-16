import { useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import Loader from '../components/Loader'
import { clearAuthError, login } from '../store/authSlice'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Inserisci un indirizzo email valido'
  if (!password) errors.password = 'Inserisci la password'
  return errors
}

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, error, initializing } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  // Uscendo dalla pagina non lasciamo l'errore per la prossima volta
  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  // Dopo il login torniamo alla pagina protetta da cui eravamo stati mandati qui
  const destination = location.state?.from ?? '/dashboard'
  if (initializing) return <Loader />
  if (user) return <Navigate to={destination} replace />

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFieldErrors({ ...fieldErrors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    const result = await dispatch(login({ email: form.email.trim(), password: form.password }))
    if (login.fulfilled.match(result)) navigate(destination, { replace: true })
  }

  const errors = { ...error?.errors, ...fieldErrors }

  return (
    <AuthCard
      title="Bentornato"
      subtitle="Accedi alla tua collezione"
      footer={
        <span className="text-secondary">
          Non hai un account? <Link to="/register">Registrati</Link>
        </span>
      }
    >
      {error && !error.errors && <Alert variant="danger">{error.message}</Alert>}
      <Form noValidate onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            isInvalid={Boolean(errors.email)}
            autoFocus
          />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-4" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            isInvalid={Boolean(errors.password)}
          />
          <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Accedi'}
        </Button>
      </Form>
    </AuthCard>
  )
}
