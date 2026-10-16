import { configureStore } from '@reduxjs/toolkit'
import { setUnauthorizedHandler } from '../lib/api'
import authReducer, { logout } from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

// Se il server rifiuta il token (scaduto), usciamo: ProtectedRoute rimanda al login
setUnauthorizedHandler(() => store.dispatch(logout()))
