import { useState, useEffect } from 'react';
import { TiEdit } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './ContentTab.scss';

interface ContentTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function ContentTab({ article, onSave }: ContentTabProps) {
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
    <div className="article-content-tab">
      <div className="tab-header">
        <h3>Contenido del Artículo</h3>
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

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>Contenido (Español)</label>
            <textarea
              className="textarea content-editor"
              value={editedArticle.content_es || ''}
              onChange={(e) => handleFieldChange('content_es', e.target.value)}
              placeholder="Escribe el contenido completo del artículo en español..."
              rows={20}
            />
          </div>

          <div className="form-group">
            <label>Contenido (Inglés)</label>
            <textarea
              className="textarea content-editor"
              value={editedArticle.content_en || ''}
              onChange={(e) => handleFieldChange('content_en', e.target.value)}
              placeholder="Write the full article content in English..."
              rows={20}
            />
          </div>
        </div>
      ) : (
        <div className="content-display">
          <div className="content-block">
            <h4>Español</h4>
            <div className="content-text">
              {editedArticle.content_es || <span className="no-content">Sin contenido</span>}
            </div>
          </div>

          <div className="content-block">
            <h4>English</h4>
            <div className="content-text">
              {editedArticle.content_en || <span className="no-content">No content</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
