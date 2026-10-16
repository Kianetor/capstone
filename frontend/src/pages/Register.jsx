import { useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import Loader from '../components/Loader'
import { clearAuthError, register } from '../store/authSlice'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,30}$/

// Stesse regole del backend (RegisterRequest): l'utente vede subito l'errore senza aspettare il server
function validate({ username, email, password, confirmPassword }) {
  const errors = {}
  if (!USERNAME_REGEX.test(username.trim())) {
    errors.username = 'Da 3 a 30 caratteri: lettere, numeri, punto, trattino o underscore'
  }
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Inserisci un indirizzo email valido'
  if (password.length < 8 || password.length > 72) errors.password = 'Almeno 8 caratteri'
  if (confirmPassword !== password) errors.confirmPassword = 'Le password non coincidono'
  return errors
}

// L'errore "già registrata/in uso" del backend arriva come messaggio: lo mostriamo sotto il campo giusto
function backendFieldErrors(error) {
  if (!error) return {}
  if (error.errors) return error.errors
  if (error.message?.startsWith('Email')) return { email: error.message }
  if (error.message?.startsWith('Username')) return { username: error.message }
  return {}
}

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error, initializing } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  if (initializing) return <Loader />
  if (user) return <Navigate to="/dashboard" replace />

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFieldErrors({ ...fieldErrors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    const result = await dispatch(
      register({ username: form.username.trim(), email: form.email.trim(), password: form.password }),
    )
    if (register.fulfilled.match(result)) navigate('/dashboard', { replace: true })
  }

  const fromBackend = backendFieldErrors(error)
  const errors = { ...fromBackend, ...fieldErrors }
  const generalError = error && Object.keys(fromBackend).length === 0 ? error.message : null

  const field = (name, label, type, autoComplete, extra = {}) => (
    <Form.Group className="mb-3" controlId={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={form[name]}
        onChange={handleChange}
        isInvalid={Boolean(errors[name])}
        {...extra}
      />
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  )

  return (
    <AuthCard
      title="Crea il tuo account"
      subtitle="Inizia a catalogare la tua collezione"
      footer={
        <span className="text-secondary">
          Hai già un account? <Link to="/login">Accedi</Link>
        </span>
      }
    >
      {generalError && <Alert variant="danger">{generalError}</Alert>}
      <Form noValidate onSubmit={handleSubmit}>
        {field('username', 'Username', 'text', 'username', { autoFocus: true })}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Password', 'password', 'new-password')}
        {field('confirmPassword', 'Conferma password', 'password', 'new-password')}
        <Button type="submit" className="w-100 mt-2" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Registrati'}
        </Button>
      </Form>
    </AuthCard>
  )
}
