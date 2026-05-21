import { useState, useEffect } from 'react';
import { TiEdit } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './SEOTab.scss';

interface SEOTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function SEOTab({ article, onSave }: SEOTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArticle, setEditedArticle] = useState<ArticleItem | null>(null);

  useEffect(() => {
    setEditedArticle(article);
  }, [article]);

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
    if (editedArticle && onSave) {
      await onSave(editedArticle);
      setIsEditing(false);
    }
  };

  if (!editedArticle) return null;

  return (
    <div className="article-seo-tab">
      <div className="tab-header">
        <h3>Configuración SEO</h3>
        {isEditing ? (
          <div className="edit-actions">
            <button className="btn btn-ghost" onClick={handleCancelEdit}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleStartEdit}>
            <TiEdit /> Editar
          </button>
        )}
      </div>

      <div className="seo-info">
        <p>Estos campos se utilizan para mejorar el posicionamiento en buscadores.</p>
      </div>

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>SEO Title (Español)</label>
            <input
              type="text"
              className="input"
              value={editedArticle.seo_title_es || ''}
              onChange={(e) => handleFieldChange('seo_title_es', e.target.value)}
              placeholder="Título SEO (máx 60 caracteres)"
              maxLength={60}
            />
            <span className="char-count">{(editedArticle.seo_title_es || '').length}/60</span>
          </div>

          <div className="form-group">
            <label>SEO Title (Inglés)</label>
            <input
              type="text"
              className="input"
              value={editedArticle.seo_title_en || ''}
              onChange={(e) => handleFieldChange('seo_title_en', e.target.value)}
              placeholder="SEO Title (max 60 chars)"
              maxLength={60}
            />
            <span className="char-count">{(editedArticle.seo_title_en || '').length}/60</span>
          </div>

          <div className="form-group">
            <label>SEO Description (Español)</label>
            <textarea
              className="textarea"
              value={editedArticle.seo_description_es || ''}
              onChange={(e) => handleFieldChange('seo_description_es', e.target.value)}
              placeholder="Descripción SEO (máx 160 caracteres)"
              rows={3}
              maxLength={160}
            />
            <span className="char-count">{(editedArticle.seo_description_es || '').length}/160</span>
          </div>

          <div className="form-group">
            <label>SEO Description (Inglés)</label>
            <textarea
              className="textarea"
              value={editedArticle.seo_description_en || ''}
              onChange={(e) => handleFieldChange('seo_description_en', e.target.value)}
              placeholder="SEO Description (max 160 chars)"
              rows={3}
              maxLength={160}
            />
            <span className="char-count">{(editedArticle.seo_description_en || '').length}/160</span>
          </div>
        </div>
      ) : (
        <div className="seo-display">
          <div className="seo-field">
            <label>SEO Title (ES):</label>
            <div className="seo-value">{editedArticle.seo_title_es || '-'}</div>
          </div>
          <div className="seo-field">
            <label>SEO Title (EN):</label>
            <div className="seo-value">{editedArticle.seo_title_en || '-'}</div>
          </div>
          <div className="seo-field">
            <label>SEO Description (ES):</label>
            <div className="seo-value">{editedArticle.seo_description_es || '-'}</div>
          </div>
          <div className="seo-field">
            <label>SEO Description (EN):</label>
            <div className="seo-value">{editedArticle.seo_description_en || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
