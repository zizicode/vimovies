import { useState, useEffect, useRef } from 'react';
import { TiArrowSortedDown, TiEdit } from 'react-icons/ti';
import type { MediaItem } from './types';
import './GeneralTab.scss';
import { useGenresStore } from '../../store/genres.store';

interface GeneralTabProps {
  movie: MediaItem;
  onSave?: (updatedMovie: MediaItem) => void;
}

export default function GeneralTab({ movie, onSave }: GeneralTabProps) {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMovie, setEditedMovie] = useState<MediaItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);
  const { genres, fetchGenres, getGenreNamesByIds } = useGenresStore();

  // Scroll to form when editing mode opens
  useEffect(() => {
    if (isEditing && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEditing]);

  // Load available genres
  useEffect(() => {
    fetchGenres();
  }, []);

  const getPosterUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getBackdropUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  const handleStartEdit = () => {
    setEditedMovie({ ...movie });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedMovie(movie);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof MediaItem, value: any) => {
    if (editedMovie) {
      setEditedMovie({ ...editedMovie, [field]: value });
    }
  };

  const handleGenreToggle = (genreId: number) => {
    if (editedMovie) {
      const currentGenreIds = editedMovie.genre_ids || [];
      const exists = currentGenreIds.includes(genreId);
      
      let newGenreIds;
      if (exists) {
        newGenreIds = currentGenreIds.filter(id => id !== genreId);
      } else {
        newGenreIds = [...currentGenreIds, genreId];
      }
      
      setEditedMovie({ ...editedMovie, genre_ids: newGenreIds });
    }
  };

  const handleSave = async () => {
    if (!editedMovie) return;
    setIsSaving(true);
    if (onSave) {
      await onSave(editedMovie);
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <>
      {/* Hero Section */}
      {movie.backdrop_path && (
        <div className="hero-section" style={{ backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})` }}>
          <div className="hero-overlay" />
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {/* Poster */}
        {movie.poster_path && (
          <img
            className="movie-poster"
            src={getPosterUrl(movie.poster_path)!}
            alt={movie.title_es || movie.original_title}
          />
        )}

        {/* Info */}
        <div className="movie-info">
          <h3 className="movie-title">
            {movie.title_es || movie.original_title}
          </h3>
          {movie.title_es && movie.title_es !== movie.original_title && (
            <p className="movie-original-title">
              {movie.original_title}
            </p>
          )}
          <div className="movie-meta">
            <span className={`badge ${
              movie.status === 'published' ? 'badge-green' : 
              movie.status === 'draft' ? 'badge-gold' : 
              movie.status === 'archived' ? 'badge-gray' : 'badge-gray'
            }`}>
              {movie.status === 'published' ? 'Publicado' : 
               movie.status === 'draft' ? 'Borrador' : 
               movie.status === 'archived' ? 'Archivado' : movie.status}
            </span>
            {movie.tmdb_popularity && (
              <span className="badge badge-gold">
                Popularidad: {movie.tmdb_popularity.toFixed(1)}
              </span>
            )}
          </div>
          {movie.release_date && (
            <p className="movie-meta-item">
              Estreno: {new Date(movie.release_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          {movie.runtime_minutes && (
            <p className="movie-meta-item">
              Duración: {movie.runtime_minutes} min
            </p>
          )}
          {movie.genre_ids && movie.genre_ids.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getGenreNamesByIds(movie.genre_ids).map(genre => (
                  <span key={genre.id} className="badge badge-gray">
                    {genre.name_es}
                  </span>
                ))}
              </div>
            </div>
          )}
          {movie.synopsis_es && (
            <p className="movie-synopsis">
              {movie.synopsis_es}
            </p>
          )}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="metadata-grid">
        <div className="metadata-item">
          <div className="metadata-key">TMDB ID</div>
          <div className="metadata-value">{movie.tmdb_id}</div>
        </div>
        <div className="metadata-item">
          <div className="metadata-key">IMDb ID</div>
          <div className="metadata-value">{movie.imdb_id || '-'}</div>
        </div>
        <div className="metadata-item">
          <div className="metadata-key">Estado</div>
          <div className="metadata-value">{movie.status}</div>
        </div>
        <div className="metadata-item">
          <div className="metadata-key">Popularidad</div>
          <div className="metadata-value">{movie.tmdb_popularity?.toFixed(1) || '-'}</div>
        </div>
        <div className="metadata-item">
          <div className="metadata-key">Actualizado</div>
          <div className="metadata-value">
            {new Date(movie.updated_at).toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>


      {/* HTML Template Preview - Accordion */}
      <div className="template-accordion">
        <button
          className="template-button"
          onClick={() => setIsTemplateOpen(!isTemplateOpen)}
        >
          Template HTML
          <TiArrowSortedDown className={`template-icon ${isTemplateOpen ? 'open' : ''}`} />
        </button>
        {isTemplateOpen && (
          <div className="template-content">
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>🇪🇸 Español</h4>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
{`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${movie.title_es || movie.original_title}</title>
  <meta name="description" content="${movie.title_es || movie.original_title}">
</head>
<body>
  <article itemscope itemtype="https://schema.org/Movie">
    <h1 itemprop="name">${movie.title_es || movie.original_title}</h1>
    ${movie.title_es && movie.title_es !== movie.original_title ? 
      `<meta itemprop="alternateName" content="${movie.original_title}">` : ''}
    <meta itemprop="datePublished" content="${movie.release_date || ''}">
    <meta itemprop="identifier" content="${movie.tmdb_id}">
    
    <div class="movie-poster">
      <img src="${getPosterUrl(movie.poster_path) || ''}" 
           alt="${movie.title_es || movie.original_title}"
           itemprop="image">
    </div>
    
    <div class="movie-info">
      <span class="status status-${movie.status}">
        ${movie.status === 'published' ? 'Publicado' : 
          movie.status === 'draft' ? 'Borrador' : 
          movie.status === 'archived' ? 'Archivado' : movie.status}
      </span>
      ${movie.tmdb_popularity ? 
        `<span class="popularity">Popularidad: ${movie.tmdb_popularity.toFixed(1)}</span>` : ''}
    </div>
  </article>
</body>
</html>`}
            </pre>
            
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>🇬🇧 English</h4>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${movie.title_en || movie.original_title}</title>
  <meta name="description" content="${movie.title_en || movie.original_title}">
</head>
<body>
  <article itemscope itemtype="https://schema.org/Movie">
    <h1 itemprop="name">${movie.title_en || movie.original_title}</h1>
    ${movie.title_en && movie.title_en !== movie.original_title ? 
      `<meta itemprop="alternateName" content="${movie.original_title}">` : ''}
    <meta itemprop="datePublished" content="${movie.release_date || ''}">
    <meta itemprop="identifier" content="${movie.tmdb_id}">
    
    <div class="movie-poster">
      <img src="${getPosterUrl(movie.poster_path) || ''}" 
           alt="${movie.title_en || movie.original_title}"
           itemprop="image">
    </div>
    
    <div class="movie-info">
      <span class="status status-${movie.status}">
        ${movie.status === 'published' ? 'Published' : 
          movie.status === 'draft' ? 'Draft' : 
          movie.status === 'archived' ? 'Archived' : movie.status}
      </span>
      ${movie.tmdb_popularity ? 
        `<span class="popularity">Popularity: ${movie.tmdb_popularity.toFixed(1)}</span>` : ''}
    </div>
  </article>
</body>
</html>`}
            </pre>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {!isEditing && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary"
            onClick={handleStartEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <TiEdit /> Editar información
          </button>
        </div>
      )}

      {/* Editable Fields */}
      {isEditing && editedMovie && (
        <div className="edit-form" ref={editFormRef}>
          <div className="edit-form-header">
            <h3 className="edit-form-title">
              Editar Información
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost" onClick={handleCancelEdit} disabled={isSaving}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
          
          {/* Two Column Layout */}
          <div className="form-columns">
            <div className="form-divider" />
            
            {/* Spanish Column */}
            <div className="form-column column-es">
              <h4>🇪🇸 Español</h4>
              
              <div className="form-field">
                <label className="form-field-label">
                  Título
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editedMovie.title_es || ''}
                  onChange={(e) => handleFieldChange('title_es', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Sinopsis
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.synopsis_es || ''}
                  onChange={(e) => handleFieldChange('synopsis_es', e.target.value)}
                  rows={6}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Veredicto Editorial
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.editorial_verdict_es || ''}
                  onChange={(e) => handleFieldChange('editorial_verdict_es', e.target.value)}
                  rows={4}
                  placeholder="Tagline corto (ej: Una obra maestra del cine moderno)"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Reseña Editorial
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.editorial_review_es || ''}
                  onChange={(e) => handleFieldChange('editorial_review_es', e.target.value)}
                  rows={8}
                  placeholder="Reseña completa y detallada de la película"
                />
              </div>
            </div>

            {/* English Column */}
            <div className="form-column column-en">
              <h4>🇬🇧 English</h4>
              
              <div className="form-field">
                <label className="form-field-label">
                  Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editedMovie.title_en || ''}
                  onChange={(e) => handleFieldChange('title_en', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Synopsis
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.synopsis_en || ''}
                  onChange={(e) => handleFieldChange('synopsis_en', e.target.value)}
                  rows={6}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Editorial Verdict
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.editorial_verdict_en || ''}
                  onChange={(e) => handleFieldChange('editorial_verdict_en', e.target.value)}
                  rows={4}
                  placeholder="Short tagline (e.g: A masterpiece of modern cinema)"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Editorial Review
                </label>
                <textarea
                  className="form-textarea"
                  value={editedMovie.editorial_review_en || ''}
                  onChange={(e) => handleFieldChange('editorial_review_en', e.target.value)}
                  rows={8}
                  placeholder="Complete and detailed movie review"
                />
              </div>
            </div>
          </div>

          {/* Common Fields */}
          <div className="common-fields">
            <h4 className="common-fields-title">
              ⚙️ Campos Comunes
            </h4>
            
            <div className="common-fields-grid">
              <div className="form-field">
                <label className="form-field-label">
                  Estado
                </label>
                <select
                  className="form-select"
                  value={editedMovie.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Rating Editorial
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editedMovie.editorial_rating || ''}
                  onChange={(e) => handleFieldChange('editorial_rating', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Duración (min)
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={editedMovie.runtime_minutes || ''}
                  onChange={(e) => handleFieldChange('runtime_minutes', parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Genres Selection */}
            <div style={{ marginTop: '16px' }}>
              <label className="form-field-label">
                Géneros
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {genres.map(genre => {
                  const isSelected = editedMovie.genre_ids?.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleGenreToggle(genre.id)}
                      className={`badge ${isSelected ? 'badge-gold' : 'badge-gray'}`}
                      style={{
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--gold)' : '1px solid transparent',
                      }}
                    >
                      {genre.name_es}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEO Configuration */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--gold)' }}>
                ⚙️ Configuración SEO
              </h4>

              <div className="form-field">
                <label className="form-field-label">
                  Estado de Indexación
                </label>
                <select
                  className="form-select"
                  value={editedMovie.noindex ? 'true' : 'false'}
                  onChange={(e) => handleFieldChange('noindex', e.target.value === 'true')}
                >
                  <option value="false">Indexar (visible en buscadores)</option>
                  <option value="true">No indexar (oculto en buscadores)</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  Si seleccionas "No indexar", esta película no aparecerá en los sitemaps ni será indexada por Google.
                </p>
              </div>

              <div className="form-field">
                <label className="form-field-label">
                  Prioridad en Sitemap
                </label>
                <select
                  className="form-select"
                  value={editedMovie.sitemap_priority || 'medium'}
                  onChange={(e) => handleFieldChange('sitemap_priority', e.target.value)}
                >
                  <option value="high">Alta (0.9) - Películas principales</option>
                  <option value="medium">Media (0.7) - Películas estándar</option>
                  <option value="low">Baja (0.5) - Películas menos importantes</option>
                  <option value="minimal">Mínima (0.3) - Contenido marginal</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  Define la frecuencia de rastreo y prioridad en los motores de búsqueda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
