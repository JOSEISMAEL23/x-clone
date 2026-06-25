import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="text-white p-6">Cargando...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}