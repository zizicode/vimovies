import { useState, useEffect } from 'react';
import { TiEdit, TiPlus, TiTrash } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './TagsTab.scss';

interface TagsTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function TagsTab({ article, onSave }: TagsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArticle, setEditedArticle] = useState<ArticleItem | null>(null);
  const [newTag, setNewTag] = useState('');

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

  const handleAddTag = () => {
    if (!newTag.trim() || !editedArticle) return;
    // TODO: Add tag logic
    setNewTag('');
  };

  const handleRemoveTag = (tagId: number) => {
    if (!editedArticle) return;
    // TODO: Remove tag logic
  };

  if (!editedArticle) return null;

  return (
    <div className="article-tags-tab">
      <div className="tab-header">
        <h3>Tags</h3>
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

      <div className="tags-container">
        {editedArticle.tags && editedArticle.tags.length > 0 ? (
          <div className="tags-list">
            {editedArticle.tags.map(tag => (
              <div key={tag.id} className="tag-item">
                <span className="tag-name">{tag.name_es}</span>
                {isEditing && (
                  <button 
                    className="btn-icon" 
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <TiTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tags">Sin tags</p>
        )}

        {isEditing && (
          <div className="add-tag">
            <input
              type="text"
              className="input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nombre del tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button className="btn btn-primary" onClick={handleAddTag}>
              <TiPlus /> Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
