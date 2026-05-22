// src/layouts/RootLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './root.scss';
import SidebarUI from '../components/ui/sidebar';
import { useAuthStore, useSocketStore, useJobStore } from '../store';
import { RiHome9Line } from "react-icons/ri";
import { MdKeyboardArrowRight } from "react-icons/md";
import { TbSearch } from "react-icons/tb";
import { IoSync } from "react-icons/io5";
import { GoSignOut } from "react-icons/go";

export default function RootLayout() {
  const { logout, token } = useAuthStore();
  const { isConnected, connect, disconnect } = useSocketStore();
  const jobStore = useJobStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSync = () => {
    jobStore.startJob(20);
  };

  const getSectionTitle = () => {
    switch (location.pathname) {
      case '/home':
        return 'Inicio';
      case '/dashboard':
        return 'Dashboard';
      case '/peliculas':
        return 'Pel�culas';
      case '/articulos':
        return 'Art�culos';
      case '/personas':
        return 'Personas';
      case '/generos':
        return 'G�neros';
      case '/plataformas':
        return 'Plataformas';
      case '/sincronizacion':
        return 'Sincronizaci�n';
      default:
        return 'Inicio';
    }
  };

  return (
    <div className="app-container">

      <SidebarUI />

      <main className='main'>
        <div className="topbar">
          <div className="topbar-breadcrumb">
            <RiHome9Line />
            <MdKeyboardArrowRight />
            <i className="ti ti-chevron-right"></i>
            <span id="topbar-section">{getSectionTitle()}</span>
          </div>

          <div className="topbar-spacer"></div>

          <div className="search-bar">
            <TbSearch/>
            <label htmlFor="search-input" className="sr-only">Buscar pel�cula</label>
            <input 
              type="text" 
              id="search-input"
              name="search"
              placeholder="Buscar pel�cula..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <kbd>?K</kbd>
          </div>

          <div 
            className="socket-status-indicator"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              minWidth: '7px',
              minHeight: '7px',
              animation: isConnected ? 'pulse-green 2s ease-in-out infinite' : 'pulse-red 2s ease-in-out infinite',
              boxShadow: isConnected ? '0 0 0 0 rgba(34, 197, 94, 0.4)' : '0 0 0 0 rgba(239, 68, 68, 0.4)',
            }}
            data-tip={isConnected ? 'Conectado' : 'Desconectado'}
          />

          <div className="topbar-btn" onClick={handleSync} data-tip="Sincronizar TMDB">
            <IoSync className="ti ti-refresh"/>
          </div>

          <div className="topbar-btn" onClick={handleLogout} data-tip="Cerrar sesi�n">
            <GoSignOut className="ti ti-logout"/>
          </div>
        </div>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}