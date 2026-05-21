import { useState, useEffect } from 'react';
import { TiArrowBack, TiPlus, TiTrash } from 'react-icons/ti';
import { generateSlug } from '@vimovies/utils';
import type { ArticleItem } from '../services/api.service';
import { useArticlesStore } from '../store/articles.store';
import { useAuthStore } from '../store/token.store';
import { articlesService } from '../services/api.service';
import './ArticuloEditor.scss';

interface ArticuloEditorProps {
  article: ArticleItem | null;
  onBack: () => void;
  onSave?: (article: ArticleItem) => void;
}

type SectionType = 'basic' | 'content' | 'seo' | 'relations' | 'tags' | 'mentions' | 'faqs';

interface FAQ {
  id?: string;
  question_es: string;
  question_en: string;
  answer_es: string;
  answer_en: string;
  display_order: number;
}

interface MediaMention {
  media_id: string;
  mention_type: 'primary' | 'supporting' | 'mentioned';
  display_order: number;
}

export default function ArticuloEditor({ article, onBack, onSave }: ArticuloEditorProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formData, setFormData] = useState<Partial<ArticleItem>>({
    slug: '',
    title_es: '',
    title_en: '',
    excerpt_es: '',
    excerpt_en: '',
    content_es: '',
    content_en: '',
    status: 'draft',
    intent: 'informational',
    cover_image_url: '',
    cover_image_alt_es: '',
    cover_image_alt_en: '',
    seo_title_es: '',
    seo_title_en: '',
    seo_description_es: '',
    seo_description_en: '',
    og_image_url: '',
    canonical_url_es: '',
    canonical_url_en: '',
    primary_keyword_es: '',
    primary_keyword_en: '',
    secondary_keywords: [],
    author_id: null,
    category_id: null,
    published_at: null,
    scheduled_at: null,
    locale: 'es',
    has_en_version: false,
    word_count_es: null,
    word_count_en: null,
    reading_time_minutes: null,
    sitemap_priority: 'medium',
    noindex: false,
  });

  // Estado para relaciones
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [mentions, setMentions] = useState<MediaMention[]>([]);

  // Datos para selects (mock por ahora, luego vendrán del API)
  const [authors] = useState([
    { id: '1', display_name: 'Juan Pérez' },
    { id: '2', display_name: 'María García' },
  ]);
  const [categories] = useState([
    { id: 1, name_es: 'Reviews' },
    { id: 2, name_es: 'Noticias' },
    { id: 3, name_es: 'Guías' },
  ]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: number; slug: string; name_es: string; name_en: string }>>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  const { createArticle, updateArticle } = useArticlesStore();
  const { token } = useAuthStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (article) {
      setFormData(article);
      setSlugManuallyEdited(!!article.slug); // Marcar como editado si ya existe slug
      // Cargar relaciones cuando hay artículo existente
      if (article.tags) {
        setSelectedTags(article.tags.map(t => t.id));
      }
      if (article.faqs) {
        setFaqs(article.faqs.map(f => ({
          id: f.id,
          question_es: f.question_es,
          question_en: f.question_en || '',
          answer_es: f.answer_es,
          answer_en: f.answer_en || '',
          display_order: f.display_order,
        })));
      }
      if (article.media_mentions) {
        setMentions(article.media_mentions.map(m => ({
          media_id: m.media_id,
          mention_type: m.mention_type,
          display_order: m.display_order,
        })));
      }
    }
  }, [article]);

  // Cargar tags desde la API
  useEffect(() => {
    const loadTags = async () => {
      console.log('[ArticuloEditor] Loading tags, token:', !!token);
      if (token) {
        try {
          const response = await articlesService.getAllTags(token);
          console.log('[ArticuloEditor] Tags response:', response);
          if (response.data) {
            console.log('[ArticuloEditor] Tags loaded:', response.data.length);
            setAvailableTags(response.data);
          } else {
            console.warn('[ArticuloEditor] No data in response');
          }
        } catch (error) {
          console.error('[ArticuloEditor] Error loading tags:', error);
        } finally {
          setLoadingTags(false);
        }
      } else {
        console.warn('[ArticuloEditor] No token available');
        setLoadingTags(false);
      }
    };
    loadTags();
  }, [token]);

  // Generar slug automáticamente basado en locale
  useEffect(() => {
    if (!slugManuallyEdited) {
      const titleToUse = formData.locale === 'en' ? formData.title_en : formData.title_es;
      if (titleToUse) {
        setFormData(prev => ({ ...prev, slug: generateSlug(titleToUse) }));
      }
    }
  }, [formData.title_es, formData.title_en, formData.locale, slugManuallyEdited]);

  const handleFieldChange = (field: keyof ArticleItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const articleData = {
        ...formData as ArticleItem,
        // Aquí se incluirían las relaciones cuando se implemente el backend
      };
      
      if (article?.id) {
        await updateArticle(article.id, articleData);
      } else {
        await createArticle(articleData);
      }
      
      if (onSave) {
        onSave(articleData);
      }
    } catch (error) {
      console.error('Error saving article:', error);
    }
    setIsSaving(false);
  };

  // Gestión de FAQs
  const addFAQ = () => {
    setFaqs([...faqs, {
      question_es: '',
      question_en: '',
      answer_es: '',
      answer_en: '',
      display_order: faqs.length,
    }]);
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string | number) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // Gestión de Tags
  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSeedTags = async () => {
    if (token) {
      try {
        const response = await articlesService.seedTags(token);
        if (response.data) {
          console.log('[ArticuloEditor] Tags seeded:', response.data);
          // Recargar tags
          const tagsResponse = await articlesService.getAllTags(token);
          if (tagsResponse.data) {
            setAvailableTags(tagsResponse.data);
          }
        }
      } catch (error) {
        console.error('[ArticuloEditor] Error seeding tags:', error);
      }
    }
  };

  // Gestión de Menciones
  const addMention = () => {
    setMentions([...mentions, {
      media_id: '',
      mention_type: 'mentioned',
      display_order: mentions.length,
    }]);
  };

  const updateMention = (index: number, field: keyof MediaMention, value: string | number) => {
    const newMentions = [...mentions];
    newMentions[index] = { ...newMentions[index], [field]: value };
    setMentions(newMentions);
  };

  const removeMention = (index: number) => {
    setMentions(mentions.filter((_, i) => i !== index));
  };

  const sections = [
    { id: 'basic' as SectionType, label: 'Básico' },
    { id: 'content' as SectionType, label: 'Contenido' },
    { id: 'seo' as SectionType, label: 'SEO' },
    { id: 'relations' as SectionType, label: 'Relaciones' },
    { id: 'tags' as SectionType, label: 'Tags' },
    { id: 'mentions' as SectionType, label: 'Menciones' },
    { id: 'faqs' as SectionType, label: 'FAQs' },
  ];

  return (
    <div className="article-editor">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={onBack}>
            <TiArrowBack /> Volver
          </button>
          <div>
            <h1 className="section-title">{article ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
            <p className="section-sub">{formData.title_es || 'Sin título'}</p>
          </div>
        </div>
        <button 
          className={`btn btn-primary ${isSaving ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {sections.map(section => (
          <button
            key={section.id}
            className={`tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="article-content">
        {activeSection === 'basic' && (
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Título (Español) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title_es}
                  onChange={(e) => handleFieldChange('title_es', e.target.value)}
                  placeholder="Escribe el título del artículo"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Título (Inglés)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title_en || ''}
                  onChange={(e) => handleFieldChange('title_en', e.target.value)}
                  placeholder="Write the article title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="url-del-articulo"
                />
                <div className="field-lock">Este será la URL del artículo. Se genera automáticamente basado en el locale principal.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Intent del artículo</label>
                <select
                  className="filter-select"
                  value={formData.intent || 'informational'}
                  onChange={(e) => handleFieldChange('intent', e.target.value)}
                >
                  <option value="informational">Informativo</option>
                  <option value="navigational">Navegacional</option>
                  <option value="transactional">Transaccional</option>
                  <option value="seasonal">Estacional</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Extracto (Español) *</label>
                <textarea
                  className="inline-edit"
                  value={formData.excerpt_es}
                  onChange={(e) => handleFieldChange('excerpt_es', e.target.value)}
                  placeholder="Breve descripción que aparecerá en los resultados de búsqueda"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Extracto (Inglés)</label>
                <textarea
                  className="inline-edit"
                  value={formData.excerpt_en || ''}
                  onChange={(e) => handleFieldChange('excerpt_en', e.target.value)}
                  placeholder="Brief description for search results"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de imagen de portada</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cover_image_url || ''}
                  onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Texto alt imagen (Español)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cover_image_alt_es || ''}
                  onChange={(e) => handleFieldChange('cover_image_alt_es', e.target.value)}
                  placeholder="Descripción accesible de la imagen"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Texto alt imagen (Inglés)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cover_image_alt_en || ''}
                  onChange={(e) => handleFieldChange('cover_image_alt_en', e.target.value)}
                  placeholder="Accessible image description"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Locale principal</label>
                <select
                  className="filter-select"
                  value={formData.locale || 'es'}
                  onChange={(e) => handleFieldChange('locale', e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tiene versión en inglés</label>
                <select
                  className="filter-select"
                  value={formData.has_en_version ? 'true' : 'false'}
                  onChange={(e) => handleFieldChange('has_en_version', e.target.value === 'true')}
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="filter-select"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                  <option value="scheduled">Programado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'content' && (
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Contenido (Español) *</label>
                <textarea
                  className="inline-edit"
                  style={{ minHeight: '400px', fontFamily: 'monospace' }}
                  value={formData.content_es || ''}
                  onChange={(e) => handleFieldChange('content_es', e.target.value)}
                  placeholder="Escribe el contenido completo del artículo en español..."
                  rows={20}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contenido (Inglés)</label>
                <textarea
                  className="inline-edit"
                  style={{ minHeight: '400px', fontFamily: 'monospace' }}
                  value={formData.content_en || ''}
                  onChange={(e) => handleFieldChange('content_en', e.target.value)}
                  placeholder="Write the full article content in English..."
                  rows={20}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'seo' && (
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Título SEO (Español)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.seo_title_es || ''}
                  onChange={(e) => handleFieldChange('seo_title_es', e.target.value)}
                  placeholder="Título optimizado para buscadores"
                  maxLength={60}
                />
                <div className="field-lock">{(formData.seo_title_es || '').length}/60 caracteres</div>
              </div>

              <div className="form-group">
                <label className="form-label">Título SEO (Inglés)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.seo_title_en || ''}
                  onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
                  placeholder="SEO-optimized title"
                  maxLength={60}
                />
                <div className="field-lock">{(formData.seo_title_en || '').length}/60 caracteres</div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción SEO (Español)</label>
                <textarea
                  className="inline-edit"
                  value={formData.seo_description_es || ''}
                  onChange={(e) => handleFieldChange('seo_description_es', e.target.value)}
                  placeholder="Descripción que aparecerá en los resultados de búsqueda"
                  rows={3}
                  maxLength={160}
                />
                <div className="field-lock">{(formData.seo_description_es || '').length}/160 caracteres</div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción SEO (Inglés)</label>
                <textarea
                  className="inline-edit"
                  value={formData.seo_description_en || ''}
                  onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
                  placeholder="Description for search results"
                  rows={3}
                  maxLength={160}
                />
                <div className="field-lock">{(formData.seo_description_en || '').length}/160 caracteres</div>
              </div>

              <div className="form-group">
                <label className="form-label">URL imagen Open Graph</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.og_image_url || ''}
                  onChange={(e) => handleFieldChange('og_image_url', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL canónica (Español)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.canonical_url_es || ''}
                  onChange={(e) => handleFieldChange('canonical_url_es', e.target.value)}
                  placeholder="https://vimovies.com/articulo/slug"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL canónica (Inglés)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.canonical_url_en || ''}
                  onChange={(e) => handleFieldChange('canonical_url_en', e.target.value)}
                  placeholder="https://vimovies.com/en/article/slug"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palabra clave principal (Español)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.primary_keyword_es || ''}
                  onChange={(e) => handleFieldChange('primary_keyword_es', e.target.value)}
                  placeholder="palabra clave principal"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palabra clave principal (Inglés)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.primary_keyword_en || ''}
                  onChange={(e) => handleFieldChange('primary_keyword_en', e.target.value)}
                  placeholder="primary keyword"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palabras clave secundarias</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.secondary_keywords?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('secondary_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                  placeholder="clave1, clave2, clave3"
                />
                <div className="field-lock">Separadas por coma</div>
              </div>

              <div className="form-group">
                <label className="form-label">Prioridad en sitemap</label>
                <select
                  className="filter-select"
                  value={formData.sitemap_priority || 'medium'}
                  onChange={(e) => handleFieldChange('sitemap_priority', e.target.value)}
                >
                  <option value="critical">Crítica (1.0)</option>
                  <option value="high">Alta (0.9)</option>
                  <option value="medium">Media (0.7)</option>
                  <option value="low">Baja (0.5)</option>
                  <option value="minimal">Mínima (0.3)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">No indexar en buscadores</label>
                <select
                  className="filter-select"
                  value={formData.noindex ? 'true' : 'false'}
                  onChange={(e) => handleFieldChange('noindex', e.target.value === 'true')}
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de publicación</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.published_at || ''}
                  onChange={(e) => handleFieldChange('published_at', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha programada</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => handleFieldChange('scheduled_at', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Conteo de palabras (Español)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.word_count_es || ''}
                  onChange={(e) => handleFieldChange('word_count_es', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Conteo de palabras (Inglés)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.word_count_en || ''}
                  onChange={(e) => handleFieldChange('word_count_en', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tiempo de lectura (minutos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.reading_time_minutes || ''}
                  onChange={(e) => handleFieldChange('reading_time_minutes', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'relations' && (
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Autor</label>
                <select
                  className="filter-select"
                  value={formData.author_id || ''}
                  onChange={(e) => handleFieldChange('author_id', e.target.value)}
                >
                  <option value="">Seleccionar autor...</option>
                  {authors.map(author => (
                    <option key={author.id} value={author.id}>{author.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="filter-select"
                  value={formData.category_id || ''}
                  onChange={(e) => handleFieldChange('category_id', Number(e.target.value))}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name_es}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tags' && (
          <div className="card">
            <div className="card-body">
              {!loadingTags && availableTags.length === 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <button className="btn btn-primary" onClick={handleSeedTags}>
                    <TiPlus /> Inicializar Tags de Ejemplo
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Tags seleccionados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {selectedTags.length === 0 && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No hay tags seleccionados</span>
                  )}
                  {selectedTags.map(tagId => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return (
                      <span key={tagId} className="badge badge-gold">
                        {tag?.name_es}
                        <button
                          onClick={() => toggleTag(tagId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            marginLeft: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags disponibles</label>
                {loadingTags ? (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Cargando tags...</span>
                ) : availableTags.length === 0 ? (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No hay tags disponibles. Haz clic en "Inicializar Tags de Ejemplo" para crear algunos.</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`badge ${selectedTags.includes(tag.id) ? 'badge-gold' : 'badge-gray'}`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '4px 12px'
                        }}
                      >
                        {tag.name_es}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'mentions' && (
          <div className="card">
            <div className="card-body">
              <button className="btn btn-primary" onClick={addMention} style={{ marginBottom: '16px' }}>
                <TiPlus /> Agregar mención
              </button>

              {mentions.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No hay menciones agregadas</p>
              )}

              {mentions.map((mention, index) => (
                <div key={index} style={{ 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                      Mención #{index + 1}
                    </span>
                    <button 
                      onClick={() => removeMention(index)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <TiTrash />
                    </button>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">ID de película</label>
                    <input
                      type="text"
                      className="form-input"
                      value={mention.media_id}
                      onChange={(e) => updateMention(index, 'media_id', e.target.value)}
                      placeholder="ID de la película"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de mención</label>
                    <select
                      className="filter-select"
                      value={mention.mention_type}
                      onChange={(e) => updateMention(index, 'mention_type', e.target.value)}
                    >
                      <option value="primary">Principal</option>
                      <option value="supporting">Secundaria</option>
                      <option value="mentioned">Mencionada</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'faqs' && (
          <div className="card">
            <div className="card-body">
              <button className="btn btn-primary" onClick={addFAQ} style={{ marginBottom: '16px' }}>
                <TiPlus /> Agregar FAQ
              </button>

              {faqs.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No hay FAQs agregadas</p>
              )}

              {faqs.map((faq, index) => (
                <div key={index} style={{ 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                      FAQ #{index + 1}
                    </span>
                    <button 
                      onClick={() => removeFAQ(index)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <TiTrash />
                    </button>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Pregunta (Español)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={faq.question_es}
                      onChange={(e) => updateFAQ(index, 'question_es', e.target.value)}
                      placeholder="Pregunta en español"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Pregunta (Inglés)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={faq.question_en}
                      onChange={(e) => updateFAQ(index, 'question_en', e.target.value)}
                      placeholder="Question in English"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Respuesta (Español)</label>
                    <textarea
                      className="inline-edit"
                      value={faq.answer_es}
                      onChange={(e) => updateFAQ(index, 'answer_es', e.target.value)}
                      placeholder="Respuesta en español"
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Respuesta (Inglés)</label>
                    <textarea
                      className="inline-edit"
                      value={faq.answer_en}
                      onChange={(e) => updateFAQ(index, 'answer_en', e.target.value)}
                      placeholder="Answer in English"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
