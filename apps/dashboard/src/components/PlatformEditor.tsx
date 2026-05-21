import { useState, useEffect } from 'react';
import { TiArrowBack } from 'react-icons/ti';
import type { PlatformItem } from '../services/api.service';
import { usePlatformsStore } from '../store/platforms.store';

interface PlatformEditorProps {
  platform?: PlatformItem | null;
  onBack: () => void;
  onSave?: (platform: PlatformItem) => void;
}

export default function PlatformEditor({ platform, onBack, onSave }: PlatformEditorProps) {
  const [formData, setFormData] = useState({
    slug: platform?.slug ?? '',
    name_es: platform?.name_es ?? '',
    name_en: platform?.name_en ?? '',
    description_es: platform?.description_es ?? '',
    description_en: platform?.description_en ?? '',
    logo_url: platform?.logo_url ?? '',
    website_url: platform?.website_url ?? '',
    platform_type: platform?.platform_type ?? 'streaming',
    seo_title_es: platform?.seo_title_es ?? '',
    seo_title_en: platform?.seo_title_en ?? '',
    seo_description_es: platform?.seo_description_es ?? '',
    seo_description_en: platform?.seo_description_en ?? '',
    sitemap_priority: platform?.sitemap_priority ?? '0.5',
    affiliate_url_es: platform?.affiliate_url_es ?? '',
    affiliate_url_en: platform?.affiliate_url_en ?? '',
    affiliate_id: platform?.affiliate_id ?? '',
    tmdb_provider_id: platform?.tmdb_provider_id ?? null,
    is_active: platform?.is_active ?? true,
    display_order: platform?.display_order ?? 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const { updatePlatform, createPlatform } = usePlatformsStore();

  useEffect(() => {
    if (platform) {
      setFormData({
        slug: platform.slug,
        name_es: platform.name_es,
        name_en: platform.name_en,
        description_es: platform.description_es ?? '',
        description_en: platform.description_en ?? '',
        logo_url: platform.logo_url ?? '',
        website_url: platform.website_url ?? '',
        platform_type: platform.platform_type,
        seo_title_es: platform.seo_title_es ?? '',
        seo_title_en: platform.seo_title_en ?? '',
        seo_description_es: platform.seo_description_es ?? '',
        seo_description_en: platform.seo_description_en ?? '',
        sitemap_priority: platform.sitemap_priority,
        affiliate_url_es: platform.affiliate_url_es ?? '',
        affiliate_url_en: platform.affiliate_url_en ?? '',
        affiliate_id: platform.affiliate_id ?? '',
        tmdb_provider_id: platform.tmdb_provider_id ?? null,
        is_active: platform.is_active,
        display_order: platform.display_order,
      });
    } else {
      // Reset form for new platform
      setFormData({
        slug: '',
        name_es: '',
        name_en: '',
        description_es: '',
        description_en: '',
        logo_url: '',
        website_url: '',
        platform_type: 'streaming',
        seo_title_es: '',
        seo_title_en: '',
        seo_description_es: '',
        seo_description_en: '',
        sitemap_priority: '0.5',
        affiliate_url_es: '',
        affiliate_url_en: '',
        affiliate_id: '',
        tmdb_provider_id: null,
        is_active: true,
        display_order: 0,
      });
    }
  }, [platform]);

  const handleFieldChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (platform?.id) {
        // Update existing platform
        await updatePlatform(platform.id, formData);
      } else {
        // Create new platform
        await createPlatform(formData);
      }

      if (onSave) {
        onSave({ ...platform, ...formData } as PlatformItem);
      }
      onBack();
    } catch (error) {
      console.error('Error saving platform:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className="view active">
      {/* Section Header */}
      <div className="section-header">
        <button className="btn btn-secondary" onClick={onBack}>
          <TiArrowBack /> Volver
        </button>
        <div>
          <div className="section-title">{platform ? 'Editar Plataforma' : 'Nueva Plataforma'}</div>
          <div className="section-sub">Información detallada de la plataforma</div>
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
            {/* Información Básica */}
            <div className="form-section">
              <h3 className="form-section-title">Información Básica</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange('slug', e.target.value)}
                    placeholder="netflix, hbo-max, disney-plus"
                    disabled={!!platform}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Español</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name_es}
                    onChange={(e) => handleFieldChange('name_es', e.target.value)}
                    placeholder="Netflix, HBO Max, Disney+, etc."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Inglés</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name_en}
                    onChange={(e) => handleFieldChange('name_en', e.target.value)}
                    placeholder="Netflix, HBO Max, Disney+, etc."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Plataforma</label>
                  <select
                    className="form-select"
                    value={formData.platform_type}
                    onChange={(e) => handleFieldChange('platform_type', e.target.value)}
                  >
                    <option value="streaming">Streaming</option>
                    <option value="tv">TV</option>
                    <option value="rental">Rental</option>
                    <option value="buy">Buy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">TMDB Provider ID</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.tmdb_provider_id || ''}
                    onChange={(e) => handleFieldChange('tmdb_provider_id', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Orden de Visualización</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.display_order}
                    onChange={(e) => handleFieldChange('display_order', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Activa</label>
                  <select
                    className="form-select"
                    value={formData.is_active.toString()}
                    onChange={(e) => handleFieldChange('is_active', e.target.value === 'true')}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
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

            {/* URLs y Multimedia */}
            <div className="form-section">
              <h3 className="form-section-title">URLs y Multimedia</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">URL Logo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.logo_url}
                    onChange={(e) => handleFieldChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Sitio Web</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.website_url}
                    onChange={(e) => handleFieldChange('website_url', e.target.value)}
                    placeholder="https://netflix.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Afiliado Español</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.affiliate_url_es}
                    onChange={(e) => handleFieldChange('affiliate_url_es', e.target.value)}
                    placeholder="https://affiliate.com/netflix-es"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Afiliado Inglés</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.affiliate_url_en}
                    onChange={(e) => handleFieldChange('affiliate_url_en', e.target.value)}
                    placeholder="https://affiliate.com/netflix-en"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Afiliado</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.affiliate_id}
                    onChange={(e) => handleFieldChange('affiliate_id', e.target.value)}
                    placeholder="netflix-es-123"
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
