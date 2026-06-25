import { Link } from 'react-router-dom'
import { Home, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Sidebar() {
  const { signOut, profile } = useAuth()

  return (
    <aside className="w-20 sm:w-64 p-2 sm:p-4 flex flex-col justify-between h-screen sticky top-0 border-r border-gray-800 shrink-0">
      <div>
        <h1 className="text-2xl font-bold px-3 mb-6 text-white text-center sm:text-left">
          <span className="sm:hidden">𝕏</span>
          <span className="hidden sm:inline">X Clone</span>
        </h1>
        <nav className="space-y-1">
          <Link
            to="/feed"
            className="flex items-center justify-center sm:justify-start gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-white transition"
          >
            <Home size={24} />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          {profile && (
            <Link
              to={`/profile/${profile.username}`}
              className="flex items-center justify-center sm:justify-start gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-white transition"
            >
              <User size={24} />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          )}
        </nav>
      </div>
      <button
        onClick={signOut}
        className="flex items-center justify-center sm:justify-start gap-3 px-3 py-3 rounded-full hover:bg-gray-900 text-lg text-red-500 transition"
      >
        <LogOut size={24} />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </aside>
  )
}

export default Sidebar