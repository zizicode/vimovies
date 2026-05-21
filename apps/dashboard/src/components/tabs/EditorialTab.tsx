import { useState, useEffect, useMemo } from 'react';
import { TiPencil, TiTick } from 'react-icons/ti';
import type { MediaItem } from './types';
import { mediaService } from '../../services/api.service';
import { useAuthStore } from '../../store';

interface EditorialTabProps {
  movie: MediaItem;
}

export default function EditorialTab({ movie }: EditorialTabProps) {
  const { token } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    editorial_rating: 0,
    editorial_verdict_es: '',
    editorial_verdict_en: '',
    editorial_review_es: '',
    editorial_review_en: '',
  });

  const hasEditorialData = useMemo(() => Boolean(
    movie.editorial_rating ||
    movie.editorial_verdict_es ||
    movie.editorial_verdict_en ||
    movie.editorial_review_es ||
    movie.editorial_review_en
  ), [movie.editorial_rating, movie.editorial_verdict_es, movie.editorial_verdict_en, movie.editorial_review_es, movie.editorial_review_en]);

  useEffect(() => {
    setFormData({
      editorial_rating: movie.editorial_rating || 0,
      editorial_verdict_es: movie.editorial_verdict_es || '',
      editorial_verdict_en: movie.editorial_verdict_en || '',
      editorial_review_es: movie.editorial_review_es || '',
      editorial_review_en: movie.editorial_review_en || '',
    });
    
    // Si no hay datos editoriales, activar modo edición automáticamente
    if (!hasEditorialData) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [movie.id, hasEditorialData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await mediaService.updateEditorial(movie.id, formData, token || '');
      setIsEditing(false);
      alert('Editorial guardado correctamente');
    } catch (error) {
      console.error('Error saving editorial:', error);
      alert('Error al guardar el editorial');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      editorial_rating: movie.editorial_rating || 0,
      editorial_verdict_es: movie.editorial_verdict_es || '',
      editorial_verdict_en: movie.editorial_verdict_en || '',
      editorial_review_es: movie.editorial_review_es || '',
      editorial_review_en: movie.editorial_review_en || '',
    });
    setIsEditing(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'var(--green)';
    if (rating >= 6) return 'var(--gold)';
    if (rating >= 4) return 'var(--orange)';
    return 'var(--red)';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Editorial</h3>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: '4px 0 0' }}>
            {!hasEditorialData 
              ? 'Esta película aún no tiene contenido editorial. ¡Crea el primero!'
              : isEditing 
              ? 'Editando contenido editorial' 
              : 'Contenido editorial de la película'}
          </p>
        </div>
        {!isEditing ? (
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
          >
            <TiPencil /> {!hasEditorialData ? 'Crear Editorial' : 'Editar'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              <TiTick /> {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Rating Display */}
      <div
        style={{
          background: 'var(--bg-raised)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: getRatingColor(formData.editorial_rating),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
            }}
          >
            {formData.editorial_rating}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>
              Rating Editorial
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text3)', margin: 0 }}>
              Calificación del equipo editorial (0-10)
            </p>
          </div>
          {isEditing && (
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              className="form-input"
              value={formData.editorial_rating}
              onChange={(e) => handleFieldChange('editorial_rating', parseFloat(e.target.value) || 0)}
              style={{ width: '100px' }}
            />
          )}
        </div>
      </div>

      {/* Spanish Content */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--gold)' }}>
          🇪🇸 Contenido en Español
        </h4>

        {/* Veredicto ES */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Veredicto (ES)
          </label>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.editorial_verdict_es}
              onChange={(e) => handleFieldChange('editorial_verdict_es', e.target.value)}
              rows={2}
              placeholder="Tagline corto (ej: Una obra maestra del cine moderno)"
            />
          ) : (
            <div
              style={{
                background: 'var(--bg-raised)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {formData.editorial_verdict_es || (
                <span style={{ color: 'var(--text3)' }}>Sin veredicto</span>
              )}
            </div>
          )}
        </div>

        {/* Review ES */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Reseña Editorial (ES)
          </label>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.editorial_review_es}
              onChange={(e) => handleFieldChange('editorial_review_es', e.target.value)}
              rows={10}
              placeholder="Reseña completa y detallada de la película en español..."
            />
          ) : (
            <div
              style={{
                background: 'var(--bg-raised)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {formData.editorial_review_es || (
                <span style={{ color: 'var(--text3)' }}>Sin reseña</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* English Content */}
      <div>
        <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--blue)' }}>
          🇺🇸 English Content
        </h4>

        {/* Veredicto EN */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Editorial Verdict (EN)
          </label>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.editorial_verdict_en}
              onChange={(e) => handleFieldChange('editorial_verdict_en', e.target.value)}
              rows={2}
              placeholder="Short tagline (e.g: A masterpiece of modern cinema)"
            />
          ) : (
            <div
              style={{
                background: 'var(--bg-raised)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {formData.editorial_verdict_en || (
                <span style={{ color: 'var(--text3)' }}>No verdict</span>
              )}
            </div>
          )}
        </div>

        {/* Review EN */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Editorial Review (EN)
          </label>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.editorial_review_en}
              onChange={(e) => handleFieldChange('editorial_review_en', e.target.value)}
              rows={10}
              placeholder="Complete and detailed movie review in English..."
            />
          ) : (
            <div
              style={{
                background: 'var(--bg-raised)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {formData.editorial_review_en || (
                <span style={{ color: 'var(--text3)' }}>No review</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
