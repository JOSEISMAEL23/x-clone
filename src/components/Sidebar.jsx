import { Link } from 'react-router-dom'
import { Home, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Sidebar() {
  const { signOut, profile } = useAuth()

  return (
    <aside className="w-64 p-4 flex flex-col justify-between h-screen sticky top-0 border-r border-gray-800">
      <div>
        <h1 className="text-2xl font-bold px-3 mb-6 text-white">X Clone</h1>
        <nav className="space-y-1">
          <Link to="/feed" className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-white transition">
            <Home size={24} /> Inicio
          </Link>
          {profile && (
            <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-white transition">
              <User size={24} /> Perfil
            </Link>
          )}
        </nav>
      </div>
      <button onClick={signOut} className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-red-500 transition">
        <LogOut size={24} /> Cerrar sesión
      </button>
    </aside>
  )
}

export default Sidebar