import { useMemo, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useDispatch } from 'react-redux'
import { api } from '../lib/api'
import { pokemonArtwork } from '../lib/format'
import { userUpdated } from '../store/authSlice'

// Quanti Pokémon mostrare alla volta: 1025 immagini insieme sarebbero troppe
const MAX_RESULTS = 48

// "Flabébé" si trova anche scrivendo "flabebe": accenti tolti dopo aver separato le lettere (NFD)
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

// Scelta del Pokémon da usare come avatar, con ricerca per nome o numero di Pokédex
export default function AvatarModal({ show, user, onHide }) {
  const dispatch = useDispatch()
  const [pokemon, setPokemon] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // L'elenco si scarica solo la prima volta che si apre la finestra
  const handleEnter = () => {
    setSearch('')
    setError(null)
    if (pokemon) return
    api
      .pokemon()
      .then(setPokemon)
      .catch((e) => setError(e.message))
  }

  const results = useMemo(() => {
    if (!pokemon) return []
    const q = normalize(search)
    const matches = q ? pokemon.filter((p) => normalize(p.name).includes(q) || String(p.dex) === q) : pokemon
    return matches.slice(0, MAX_RESULTS)
  }, [pokemon, search])

  const choose = async (avatarDex) => {
    setSaving(true)
    setError(null)
    try {
      dispatch(userUpdated(await api.updateAvatar(avatarDex)))
      onHide()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onEnter={handleEnter} onHide={saving ? undefined : onHide} centered scrollable>
      <Modal.Header closeButton={!saving}>
        <Modal.Title as="h2" className="h5">
          Scegli il tuo avatar
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="search"
          placeholder="Cerca per nome o numero (es. Pikachu, 25)"
          aria-label="Cerca un Pokémon"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
          autoFocus
        />
        {error && <Alert variant="danger">{error}</Alert>}
        {!pokemon && !error && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {pokemon && results.length === 0 && (
          <p className="text-secondary text-center py-3 mb-0">Nessun Pokémon trovato</p>
        )}
        <div className="cv-avatar-grid">
          {results.map((p) => (
            <button
              key={p.dex}
              type="button"
              className={`cv-avatar-option ${p.dex === user.avatarDex ? 'active' : ''}`}
              onClick={() => choose(p.dex)}
              disabled={saving}
              title={`#${p.dex} ${p.name}`}
            >
              <img src={pokemonArtwork(p.dex)} alt="" loading="lazy" />
              <span className="text-truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </Modal.Body>
      {user.avatarDex && (
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => choose(null)} disabled={saving}>
            Usa l'iniziale
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  )
}
