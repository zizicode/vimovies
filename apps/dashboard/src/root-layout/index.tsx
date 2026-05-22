import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/sidebar'

export default function RootLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
