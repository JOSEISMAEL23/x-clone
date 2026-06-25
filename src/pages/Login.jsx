import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await signIn(email, password)
    if (error) return setError(error.message)
    navigate('/feed')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Iniciar sesión</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="email" placeholder="Correo" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700" required />
        <input type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-full font-bold">
          Entrar
        </button>
        <p className="text-gray-500 text-sm text-center">
          ¿No tienes cuenta? <Link to="/register" className="text-blue-500">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}

export default Login