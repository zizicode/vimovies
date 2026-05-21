import {
  TiPlus,
  TiFilm,
  TiEye,
  TiUser,
  TiArrowUp,
  TiArrowDown,
  TiRefresh,
  TiTime,
  TiMediaPlay,
  TiMediaPause,
  TiMediaStop
} from 'react-icons/ti';
import { useJobStore, useDashboardStore } from '../store';
import { useEffect } from 'react';

export default function Home() {
  const { 
    status, 
    progress, 
    message, 
    currentMovie,
    currentStep,
    stepIndex,
    totalSteps,
    estimatedTime,
    startJob, 
    pauseJob, 
    resumeJob, 
    stopJob 
  } = useJobStore();

  const {
    totalMovies,
    monthlyVisits,
    totalPeople,
    noindexMovies,
    moviesDelta,
    visitsDelta,
    peopleDelta,
    recentActivity,
    syncQueue,
    fetchDashboardData,
  } = useDashboardStore();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `~${seconds} seg`;
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} min`;
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="view active">
      
      {/* Section Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Resumen general</div>
          <div className="section-sub">Último sync TMDB: hace 2 horas — lunes, 18 ene 2026</div>
        </div>
        <button className="btn btn-primary">
          <TiPlus /> Añadir película
        </button>
      </div>

      {/* Job Controls */}
      <div style={{ 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
            Control de Sincronización
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
            {message || 'Estado: ' + status}
          </div>
        </div>
        
        {status === 'idle' || status === 'stopped' || status === 'error' ? (
          <button 
            className="btn btn-primary"
            onClick={() => startJob(20)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TiMediaPlay /> Iniciar Sync
          </button>
        ) : status === 'running' ? (
          <>
            <button 
              className="btn btn-ghost"
              onClick={pauseJob}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TiMediaPause /> Pausar
            </button>
            <button 
              className="btn btn-ghost"
              onClick={stopJob}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)' }}
            >
              <TiMediaStop /> Detener
            </button>
          </>
        ) : status === 'paused' ? (
          <>
            <button 
              className="btn btn-primary"
              onClick={resumeJob}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TiMediaPlay /> Reanudar
            </button>
            <button 
              className="btn btn-ghost"
              onClick={stopJob}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)' }}
            >
              <TiMediaStop /> Detener
            </button>
          </>
        ) : null}

        {progress > 0 && (
          <div style={{ 
            minWidth: '80px',
            textAlign: 'right',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--gold)'
          }}>
            {progress}%
          </div>
        )}
      </div>

      {/* Sync Panel */}
      {isRunning || isPaused ? (
        <div className="sync-panel">
          <div className="sync-spinner"></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
              {isPaused ? 'Sincronización pausada' : 'Sincronización en progreso'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              {currentMovie ? (
                <>
                  Procesando <strong style={{ color: 'var(--gold)' }}>{currentMovie}</strong>
                  {currentStep && stepIndex > 0 && (
                    <> — Paso {stepIndex} de {totalSteps}: {currentStep}</>
                  )}
                </>
              ) : (
                message || 'Iniciando...'
              )}
            </div>
          </div>
          <span className="badge badge-gold sync-pulse">
            <TiTime style={{ fontSize: '10px' }} /> {estimatedTime > 0 ? formatTime(estimatedTime) : 'Calculando...'}
          </span>
        </div>
      ) : status === 'completed' ? (
        <div className="sync-panel" style={{ borderColor: 'var(--green)' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>✓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Sincronización completada</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              {currentMovie && `Procesadas ${progress}% de las películas`}
            </div>
          </div>
          <span className="badge badge-green">
            <TiTime style={{ fontSize: '10px' }} /> Completado
          </span>
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-icon gold"><TiFilm /></div>
          <div className="stat-val">{totalMovies.toLocaleString()}</div>
          <div className="stat-label">Películas indexadas</div>
          <div className="stat-delta delta-up">
            <TiArrowUp style={{ fontSize: '11px' }} /> {moviesDelta}
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><TiEye /></div>
          <div className="stat-val">{(monthlyVisits / 1000).toFixed(1)}k</div>
          <div className="stat-label">Visitas mensuales</div>
          <div className="stat-delta delta-up">
            <TiArrowUp style={{ fontSize: '11px' }} /> {visitsDelta}
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><TiUser /></div>
          <div className="stat-val">{totalPeople.toLocaleString()}</div>
          <div className="stat-label">Personas en catálogo</div>
          <div className="stat-delta delta-up">
            <TiArrowUp style={{ fontSize: '11px' }} /> {peopleDelta}
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><TiEye style={{ opacity: 0.5 }} /></div>
          <div className="stat-val">{noindexMovies}</div>
          <div className="stat-label">Películas con noindex</div>
          <div className="stat-delta delta-down">
            <TiArrowDown style={{ fontSize: '11px' }} /> popularity &lt; 10
          </div>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="three-col">
        
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Actividad reciente</div>
            <span className="badge badge-gray">Hoy</span>
          </div>
          <div className="card-body" style={{ paddingTop: '4px' }}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className="feed-item">
                <div className={`feed-dot ${activity.type === 'sync' ? 'gold' : activity.type === 'editorial' ? 'green' : activity.type === 'new' ? 'blue' : 'gold'}`}></div>
                <div>
                  <div className="feed-text">
                    {activity.type === 'sync' && 'Sync completado: '}
                    {activity.type === 'editorial' && 'Editorial actualizado: '}
                    {activity.type === 'new' && 'Nueva película añadida: '}
                    <strong>{activity.title}</strong>
                  </div>
                  <div className="feed-time">{activity.details} — {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Queue */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cola de sincronización</div>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>
              <TiRefresh /> Reiniciar
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: '4px' }}>
            {/* Current job if running */}
            {isRunning && currentMovie && (
              <div className="sync-item">
                <div style={{ flex: 1 }}>
                  <div className="sync-name">{currentMovie}</div>
                  <div className="sync-steps">
                    {currentStep ? `Paso ${stepIndex}/${totalSteps} — ${currentStep}` : 'Procesando...'}
                  </div>
                </div>
                <div className="progress-track"><div className="progress-fill gold" style={{ width: `${progress}%` }}></div></div>
                <span className="badge badge-gold" style={{ fontSize: '10px' }}>{progress}%</span>
              </div>
            )}
            
            {/* Queue items */}
            {syncQueue.map((item) => (
              <div key={item.id} className="sync-item">
                <div style={{ flex: 1 }}>
                  <div className="sync-name">{item.name}</div>
                  <div className="sync-steps">{item.step}</div>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${item.status === 'completed' ? 'green' : item.status === 'error' ? 'red' : 'blue'}`} 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span 
                  className={`badge ${item.status === 'completed' ? 'badge-green' : item.status === 'error' ? 'badge-red' : 'badge-gray'}`} 
                  style={{ fontSize: '10px' }}
                >
                  {item.status === 'completed' ? '✓' : item.progress > 0 ? `${item.progress}%` : '–'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="two-col">
        
        {/* Sitemap Priority Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Películas por prioridad sitemap</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>1,204</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>high priority</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text2)' }}>896</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>medium priority</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text3)' }}>1,000</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>low + minimal</div>
              </div>
            </div>
            <div className="mini-chart">
              <div className="bar active" style={{ height: '80%' }}></div>
              <div className="bar" style={{ height: '65%' }}></div>
              <div className="bar active" style={{ height: '90%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '85%' }}></div>
              <div className="bar" style={{ height: '45%' }}></div>
              <div className="bar" style={{ height: '75%' }}></div>
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '88%' }}></div>
              <div className="bar" style={{ height: '50%' }}></div>
              <div className="bar active" style={{ height: '95%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text3)' }}>
              <span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span><span>Ene</span>
            </div>
          </div>
        </div>

        {/* Top Popularity Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top por popularidad TMDB</div>
            <span className="badge badge-gray">Esta semana</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <tbody>
                <tr>
                  <td style={{ width: '28px', padding: '10px 8px 10px 14px', color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#1</td>
                  <td>Dune: Parte Dos</td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}><span className="score-val">189.4</span></td>
                </tr>
                <tr>
                  <td style={{ width: '28px', padding: '10px 8px 10px 14px', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#2</td>
                  <td>Oppenheimer</td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}><span className="score-val">142.1</span></td>
                </tr>
                <tr>
                  <td style={{ width: '28px', padding: '10px 8px 10px 14px', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#3</td>
                  <td>The Dark Knight</td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}><span className="score-val">128.7</span></td>
                </tr>
                <tr>
                  <td style={{ width: '28px', padding: '10px 8px 10px 14px', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#4</td>
                  <td>Furiosa (2024)</td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}><span className="score-val">115.3</span></td>
                </tr>
                <tr>
                  <td style={{ width: '28px', padding: '10px 8px 10px 14px', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#5</td>
                  <td>Interstellar</td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}><span className="score-val">108.9</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
