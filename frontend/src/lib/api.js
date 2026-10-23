// Tutte le chiamate al backend passano da qui.
// In sviluppo Vite inoltra /api al backend (vedi vite.config.js); in produzione si imposta VITE_API_URL
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'capstone.token'

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors ?? null // errori dei singoli campi: { email: '...', password: '...' }
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage non disponibile (es. navigazione privata): si resta non collegati
  }
}

// Avvisa l'app quando il server rifiuta il token (scaduto o non valido)
let onUnauthorized = () => {}
export function setUnauthorizedHandler(callback) {
  onUnauthorized = callback
}

async function request(path, { method = 'GET', body, formData, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? readToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      // Per i file il Content-Type multipart lo imposta il browser
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'Server non raggiungibile, riprova tra poco')
  }

  if (response.status === 204) return undefined
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized()
    const message = data?.message ?? (data?.errors ? 'Controlla i campi evidenziati' : `Errore ${response.status}`)
    throw new ApiError(response.status, message, data?.errors)
  }
  return data
}

// Parametri di ricerca: i valori vuoti non vengono mandati
function query(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.append(key, value)
  })
  const text = qs.toString()
  return text ? `?${text}` : ''
}

const id = (value) => encodeURIComponent(value)

export const api = {
  // Autenticazione
  register: (data) => request('/api/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: data, auth: false }),
  me: () => request('/api/users/me'),
  updateAvatar: (avatarDex) => request('/api/users/me/avatar', { method: 'PATCH', body: { avatarDex } }),
  pokemon: () => request('/api/pokemon'),

  // Carte
  cards: (filters) => request(`/api/cards${query(filters)}`),
  cardGroups: (filters) => request(`/api/cards/groups${query(filters)}`),
  card: (cardId) => request(`/api/cards/${id(cardId)}`),
  createCard: (data) => request('/api/cards', { method: 'POST', body: data }),
  updateCard: (cardId, data) => request(`/api/cards/${id(cardId)}`, { method: 'PUT', body: data }),
  deleteCard: (cardId) => request(`/api/cards/${id(cardId)}`, { method: 'DELETE' }),
  uploadCardImage: (cardId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request(`/api/cards/${id(cardId)}/image`, { method: 'POST', formData })
  },

  // Transazioni
  transactions: (filters) => request(`/api/transactions${query(filters)}`),
  addTransaction: (cardId, data) => request(`/api/cards/${id(cardId)}/transactions`, { method: 'POST', body: data }),
  deleteTransaction: (transactionId) => request(`/api/transactions/${id(transactionId)}`, { method: 'DELETE' }),

  // Dashboard
  stats: () => request('/api/dashboard/stats'),

  // API esterna di carte (pubblica: funziona anche senza login)
  searchExternal: (q, lang, page = 1) => request(`/api/external/cards/search${query({ q, lang, page })}`),
  externalCard: (externalId, lang) => request(`/api/external/cards/${id(externalId)}${query({ lang })}`),

  // Catalogo pubblico di serie e set (anche senza login)
  series: (lang) => request(`/api/external/series${query({ lang })}`),
  seriesDetail: (seriesId, lang) => request(`/api/external/series/${id(seriesId)}${query({ lang })}`),
  latestSets: (lang, limit) => request(`/api/external/sets/latest${query({ lang, limit })}`),
  externalSet: (setId, lang) => request(`/api/external/sets/${id(setId)}${query({ lang })}`),
}
