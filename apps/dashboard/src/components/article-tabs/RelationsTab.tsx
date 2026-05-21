import { useState, useEffect } from 'react';
import { TiEdit } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import { useArticlesStore } from '../../store/articles.store';
import './RelationsTab.scss';

interface RelationsTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function RelationsTab({ article, onSave }: RelationsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArticle, setEditedArticle] = useState<ArticleItem | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  
  const { fetchArticleById } = useArticlesStore();

  useEffect(() => {
    setEditedArticle(article);
    // TODO: Fetch categories and authors from API
    fetchCategories();
    fetchAuthors();
  }, [article]);

  const fetchCategories = async () => {
    // TODO: Implement fetch categories from API
    setCategories([]);
  };

  const fetchAuthors = async () => {
    // TODO: Implement fetch authors from API
    setAuthors([]);
  };

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
    <div className="article-relations-tab">
      <div className="tab-header">
        <h3>Relaciones</h3>
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

      <div className="relations-grid">
        {/* Author */}
        <div className="relation-card">
          <h4>Autor</h4>
          {isEditing ? (
            <select
              className="select"
              value={editedArticle.author_id || ''}
              onChange={(e) => handleFieldChange('author_id', e.target.value)}
            >
              <option value="">Seleccionar autor</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>{author.display_name}</option>
              ))}
            </select>
          ) : (
            <div className="relation-display">
              {editedArticle.author ? (
                <div className="author-info">
                  <div className="author-name">{editedArticle.author.display_name}</div>
                  <div className="author-slug">@{editedArticle.author.slug}</div>
                  {editedArticle.author.expertise_es && (
                    <div className="author-expertise">{editedArticle.author.expertise_es}</div>
                  )}
                </div>
              ) : (
                <span className="no-value">Sin autor</span>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="relation-card">
          <h4>Categoría</h4>
          {isEditing ? (
            <select
              className="select"
              value={editedArticle.category_id || ''}
              onChange={(e) => handleFieldChange('category_id', Number(e.target.value))}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name_es}</option>
              ))}
            </select>
          ) : (
            <div className="relation-display">
              {editedArticle.category ? (
                <div className="category-info">
                  <div className="category-name">{editedArticle.category.name_es}</div>
                  {editedArticle.category.description_es && (
                    <div className="category-desc">{editedArticle.category.description_es}</div>
                  )}
                </div>
              ) : (
                <span className="no-value">Sin categoría</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
