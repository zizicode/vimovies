import { useState, useEffect } from 'react';
import { TiEdit, TiPlus, TiTrash } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './MentionsTab.scss';

interface MentionsTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function MentionsTab({ article, onSave }: MentionsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArticle, setEditedArticle] = useState<ArticleItem | null>(null);

  useEffect(() => {
    setEditedArticle(article);
  }, [article]);

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

  const getMentionBadge = (type: string) => {
    switch (type) {
      case 'primary':
        return <span className="badge badge-blue">Principal</span>;
      case 'supporting':
        return <span className="badge badge-purple">Secundario</span>;
      case 'mentioned':
        return <span className="badge badge-gray">Mencionado</span>;
      default:
        return <span className="badge badge-gray">{type}</span>;
    }
  };

  if (!editedArticle) return null;

  return (
    <div className="article-mentions-tab">
      <div className="tab-header">
        <h3>Menciones a Películas</h3>
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

      <div className="mentions-container">
        {editedArticle.media_mentions && editedArticle.media_mentions.length > 0 ? (
          <div className="mentions-list">
            {editedArticle.media_mentions.map((mention, index) => (
              <div key={`${mention.media_id}-${index}`} className="mention-item">
                {mention.media && (
                  <img 
                    src={mention.media.poster_path ? `https://image.tmdb.org/t/p/w92${mention.media.poster_path}` : '/placeholder.jpg'}
                    alt={mention.media.title_es}
                    className="mention-poster"
                  />
                )}
                <div className="mention-info">
                  <div className="mention-title">{mention.media?.title_es || 'Película'}</div>
                  <div className="mention-slug">{mention.media?.slug || ''}</div>
                  {getMentionBadge(mention.mention_type)}
                </div>
                {isEditing && (
                  <button className="btn-icon">
                    <TiTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-mentions">Sin menciones a películas</p>
        )}

        {isEditing && (
          <div className="add-mention">
            <button className="btn btn-primary">
              <TiPlus /> Agregar Película
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
