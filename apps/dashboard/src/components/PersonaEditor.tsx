import { useState, useEffect } from 'react';
import { TiArrowBack } from 'react-icons/ti';
import type { PersonItem } from '../store/people.store';
import { usePeopleStore } from '../store/people.store';
import { useAuthStore } from '../store/token.store';
import './ArticuloEditor.scss';

interface PersonaEditorProps {
  person: PersonItem | null;
  onBack: () => void;
  onSave?: (person: PersonItem) => void;
}

export default function PersonaEditor({ person, onBack, onSave }: PersonaEditorProps) {
  const [formData, setFormData] = useState<Partial<PersonItem>>({
    name: '',
    also_known_as: [],
    birthdate: '',
    deathdate: '',
    birthplace: '',
    biography_es: '',
    biography_en: '',
    gender: 0,
    profile_path: '',
    homepage_url: '',
    imdb_id: '',
    seo_title_es: '',
    seo_title_en: '',
    seo_description_es: '',
    seo_description_en: '',
    og_image_url: '',
    canonical_url_es: '',
    canonical_url_en: '',
    sitemap_priority: 'medium',
  });

  const [isSaving, setIsSaving] = useState(false);

  const { updatePerson } = usePeopleStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (person) {
      console.log('Loading person data:', person);
      setFormData(person);
    } else {
      console.log('No person data provided, using empty form');
    }
  }, [person]);

  const handleFieldChange = (field: keyof PersonItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!person?.id) return;
    
    setIsSaving(true);
    try {
      // Only send fields that have actually changed from original values
      const updateData: any = {};
      
      const editableFields = [
        'name', 'also_known_as', 'birthdate', 'deathdate', 'birthplace',
        'biography_es', 'biography_en', 'gender', 'profile_path',
        'homepage_url', 'imdb_id', 'tmdb_popularity', 'sitemap_priority',
        'seo_title_es', 'seo_title_en', 'seo_description_es', 'seo_description_en',
        'og_image_url', 'canonical_url_es', 'canonical_url_en', 'tmdb_last_synced_at'
      ];
      
      console.log('=== COMPARISON DEBUG ===');
      console.log('Original person:', person);
      console.log('Current formData:', formData);
      
      editableFields.forEach(field => {
        const currentValue = formData[field as keyof PersonItem];
        const originalValue = person[field as keyof PersonItem];
        
        // Helper function to normalize values for comparison
        const normalizeValue = (val: any) => {
          if (val === undefined || val === null) return '';
          if (Array.isArray(val)) return JSON.stringify(val);
          return val;
        };
        
        const normalizedCurrent = normalizeValue(currentValue);
        const normalizedOriginal = normalizeValue(originalValue);
        const hasChanged = normalizedCurrent !== normalizedOriginal;
        
        console.log(`Field: ${field}`);
        console.log(`  Current: ${JSON.stringify(currentValue)} (${typeof currentValue})`);
        console.log(`  Original: ${JSON.stringify(originalValue)} (${typeof originalValue})`);
        console.log(`  Changed: ${hasChanged}`);
        
        // Only include if value has changed
        if (hasChanged) {
          updateData[field] = currentValue;
          console.log(`  -> WILL SEND: ${JSON.stringify(currentValue)}`);
        }
      });
      
      console.log('=== FINAL DATA TO SEND ===');
      console.log('Changed fields to send:', updateData);
      
      if (Object.keys(updateData).length === 0) {
        alert('No hay cambios para guardar');
        setIsSaving(false);
        return;
      }
      
      await updatePerson(person.id, updateData);
      
      if (onSave) {
        onSave({ ...person, ...formData } as PersonItem);
      }
      onBack();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Error al guardar la persona. Por favor intenta nuevamente.');
    }
    setIsSaving(false);
  };

  const handleAlsoKnownAsChange = (value: string) => {
    const names = value.split('\n').map(name => name.trim()).filter(name => name);
    handleFieldChange('also_known_as', names);
  };

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="view active">
      {/* Section Header */}
      <div className="section-header">
        <button className="btn btn-secondary" onClick={onBack}>
          <TiArrowBack /> Volver
        </button>
        <div>
          <div className="section-title">{person ? 'Editar Persona' : 'Nueva Persona'}</div>
          <div className="section-sub">Información detallada de la persona</div>
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
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Nombre completo de la persona"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input
                type="text"
                className="form-input"
                value={formData.slug || ''}
                disabled={true}
              />
              <div className="field-lock">Este campo no se puede editar (generado automáticamente)</div>
            </div>

            <div className="form-group">
              <label className="form-label">También conocido como</label>
              <textarea
                className="form-input"
                value={formData.also_known_as?.join('\n') || ''}
                onChange={(e) => handleAlsoKnownAsChange(e.target.value)}
                placeholder="Un nombre por línea"
                rows={3}
              />
              <div className="field-lock">Un nombre por línea</div>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                type="date"
                className="form-input"
                value={formatDateForInput(formData.birthdate)}
                onChange={(e) => handleFieldChange('birthdate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Fallecimiento</label>
              <input
                type="date"
                className="form-input"
                value={formatDateForInput(formData.deathdate)}
                onChange={(e) => handleFieldChange('deathdate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lugar de Nacimiento</label>
              <input
                type="text"
                className="form-input"
                value={formData.birthplace || ''}
                onChange={(e) => handleFieldChange('birthplace', e.target.value)}
                placeholder="Ciudad, País"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Género</label>
              <select
                className="filter-select"
                value={formData.gender || 0}
                onChange={(e) => handleFieldChange('gender', Number(e.target.value))}
              >
                <option value={0}>No especificado</option>
                <option value={1}>Femenino</option>
                <option value={2}>Masculino</option>
                <option value={3}>No binario</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL de Perfil (TMDB)</label>
              <input
                type="text"
                className="form-input"
                value={formData.profile_path || ''}
                onChange={(e) => handleFieldChange('profile_path', e.target.value)}
                placeholder="/path/to/image.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Página Web</label>
              <input
                type="url"
                className="form-input"
                value={formData.homepage_url || ''}
                onChange={(e) => handleFieldChange('homepage_url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">IMDB ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.imdb_id || ''}
                onChange={(e) => handleFieldChange('imdb_id', e.target.value)}
                placeholder="nm0000001"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prioridad en Sitemap</label>
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

            <div className="form-group full-width">
              <label className="form-label">Biografía (Español)</label>
              <textarea
                className="form-input"
                value={formData.biography_es || ''}
                onChange={(e) => handleFieldChange('biography_es', e.target.value)}
                placeholder="Biografía en español"
                rows={6}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Biografía (Inglés)</label>
              <textarea
                className="form-input"
                value={formData.biography_en || ''}
                onChange={(e) => handleFieldChange('biography_en', e.target.value)}
                placeholder="Biography in English"
                rows={6}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Título SEO (Español)</label>
              <input
                type="text"
                className="form-input"
                value={formData.seo_title_es || ''}
                onChange={(e) => handleFieldChange('seo_title_es', e.target.value)}
                placeholder="Título para buscadores"
                maxLength={60}
              />
              <div className="field-lock">{(formData.seo_title_es || '').length}/60 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Título SEO (Inglés)</label>
              <input
                type="text"
                className="form-input"
                value={formData.seo_title_en || ''}
                onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
                placeholder="SEO title for search engines"
                maxLength={60}
              />
              <div className="field-lock">{(formData.seo_title_en || '').length}/60 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Descripción SEO (Español)</label>
              <textarea
                className="form-input"
                value={formData.seo_description_es || ''}
                onChange={(e) => handleFieldChange('seo_description_es', e.target.value)}
                placeholder="Descripción para buscadores"
                rows={3}
                maxLength={160}
              />
              <div className="field-lock">{(formData.seo_description_es || '').length}/160 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Descripción SEO (Inglés)</label>
              <textarea
                className="form-input"
                value={formData.seo_description_en || ''}
                onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
                placeholder="Description for search results"
                rows={3}
                maxLength={160}
              />
              <div className="field-lock">{(formData.seo_description_en || '').length}/160 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">URL Imagen Open Graph</label>
              <input
                type="text"
                className="form-input"
                value={formData.og_image_url || ''}
                onChange={(e) => handleFieldChange('og_image_url', e.target.value)}
                placeholder="https://example.com/og-image.jpg"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">URL Canónica (Español)</label>
              <input
                type="text"
                className="form-input"
                value={formData.canonical_url_es || ''}
                onChange={(e) => handleFieldChange('canonical_url_es', e.target.value)}
                placeholder="https://vimovies.com/persona/slug"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">URL Canónica (Inglés)</label>
              <input
                type="text"
                className="form-input"
                value={formData.canonical_url_en || ''}
                onChange={(e) => handleFieldChange('canonical_url_en', e.target.value)}
                placeholder="https://vimovies.com/en/person/slug"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
