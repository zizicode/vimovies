import { useState, useEffect } from 'react';
import { useSyncConfigStore } from '../store/sync-config.store';
import { useJobStore } from '../store/job.store';
import { genresService } from '../services/api.service';
import './sincronizacion.scss';

interface Genre {
  id: number;
  name: string;
}

export default function SincronizacionPage() {
  const { config, updateConfig, resetConfig, exportConfig, importConfig } = useSyncConfigStore();
  const { startJob, status } = useJobStore();
  const [activeTab, setActiveTab] = useState<'general' | 'filters' | 'content' | 'advanced'>('general');
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

  // Cargar géneros disponibles desde la API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genresService.list();
        if (response.success && response.data) {
          setAvailableGenres(response.data.map((g: any) => ({ id: g.tmdb_id, name: g.name_es })));
        }
      } catch (error) {
        console.error('Error al cargar géneros:', error);
      }
    };
    fetchGenres();
  }, []);

  const handleStartSync = () => {
    startJob(config.maxMovies);
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sync-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importConfig(json);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="sincronizacion-page">
      <div className="page-header">
        <h1>
          ⚙️ Configuración de Sincronización
        </h1>
        <p>
          Configura los parámetros para el job de sincronización de películas desde TMDB
        </p>
      </div>

      <div className="action-bar">
        <button
          onClick={handleStartSync}
          disabled={status === 'running'}
          className="btn btn-primary"
        >
          {status === 'running' ? '⏳ Sincronizando...' : '🚀 Iniciar Sincronización'}
        </button>
        <button
          onClick={handleExport}
          className="btn btn-secondary"
        >
          📥 Exportar Config
        </button>
        <label className="btn btn-secondary">
          📤 Importar Config
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button
          onClick={resetConfig}
          className="btn btn-secondary"
        >
          🔄 Restablecer
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'general' as const, label: 'General' },
          { id: 'filters' as const, label: 'Filtros' },
          { id: 'content' as const, label: 'Contenido' },
          { id: 'advanced' as const, label: 'Avanzado' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="config-panel">
        {activeTab === 'general' && (
          <div className="form-grid">
            <div className="form-field">
              <label className="form-field-label">
                Máximo de películas por ciclo
              </label>
              <input
                type="number"
                className="form-input"
                value={config.maxMovies}
                onChange={(e) => updateConfig({ maxMovies: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
              <p className="form-field-hint">
                Número máximo de películas a sincronizar en cada ejecución
              </p>
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Programación de ejecución
              </label>
              <select
                className="form-select"
                value={config.schedule}
                onChange={(e) => updateConfig({ schedule: e.target.value })}
              >
                <option value="0 3 * * *">Cada día a las 3:00 AM</option>
                <option value="0 6 * * *">Cada día a las 6:00 AM</option>
                <option value="0 12 * * *">Cada día a las 12:00 PM</option>
                <option value="0 18 * * *">Cada día a las 6:00 PM</option>
                <option value="0 */6 * * *">Cada 6 horas</option>
                <option value="0 */4 * * *">Cada 4 horas</option>
                <option value="0 */2 * * *">Cada 2 horas</option>
                <option value="0 * * * *">Cada hora</option>
                <option value="0 0 * * 0">Cada domingo a las 12:00 AM</option>
                <option value="0 0 * * 1">Cada lunes a las 12:00 AM</option>
                <option value="0 0 1 * *">El 1 de cada mes a las 12:00 AM</option>
                <option value="custom">Personalizado (ingresa cron manual)</option>
              </select>
              {config.schedule === 'custom' && (
                <input
                  type="text"
                  className="form-input"
                  value={config.customSchedule || ''}
                  onChange={(e) => updateConfig({ customSchedule: e.target.value })}
                  placeholder="0 3 * * *"
                  style={{ marginTop: '8px' }}
                />
              )}
              <p className="form-field-hint">
                Selecciona con qué frecuencia se ejecutará la sincronización automáticamente
              </p>
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Delay entre películas (ms)
              </label>
              <input
                type="number"
                className="form-input"
                value={config.delayBetweenMovies}
                onChange={(e) => updateConfig({ delayBetweenMovies: parseInt(e.target.value) })}
                min="0"
                max="5000"
                step="100"
              />
              <p className="form-field-hint">
                Tiempo de espera entre cada película para evitar rate limiting
              </p>
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="form-grid">
            <div className="form-field">
              <label className="form-field-label">
                Popularidad mínima
              </label>
              <input
                type="number"
                className="form-input"
                value={config.minPopularity}
                onChange={(e) => updateConfig({ minPopularity: parseFloat(e.target.value) })}
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Voto promedio mínimo
              </label>
              <input
                type="number"
                className="form-input"
                value={config.minVoteAverage}
                onChange={(e) => updateConfig({ minVoteAverage: parseFloat(e.target.value) })}
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Conteo de votos mínimo
              </label>
              <input
                type="number"
                className="form-input"
                value={config.minVoteCount}
                onChange={(e) => updateConfig({ minVoteCount: parseInt(e.target.value) })}
                min="0"
              />
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Año de inicio
              </label>
              <input
                type="number"
                className="form-input"
                value={config.releaseYearStart || ''}
                onChange={(e) => updateConfig({ releaseYearStart: e.target.value ? parseInt(e.target.value) : null })}
                min="1900"
                max="2030"
                placeholder="Ej: 2000"
              />
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Año de fin
              </label>
              <input
                type="number"
                className="form-input"
                value={config.releaseYearEnd || ''}
                onChange={(e) => updateConfig({ releaseYearEnd: e.target.value ? parseInt(e.target.value) : null })}
                min="1900"
                max="2030"
                placeholder="Ej: 2024"
              />
            </div>

            <div className="form-field">
              <label className="form-field-label">
                Idioma original
              </label>
              <input
                type="text"
                className="form-input"
                value={config.originalLanguage || ''}
                onChange={(e) => updateConfig({ originalLanguage: e.target.value || null })}
                placeholder="Ej: es, en"
                maxLength={2}
              />
              <p className="form-field-hint">
                Código ISO 639-1 (dejar vacío para todos)
              </p>
            </div>

            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field-label">
                Géneros a sincronizar
              </label>
              <div className="chip-group">
                {availableGenres.map((genre) => (
                  <label
                    key={genre.id}
                    className={`chip ${config.genres.includes(genre.id) ? 'active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={config.genres.includes(genre.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateConfig({ genres: [...config.genres, genre.id] });
                        } else {
                          updateConfig({ genres: config.genres.filter(g => g !== genre.id) });
                        }
                      }}
                    />
                    {genre.name}
                  </label>
                ))}
              </div>
              <p className="form-field-hint">
                Selecciona los géneros que deseas sincronizar (dejar vacío para todos)
              </p>
            </div>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={config.includeAdult}
                onChange={(e) => updateConfig({ includeAdult: e.target.checked })}
              />
              Incluir contenido adulto
            </label>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-grid">
            <div>
              <h3 className="section-title">
                Qué sincronizar
              </h3>
              <div className="checkbox-group">
                {[
                  { key: 'syncGenres' as const, label: 'Géneros' },
                  { key: 'syncCredits' as const, label: 'Créditos (actores y crew)' },
                  { key: 'syncVideos' as const, label: 'Vídeos (trailers, teasers)' },
                  { key: 'syncWatchProviders' as const, label: 'Watch Providers' },
                  { key: 'syncRatings' as const, label: 'Ratings TMDB' },
                ].map((item) => (
                  <label key={item.key} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={config[item.key]}
                      onChange={(e) => updateConfig({ [item.key]: e.target.checked })}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="section-title">
                Créditos
              </h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-field-label">
                    Máximo de actores
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={config.maxCast}
                    onChange={(e) => updateConfig({ maxCast: parseInt(e.target.value) })}
                    min="0"
                    max="50"
                  />
                </div>
                <div className="form-field">
                  <label className="form-field-label">
                    Máximo de crew
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={config.maxCrew}
                    onChange={(e) => updateConfig({ maxCrew: parseInt(e.target.value) })}
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="section-title">
                Vídeos
              </h3>
              <div className="form-grid">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={config.includeOfficialOnly}
                    onChange={(e) => updateConfig({ includeOfficialOnly: e.target.checked })}
                  />
                  Solo oficiales
                </label>
              </div>
            </div>

            <div>
              <h3 className="section-title">
                Regiones de Watch Providers
              </h3>
              <div className="chip-group">
                {['ES', 'MX', 'AR', 'CO', 'US', 'GB', 'FR', 'DE', 'IT', 'BR'].map((region) => (
                  <label
                    key={region}
                    className={`chip ${config.providerRegions.includes(region) ? 'active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={config.providerRegions.includes(region)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateConfig({ providerRegions: [...config.providerRegions, region] });
                        } else {
                          updateConfig({ providerRegions: config.providerRegions.filter(r => r !== region) });
                        }
                      }}
                    />
                    {region}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="content-grid">
            <div>
              <h3 className="section-title">
                Comportamiento de sincronización
              </h3>
              <div className="checkbox-group">
                {[
                  { key: 'skipExisting' as const, label: 'Saltar películas que ya existen en la base de datos' },
                  { key: 'updateExisting' as const, label: 'Actualizar películas existentes' },
                  { key: 'preserveEditorial' as const, label: 'Preservar contenido editorial (reviews, ratings, verdicts)' },
                  { key: 'preserveSeo' as const, label: 'Preservar metadatos SEO personalizados' },
                ].map((item) => (
                  <label key={item.key} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={config[item.key]}
                      onChange={(e) => updateConfig({ [item.key]: e.target.checked })}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="section-title">
                Valores por defecto para nuevas películas
              </h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-field-label">
                    Estado inicial
                  </label>
                  <select
                    className="form-select"
                    value={config.defaultStatus}
                    onChange={(e) => updateConfig({ defaultStatus: e.target.value as any })}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={config.defaultNoindex}
                    onChange={(e) => updateConfig({ defaultNoindex: e.target.checked })}
                  />
                  No indexar por defecto
                </label>
                <p className="form-field-hint">
                  Las nuevas películas no aparecerán en buscadores
                </p>

                <div className="form-field">
                  <label className="form-field-label">
                    Prioridad en sitemap
                  </label>
                  <select
                    className="form-select"
                    value={config.defaultSitemapPriority}
                    onChange={(e) => updateConfig({ defaultSitemapPriority: e.target.value as any })}
                  >
                    <option value="high">Alta (0.9)</option>
                    <option value="medium">Media (0.7)</option>
                    <option value="low">Baja (0.5)</option>
                    <option value="minimal">Mínima (0.3)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
