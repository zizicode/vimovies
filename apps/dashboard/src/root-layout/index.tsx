import { Outlet } from 'react-router-dom'
import Sidebar from '../components/ui/sidebar'

export default function RootLayout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
