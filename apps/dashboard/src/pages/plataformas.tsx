import {
  TiPlus,
  TiPencil,
  TiTrash,
  TiChevronLeft,
  TiChevronRight,
  TiFilter
} from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import { usePlatformsStore } from '../store/platforms.store';
import { useEffect, useState } from 'react';
import PlatformEditor from '../components/PlatformEditor';
import type { PlatformItem } from '../services/api.service';

export default function Plataformas() {
  const {
    platforms,
    loading,
    error,
    total,
    currentPage,
    perPage,
    filters,
    fetchPlatforms,
    createPlatform,
    updatePlatform,
    removePlatform,
    setPage,
    setFilters
  } = usePlatformsStore();

  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformItem | null>(null);

  useEffect(() => {
    console.log('Platforms page - fetching platforms...');
    fetchPlatforms();
  }, [fetchPlatforms]);

  useEffect(() => {
    console.log('Platforms page - platforms updated:', platforms);
  }, [platforms]);

  const handleAddPlatform = () => {
    setSelectedPlatform(null);
    setActiveView('editor');
  };

  const handleEditPlatform = (platform: PlatformItem) => {
    setSelectedPlatform(platform);
    setActiveView('editor');
  };

  const handleSavePlatform = async (platform: PlatformItem) => {
    if (platform.id) {
      await updatePlatform(platform.id, platform);
    } else {
      await createPlatform(platform);
    }
    setActiveView('list');
    setSelectedPlatform(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta plataforma?')) {
      await removePlatform(id);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    fetchPlatforms();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / perPage);

  if (activeView === 'editor') {
    return (
      <div className="view active">
        <PlatformEditor
          platform={selectedPlatform}
          onBack={() => setActiveView('list')}
          onSave={handleSavePlatform}
        />
      </div>
    );
  }

  if (loading && platforms.length === 0) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando plataformas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--red)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="view active">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Plataformas</div>
          <div className="section-sub">Gestión de plataformas de streaming</div>
        </div>
        <button className="btn btn-primary" onClick={handleAddPlatform}>
          <TiPlus /> Agregar Plataforma
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <TbSearch style={{ color: 'var(--text3)', fontSize: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar plataformas..." 
            value={filters.search || ''}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-group">
          <button className="btn btn-ghost">
            <TiFilter /> Filtros
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-count">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--green)' }}>
            {platforms.filter(p => p.name_es).length}
          </span>
          <span className="stat-label">Con nombre ES</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--blue)' }}>
            {platforms.filter(p => p.name_en).length}
          </span>
          <span className="stat-label">Con nombre EN</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--gold)' }}>
            {platforms.filter(p => p.is_active).length}
          </span>
          <span className="stat-label">Activas</span>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination pagination-centered">
        <button 
          className="btn btn-ghost" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <TiChevronLeft /> Anterior
        </button>
        <span className="page-info">
          Página {currentPage} de {totalPages || 1}
        </span>
        <button 
          className="btn btn-ghost"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
        >
          Siguiente <TiChevronRight />
        </button>
      </div>

      {/* Platforms Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {platforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              No se encontraron plataformas
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Español</th>
                  <th>Nombre Inglés</th>
                  <th>Slug</th>
                  <th>Tipo</th>
                  <th>TMDB ID</th>
                  <th>Activa</th>
                  <th>Orden</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr key={platform.id}>
                    <td>{platform.id}</td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{platform.name_es}</div>
                    </td>
                    <td>{platform.name_en}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{platform.slug}</code>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: platform.platform_type === 'streaming' ? 'var(--blue)' : 'var(--gray)',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {platform.platform_type}
                      </span>
                    </td>
                    <td>{platform.tmdb_provider_id || '-'}</td>
                    <td>
                      <span className={`badge ${platform.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {platform.is_active ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>{platform.display_order}</td>
                    <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                      <div className="action-group">
                        <button 
                          className="btn-icon" 
                          title="Editar"
                          onClick={() => handleEditPlatform(platform)}
                        >
                          <TiPencil />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Eliminar"
                          onClick={() => handleDelete(platform.id)}
                        >
                          <TiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="pagination pagination-centered">
          <button 
            className="btn btn-ghost" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <TiChevronLeft /> Anterior
          </button>
          <span className="page-info">
            Página {currentPage} de {totalPages || 1}
          </span>
          <button 
            className="btn btn-ghost"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
          >
            Siguiente <TiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
