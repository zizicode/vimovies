import {
  TiPlus,
  TiFilter,
  TiPencil,
  TiTrash,
  TiChevronLeft,
  TiChevronRight,
  TiTick
} from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import { useMediaStore } from '../store';
import { useGenresStore } from '../store/genres.store';
import { useEffect, useState } from 'react';
import VistaPrevia from '../components/VistaPrevia';
import type { MediaItem } from '../services/api.service';

export default function Peliculas() {
  const {
    movies,
    total,
    currentPage,
    perPage,
    loading,
    error,
    filters,
    fetchMovies,
    setFilters,
    setPage,
    deleteMovie,
    patchMovie,
  } = useMediaStore();

  const { genres, fetchGenres, getGenreNamesByIds } = useGenresStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedMovies, setDisplayedMovies] = useState(movies);
  const [activeTab, setActiveTab] = useState<'list' | 'preview'>('list');
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);

  const totalPages = Math.ceil(total / perPage);

  // Cargar películas al montar el componente y cuando cambia la página o filtros
  useEffect(() => {
    fetchMovies();
  }, [currentPage, filters]); // Cargar cuando cambia página o filtros

  // Cargar géneros al montar
  useEffect(() => {
    fetchGenres();
  }, []);

  // Transición suave cuando cambian las películas
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayedMovies(movies);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [movies]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ status: e.target.value as any });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split(':') as ['tmdb_popularity' | 'release_date' | 'editorial_rating', 'asc' | 'desc'];
    setFilters({ sortBy, sortOrder });
  };

  const handleGenreFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ genreId: e.target.value ? Number(e.target.value) : '' });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setPage(newPage);
    }
  };

  const handleEdit = (movie: MediaItem) => {
    setSelectedMovie(movie);
    setActiveTab('preview');
  };

  const handleSaveMovie = async (updatedMovie: MediaItem) => {
    // Filter only allowed fields for patch
    const allowedFields: (keyof MediaItem)[] = [
      'title_es', 'title_en', 'synopsis_es', 'synopsis_en',
      'editorial_review_es', 'editorial_review_en', 'editorial_rating',
      'editorial_verdict_es', 'editorial_verdict_en',
      'poster_path', 'backdrop_path', 'logo_path',
      'seo_title_es', 'seo_title_en', 'seo_description_es', 'seo_description_en',
      'og_image_url', 'status', 'noindex', 'is_prerendered', 'sitemap_priority',
      'canonical_url_es', 'canonical_url_en'
    ];
    
    const patchData: any = {};
    allowedFields.forEach(field => {
      if (updatedMovie[field] !== undefined) {
        patchData[field] = updatedMovie[field];
      }
    });
    
    await patchMovie(updatedMovie.id, patchData);
    setSelectedMovie(updatedMovie);
  };

  const handleBack = () => {
    setActiveTab('list');
    setSelectedMovie(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta película?')) {
      await deleteMovie(id);
    }
  };

  const getPosterUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w92${path}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-green">Publicado</span>;
      case 'draft':
        return <span className="badge badge-gold">Borrador</span>;
      case 'archived':
        return <span className="badge badge-gray">Archivado</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  // Count empty fields for Spanish version
  const countEmptyFieldsES = (movie: MediaItem): number => {
    const esFields = [
      movie.title_es,
      movie.synopsis_es,
      movie.editorial_review_es,
      movie.editorial_verdict_es,
      movie.seo_title_es,
      movie.seo_description_es,
    ];
    
    // Also count shared image fields
    const imageFields = [
      movie.poster_path,
      movie.backdrop_path,
      movie.logo_path,
      movie.og_image_url,
    ];
    
    const emptyEsFields = esFields.filter(field => !field || field.trim() === '').length;
    const emptyImageFields = imageFields.filter(field => !field || field.trim() === '').length;
    
    return emptyEsFields + emptyImageFields;
  };

  // Count empty fields for English version
  const countEmptyFieldsEN = (movie: MediaItem): number => {
    const enFields = [
      movie.title_en,
      movie.synopsis_en,
      movie.editorial_review_en,
      movie.editorial_verdict_en,
      movie.seo_title_en,
      movie.seo_description_en,
    ];
    
    // Also count shared image fields
    const imageFields = [
      movie.poster_path,
      movie.backdrop_path,
      movie.logo_path,
      movie.og_image_url,
    ];
    
    const emptyEnFields = enFields.filter(field => !field || field.trim() === '').length;
    const emptyImageFields = imageFields.filter(field => !field || field.trim() === '').length;
    
    return emptyEnFields + emptyImageFields;
  };

  // Render version status (check if complete or show count)
  const renderVersionStatus = (emptyCount: number) => {
    if (emptyCount === 0) {
      return (
        <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TiTick size={18} />
        </span>
      );
    }
    return (
      <span style={{ 
        color: emptyCount > 5 ? 'var(--red)' : emptyCount > 2 ? 'var(--gold)' : 'var(--blue)',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        {emptyCount}
      </span>
    );
  };

  if (loading && movies.length === 0) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando películas...</div>
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
      {activeTab === 'list' ? (
        <>
          {/* Section Header */}
          <div className="section-header">
            <div>
              <div className="section-title">Películas</div>
              <div className="section-sub">Gestión del catálogo de películas</div>
            </div>
            <button className="btn btn-primary">
              <TiPlus /> Añadir película
            </button>
          </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <TbSearch style={{ color: 'var(--text3)', fontSize: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar por título..." 
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-group">
          <button className="btn btn-ghost">
            <TiFilter /> Filtros
          </button>
          <select className="select" value={filters.status} onChange={handleStatusFilter}>
            <option value="">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
          <select className="select" value={filters.genreId} onChange={handleGenreFilter}>
            <option value="">Todos los géneros</option>
            {genres.map(genre => (
              <option key={genre.id} value={genre.id.toString()}>{genre.name_es}</option>
            ))}
          </select>
          <select className="select" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={handleSortChange}>
            <option value="tmdb_popularity:desc">Ordenar por: Popularidad</option>
            <option value="release_date:desc">Ordenar por: Recientes</option>
            <option value="release_date:asc">Ordenar por: Antiguos</option>
            <option value="editorial_rating:desc">Ordenar por: Rating</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-count">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--green)' }}>{movies.filter(m => m.status === 'published').length}</span>
          <span className="stat-label">Publicado</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--gold)' }}>{movies.filter(m => m.status === 'draft').length}</span>
          <span className="stat-label">Borrador</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--text3)' }}>{movies.filter(m => m.status === 'archived').length}</span>
          <span className="stat-label">Archivado</span>
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

      {/* Movies Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}></th>
                <th>Título</th>
                <th>Año</th>
                <th>Género</th>
                <th>Estado</th>
                <th>Popularidad</th>
                <th>V_ES</th>
                <th>V_EN</th>
                <th>Actualizado</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedMovies.map((movie, index) => (
                <tr 
                  key={movie.id}
                  style={{
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                    transition: `opacity 0.2s ease, transform 0.2s ease ${index * 0.02}s`,
                  }}
                >
                  <td style={{ padding: '12px 8px 12px 14px' }}>
                    {movie.poster_path && (
                      <img 
                        className="poster-thumb" 
                        src={getPosterUrl(movie.poster_path)!}
                        alt={movie.title_es || movie.original_title}
                      />
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{movie.title_es || movie.original_title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{movie.slug}</div>
                  </td>
                  <td>{movie.release_date ? new Date(movie.release_date).getFullYear() : '-'}</td>
                  <td>
                    {movie.genre_ids && movie.genre_ids.length > 0 ? (
                      <span className="badge badge-gray">
                        {getGenreNamesByIds(movie.genre_ids).map(g => g.name_es).join(', ')}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{getStatusBadge(movie.status)}</td>
                  <td><span className="score-val">{movie.tmdb_popularity?.toFixed(1) || '-'}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    {renderVersionStatus(countEmptyFieldsES(movie))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {renderVersionStatus(countEmptyFieldsEN(movie))}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {new Date(movie.updated_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                    <div className="action-group">
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => handleEdit(movie)}
                      >
                        <TiPencil />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar"
                        onClick={() => handleDelete(movie.id)}
                      >
                        <TiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedMovies.length === 0 && (
                <tr style={{
                  opacity: isTransitioning ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    No hay películas encontradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <VistaPrevia movie={selectedMovie} onBack={handleBack} onSave={handleSaveMovie} />
      )}

    </div>
  );
}
