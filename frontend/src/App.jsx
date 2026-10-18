import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Inventory from './pages/Inventory'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Placeholder from './pages/Placeholder'
import Register from './pages/Register'
import { loadUser } from './store/authSlice'

function App() {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)
  const user = useSelector((state) => state.auth.user)

  // C'è un token salvato ma non sappiamo ancora di chi è: lo chiediamo al server
  useEffect(() => {
    if (token && !user) dispatch(loadUser())
  }, [token, user, dispatch])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Pagine riservate: senza login si va a /login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="/cards" element={<Inventory />} />
          <Route path="/cards/new" element={<Placeholder title="Aggiungi carta" />} />
          <Route path="/cards/:id" element={<Placeholder title="Dettaglio carta" />} />
          <Route path="/cards/:id/edit" element={<Placeholder title="Modifica carta" />} />
          <Route path="/transactions" element={<Placeholder title="Transazioni" />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
