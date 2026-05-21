import { useState, useEffect, useRef } from 'react';
import { TiEdit } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './GeneralTab.scss';

interface GeneralTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function GeneralTab({ article, onSave }: GeneralTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArticle, setEditedArticle] = useState<ArticleItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedArticle(article);
  }, [article]);

  useEffect(() => {
    if (isEditing && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEditing]);

  const handleFieldChange = (field: keyof ArticleItem, value: any) => {
    if (editedArticle) {
      setEditedArticle({ ...editedArticle, [field]: value });
    }
  };

  const handleStartEdit = () => {
    setEditedArticle({ ...article });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedArticle(article);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedArticle) return;
    setIsSaving(true);
    if (onSave) {
      await onSave(editedArticle);
    }
    setIsSaving(false);
    setIsEditing(false);
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

  const getIntentBadge = (intent: string | null) => {
    if (!intent) return <span className="badge badge-gray">-</span>;
    
    switch (intent) {
      case 'review':
        return <span className="badge badge-blue">Review</span>;
      case 'news':
        return <span className="badge badge-purple">Noticia</span>;
      case 'guide':
        return <span className="badge badge-orange">Guía</span>;
      case 'list':
        return <span className="badge badge-teal">Lista</span>;
      default:
        return <span className="badge badge-gray">{intent}</span>;
    }
  };

  if (!editedArticle) return null;

  return (
    <>
      {/* Hero Section */}
      {editedArticle.cover_image_url && (
        <div className="hero-section" style={{ backgroundImage: `url(${editedArticle.cover_image_url})` }}>
          <div className="hero-overlay" />
        </div>
      )}

      <div className="article-layout">
        {/* Cover Image */}
        {editedArticle.cover_image_url && (
          <img
            className="article-cover"
            src={editedArticle.cover_image_url}
            alt={editedArticle.title_es}
          />
        )}

        {/* Info */}
        <div className="article-info">
          <h3 className="article-title">
            {editedArticle.title_es}
          </h3>
          {editedArticle.title_en && editedArticle.title_en !== editedArticle.title_es && (
            <p className="article-title-en">
              {editedArticle.title_en}
            </p>
          )}
          <div className="article-meta">
            {getStatusBadge(editedArticle.status)}
            {getIntentBadge(editedArticle.intent)}
          </div>
          <p className="article-meta-item">
            Slug: {editedArticle.slug}
          </p>
          {editedArticle.published_at && (
            <p className="article-meta-item">
              Publicado: {new Date(editedArticle.published_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          {editedArticle.author && (
            <p className="article-meta-item">
              Autor: {editedArticle.author.display_name}
            </p>
          )}
          {editedArticle.category && (
            <p className="article-meta-item">
              Categoría: {editedArticle.category.name_es}
            </p>
          )}
          
          <div className="article-excerpt">
            <p>{editedArticle.excerpt_es}</p>
          </div>

          {/* Edit Button */}
          <div className="edit-button-wrapper">
            <button 
              className="btn btn-primary" 
              onClick={handleStartEdit}
              disabled={isSaving}
            >
              <TiEdit /> {isSaving ? 'Guardando...' : 'Editar'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="edit-form" ref={editFormRef}>
          <div className="form-section">
            <h4>Información General</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <select
                  className="select"
                  value={editedArticle.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  className="select"
                  value={editedArticle.intent || 'review'}
                  onChange={(e) => handleFieldChange('intent', e.target.value)}
                >
                  <option value="review">Review</option>
                  <option value="news">Noticia</option>
                  <option value="guide">Guía</option>
                  <option value="list">Lista</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Slug</label>
              <input
                type="text"
                className="input"
                value={editedArticle.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                placeholder="url-del-articulo"
              />
            </div>

            <div className="form-group">
              <label>URL Imagen Portada</label>
              <input
                type="text"
                className="input"
                value={editedArticle.cover_image_url || ''}
                onChange={(e) => handleFieldChange('cover_image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Títulos</h4>
            
            <div className="form-group">
              <label>Título (Español) *</label>
              <input
                type="text"
                className="input"
                value={editedArticle.title_es}
                onChange={(e) => handleFieldChange('title_es', e.target.value)}
                placeholder="Título del artículo"
              />
            </div>

            <div className="form-group">
              <label>Título (Inglés)</label>
              <input
                type="text"
                className="input"
                value={editedArticle.title_en || ''}
                onChange={(e) => handleFieldChange('title_en', e.target.value)}
                placeholder="Article title"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Extracto</h4>
            
            <div className="form-group">
              <label>Extracto (Español) *</label>
              <textarea
                className="textarea"
                value={editedArticle.excerpt_es}
                onChange={(e) => handleFieldChange('excerpt_es', e.target.value)}
                placeholder="Breve descripción del artículo"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Extracto (Inglés)</label>
              <textarea
                className="textarea"
                value={editedArticle.excerpt_en || ''}
                onChange={(e) => handleFieldChange('excerpt_en', e.target.value)}
                placeholder="Brief article description"
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={handleCancelEdit}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
