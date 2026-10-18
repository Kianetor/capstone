import { configureStore } from '@reduxjs/toolkit'
import { setUnauthorizedHandler } from '../lib/api'
import authReducer, { logout } from './authSlice'
import cardsReducer from './cardsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cards: cardsReducer,
  },
})

// Se il server rifiuta il token (scaduto), usciamo: ProtectedRoute rimanda al login
setUnauthorizedHandler(() => store.dispatch(logout()))
