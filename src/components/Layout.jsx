import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 w-full sm:max-w-2xl mx-auto border-x border-gray-800">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout