import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import logo from '/flash-svgrepo-com.svg'

export function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Contraseña incorrecta');
    }

    setLoading(false);
  };

  return (
    <div className="login-view active" id="view-login">
  <div className="login-bg"></div>
  <div className="login-card">
    <div className="login-logo">
      <div className="logo-mark"><img src={logo} alt="vimovies-control" /></div>
      <div className="logo-text">Vi<span>movies Control</span></div>
    </div>
    <div className="login-headline">Acceso al Dashboard</div>
    <div className="login-sub">Para gestiona tu catálogo de películas</div>
    <div className="form-group">
      <label className="form-label" htmlFor="password">Contraseña</label>
      <input 
        className="form-input" 
        type="password" 
        id="password"
        name="password"
        placeholder="••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
    </div>
    <button 
      className="login-btn" 
      onClick={handleSubmit}
      disabled={loading}
    >
      {loading ? 'Iniciando...' : 'Iniciar sesión'}
    </button>
    {error && <div className="login-error">{error}</div>}
    <div className="login-footer">
      Acceso restringido al equipo de Vimovies
    </div>
  </div>
</div>
  );
}
