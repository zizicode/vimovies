import { useAuthStore } from '../store';

export function Dashboard() {
  const { token, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Vimovies Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Bienvenido al Dashboard</h2>
          <p className="text-gray-600">
            Token: {typeof token === 'string' ? `${token.substring(0, 20)}...` : 'No disponible'}
          </p>
        </div>
      </main>
    </div>
  );
}
