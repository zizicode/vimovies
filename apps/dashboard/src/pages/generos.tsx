import {
  TiPlus,
  TiPencil,
  TiTrash,
  TiChevronLeft,
  TiChevronRight,
  TiFilter
} from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import { useGenresStore } from '../store/genres.store';
import { useEffect, useState } from 'react';
import GenreEditor from '../components/GenreEditor';
import type { GenreItem } from '../services/api.service';

export default function Generos() {
  const {
    genres,
    loading,
    error,
    total,
    currentPage,
    perPage,
    filters,
    fetchGenres,
    createGenre,
    updateGenre,
    removeGenre,
    setPage,
    setFilters
  } = useGenresStore();

  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [selectedGenre, setSelectedGenre] = useState<GenreItem | null>(null);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleAddGenre = () => {
    setSelectedGenre(null);
    setActiveView('editor');
  };

  const handleEditGenre = (genre: GenreItem) => {
    setSelectedGenre(genre);
    setActiveView('editor');
  };

  const handleSaveGenre = async (genre: GenreItem) => {
    if (genre.id) {
      await updateGenre(genre.id, genre);
    } else {
      await createGenre(genre);
    }
    setActiveView('list');
    setSelectedGenre(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este género?')) {
      await removeGenre(id);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    fetchGenres();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / perPage);

  if (activeView === 'editor') {
    return (
      <div className="view active">
        <GenreEditor
          genre={selectedGenre}
          onBack={() => setActiveView('list')}
          onSave={handleSaveGenre}
        />
      </div>
    );
  }

  if (loading && genres.length === 0) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando géneros...</div>
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
          <div className="section-title">Géneros</div>
          <div className="section-sub">Gestión de géneros del sistema</div>
        </div>
        <button className="btn btn-primary" onClick={handleAddGenre}>
          <TiPlus /> Agregar Género
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <TbSearch style={{ color: 'var(--text3)', fontSize: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar géneros..." 
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
          <span className="stat-count" style={{ color: 'var(--green)' }}>{genres.filter(g => g.name_es).length}</span>
          <span className="stat-label">Con nombre ES</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--blue)' }}>{genres.filter(g => g.name_en).length}</span>
          <span className="stat-label">Con nombre EN</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--gold)' }}>{genres.filter(g => g.cover_image_url).length}</span>
          <span className="stat-label">Con imagen</span>
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

      {/* Genres Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {genres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              No se encontraron géneros
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Español</th>
                  <th>Nombre Inglés</th>
                  <th>Slug</th>
                  <th>TMDB ID</th>
                  <th>Imagen</th>
                  <th>Creado</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {genres.map((genre) => (
                  <tr key={genre.id}>
                    <td>{genre.id}</td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{genre.name_es}</div>
                    </td>
                    <td>{genre.name_en}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{genre.slug}</code>
                    </td>
                    <td>{genre.tmdb_id}</td>
                    <td>
                      {genre.cover_image_url && (
                        <img
                          src={genre.cover_image_url}
                          alt={genre.name_es}
                          style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {formatDate(genre.created_at)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                      <div className="action-group">
                        <button 
                          className="btn-icon" 
                          title="Editar"
                          onClick={() => handleEditGenre(genre)}
                        >
                          <TiPencil />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Eliminar"
                          onClick={() => handleDelete(genre.id)}
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
