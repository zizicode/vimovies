import { useState, useEffect } from 'react';
import { TiEdit, TiPlus, TiTrash, TiArrowSortedUp, TiArrowSortedDown } from 'react-icons/ti';
import type { ArticleItem } from '../../services/api.service';
import './FAQsTab.scss';

interface FAQsTabProps {
  article: ArticleItem;
  onSave?: (updatedArticle: ArticleItem) => void;
}

export default function FAQsTab({ article, onSave }: FAQsTabProps) {
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

  const _handleAddFAQ = () => {
    if (!editedArticle) return;
    // TODO: Add FAQ logic
  };

  const handleRemoveFAQ = (_faqId: string) => {
    if (!editedArticle) return;
    // TODO: Remove FAQ logic
  };

  const handleMoveFAQ = (_index: number, _direction: 'up' | 'down') => {
    if (!editedArticle) return;
    // TODO: Move FAQ logic
  };

  if (!editedArticle) return null;

  return (
    <div className="article-faqs-tab">
      <div className="tab-header">
        <h3>Preguntas Frecuentes (FAQs)</h3>
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

      <div className="faqs-container">
        {editedArticle.faqs && editedArticle.faqs.length > 0 ? (
          <div className="faqs-list">
            {editedArticle.faqs.map((faq, index) => (
              <div key={faq.id} className="faq-item">
                <div className="faq-header">
                  <div className="faq-number">{index + 1}</div>
                  {isEditing && (
                    <div className="faq-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => handleMoveFAQ(index, 'up')}
                        disabled={index === 0}
                      >
                        <TiArrowSortedUp />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => handleMoveFAQ(index, 'down')}
                        disabled={index === (editedArticle.faqs?.length || 0) - 1}
                      >
                        <TiArrowSortedDown />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => handleRemoveFAQ(faq.id)}
                      >
                        <TiTrash />
                      </button>
                    </div>
                  )}
                </div>
                <div className="faq-content">
                  <div className="faq-question">
                    <strong>P:</strong> {faq.question_es}
                  </div>
                  {faq.question_en && (
                    <div className="faq-question">
                      <strong>Q:</strong> {faq.question_en}
                    </div>
                  )}
                  <div className="faq-answer">
                    <strong>R:</strong> {faq.answer_es}
                  </div>
                  {faq.answer_en && (
                    <div className="faq-answer">
                      <strong>A:</strong> {faq.answer_en}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-faqs">Sin preguntas frecuentes</p>
        )}

        {isEditing && (
          <div className="add-faq">
            <button className="btn btn-primary">
              <TiPlus /> Agregar FAQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
