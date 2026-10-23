import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../lib/api'

export const PAGE_SIZE = 12

export const DEFAULT_FILTERS = {
  q: '',
  language: '',
  condition: '',
  graded: '', // '' = tutte, 'true' = solo gradate, 'false' = solo non gradate
  sort: 'createdAt,desc',
  includeSold: '', // '' = solo le carte possedute, 'true' = anche quelle vendute del tutto (0 copie)
}

// Carica la pagina corrente con i filtri salvati nello store.
// Ogni elemento è un gruppo: le copie della stessa carta (anche in condizioni diverse) stanno insieme
export const fetchCards = createAsyncThunk('cards/fetch', async (_, { getState, rejectWithValue }) => {
  const { filters, page } = getState().cards
  try {
    return await api.cardGroups({ ...filters, page, size: PAGE_SIZE })
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

const cardsSlice = createSlice({
  name: 'cards',
  initialState: {
    items: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    filters: DEFAULT_FILTERS,
    loading: false,
    error: null,
  },
  reducers: {
    // Cambiando un filtro si riparte dalla prima pagina
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
    },
    resetFilters(state) {
      state.filters = DEFAULT_FILTERS
      state.page = 0
    },
    setPage(state, action) {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.content
        state.totalPages = action.payload.totalPages
        state.totalElements = action.payload.totalElements
        // Se la pagina corrente non esiste più (es. dopo un'eliminazione) torniamo all'ultima valida
        if (state.page > 0 && state.page >= action.payload.totalPages) {
          state.page = Math.max(action.payload.totalPages - 1, 0)
        }
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Impossibile caricare le carte'
      })
      // Al logout svuotiamo l'inventario: il prossimo utente non deve vedere le carte del precedente
      .addCase('auth/loggedOut', () => cardsSlice.getInitialState())
  },
})

export const { setFilters, resetFilters, setPage } = cardsSlice.actions
export default cardsSlice.reducer
