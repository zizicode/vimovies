import { useState, useEffect } from 'react';
import { TiArrowBack } from 'react-icons/ti';
import type { GenreItem } from '../services/api.service';
import { useGenresStore } from '../store/genres.store';

interface GenreEditorProps {
  genre?: GenreItem | null;
  onBack: () => void;
  onSave?: (genre: GenreItem) => void;
}

export default function GenreEditor({ genre, onBack, onSave }: GenreEditorProps) {
  const [formData, setFormData] = useState({
    tmdb_id: genre?.tmdb_id || 0,
    name_es: genre?.name_es || '',
    name_en: genre?.name_en || '',
    slug: genre?.slug || '',
    seo_title_es: genre?.seo_title_es || '',
    seo_title_en: genre?.seo_title_en || '',
    seo_description_es: genre?.seo_description_es || '',
    seo_description_en: genre?.seo_description_en || '',
    description_es: genre?.description_es || '',
    description_en: genre?.description_en || '',
    cover_image_url: genre?.cover_image_url || '',
    sitemap_priority: genre?.sitemap_priority || '0.5',
  });

  const [isSaving, setIsSaving] = useState(false);
  const { updateGenre } = useGenresStore();

  useEffect(() => {
    if (genre) {
      setFormData({
        tmdb_id: genre.tmdb_id,
        name_es: genre.name_es,
        name_en: genre.name_en,
        slug: genre.slug,
        seo_title_es: genre.seo_title_es || '',
        seo_title_en: genre.seo_title_en || '',
        seo_description_es: genre.seo_description_es || '',
        seo_description_en: genre.seo_description_en || '',
        description_es: genre.description_es || '',
        description_en: genre.description_en || '',
        cover_image_url: genre.cover_image_url || '',
        sitemap_priority: genre.sitemap_priority || '0.5',
      });
    }
  }, [genre]);

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (genre?.id) {
      setIsSaving(true);
      try {
        // Filtrar solo los campos que se pueden actualizar
        const updateData = {
          name_es: formData.name_es,
          name_en: formData.name_en,
          seo_title_es: formData.seo_title_es,
          seo_title_en: formData.seo_title_en,
          seo_description_es: formData.seo_description_es,
          seo_description_en: formData.seo_description_en,
          description_es: formData.description_es,
          description_en: formData.description_en,
          cover_image_url: formData.cover_image_url,
          sitemap_priority: formData.sitemap_priority,
        };

        await updateGenre(genre.id, updateData);

        if (onSave) {
          onSave({ ...genre, ...formData } as GenreItem);
        }
        onBack();
      } catch (error) {
        console.error('Error saving genre:', error);
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="view active">
      {/* Section Header */}
      <div className="section-header">
        <button className="btn btn-secondary" onClick={onBack}>
          <TiArrowBack /> Volver
        </button>
        <div>
          <div className="section-title">{genre ? 'Editar Género' : 'Nuevo Género'}</div>
          <div className="section-sub">Información detallada del género</div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-grid">
            {/* Básico */}
            <div className="form-section">
              <h3 className="form-section-title">Básico</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">TMDB ID</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.tmdb_id}
                    onChange={(e) => handleFieldChange('tmdb_id', parseInt(e.target.value))}
                    disabled={!!genre}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange('slug', e.target.value)}
                    disabled={!!genre}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Español</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name_es}
                    onChange={(e) => handleFieldChange('name_es', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Inglés</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name_en}
                    onChange={(e) => handleFieldChange('name_en', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Descripciones */}
            <div className="form-section">
              <h3 className="form-section-title">Descripciones</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Descripción Español</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={formData.description_es}
                    onChange={(e) => handleFieldChange('description_es', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción Inglés</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={formData.description_en}
                    onChange={(e) => handleFieldChange('description_en', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="form-section">
              <h3 className="form-section-title">SEO</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título SEO Español</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.seo_title_es}
                    onChange={(e) => handleFieldChange('seo_title_es', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Título SEO Inglés</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.seo_title_en}
                    onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción SEO Español</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.seo_description_es}
                    onChange={(e) => handleFieldChange('seo_description_es', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción SEO Inglés</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.seo_description_en}
                    onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Imágenes y Multimedia */}
            <div className="form-section">
              <h3 className="form-section-title">Imágenes y Multimedia</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">URL Imagen Portada</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cover_image_url}
                    onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridad Sitemap</label>
                  <select
                    className="form-select"
                    value={formData.sitemap_priority}
                    onChange={(e) => handleFieldChange('sitemap_priority', e.target.value)}
                  >
                    <option value="0.1">0.1 - Baja</option>
                    <option value="0.5">0.5 - Media</option>
                    <option value="0.8">0.8 - Alta</option>
                    <option value="1.0">1.0 - Máxima</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
