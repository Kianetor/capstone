import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, readToken, saveToken } from '../lib/api'

// Gli errori dei thunk diventano un oggetto semplice: Redux vuole dati serializzabili, non istanze di Error
const toError = (e) => ({ message: e.message, errors: e.errors ?? null })

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { token } = await api.login({ email, password })
    saveToken(token)
    const user = await api.me()
    return { token, user }
  } catch (e) {
    saveToken(null)
    return rejectWithValue(toError(e))
  }
})

// Dopo la registrazione entriamo subito, senza far riscrivere le credenziali
export const register = createAsyncThunk('auth/register', async (data, { dispatch, rejectWithValue }) => {
  try {
    await api.register(data)
  } catch (e) {
    return rejectWithValue(toError(e))
  }
  return dispatch(login({ email: data.email, password: data.password })).unwrap()
})

// All'avvio: il token salvato è ancora valido? Il token da solo non contiene nome ed email
export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    return await api.me()
  } catch (e) {
    saveToken(null)
    return rejectWithValue(toError(e))
  }
})

const initialToken = readToken()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: initialToken,
    user: null,
    // true finché non sappiamo se il token salvato è valido: evita di rimandare al login per un attimo
    initializing: Boolean(initialToken),
    loading: false,
    error: null,
  },
  reducers: {
    loggedOut(state) {
      state.token = null
      state.user = null
      state.error = null
    },
    // Dopo una modifica del profilo (es. avatar) il backend restituisce l'utente aggiornato
    userUpdated(state, action) {
      state.user = action.payload
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? { message: 'Accesso non riuscito' }
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? { message: 'Registrazione non riuscita' }
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.initializing = false
        state.user = action.payload
      })
      .addCase(loadUser.rejected, (state) => {
        state.initializing = false
        state.token = null
        state.user = null
      })
  },
})

export const { loggedOut, userUpdated, clearAuthError } = authSlice.actions

// Il logout cancella il token salvato e svuota lo stato
export const logout = () => (dispatch) => {
  saveToken(null)
  dispatch(loggedOut())
}

export default authSlice.reducer
