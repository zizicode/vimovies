import {
  TiPlus,
  TiFilter,
  TiPencil,
  TiTrash,
  TiChevronLeft,
  TiChevronRight
} from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import { useArticlesStore } from '../store/articles.store';
import { useEffect, useState } from 'react';
import ArticuloEditor from '../components/ArticuloEditor';
import type { ArticleItem } from '../services/api.service';

export default function Articulos() {
  const {
    articles,
    total,
    currentPage,
    perPage,
    loading,
    error,
    filters,
    fetchArticles,
    setFilters,
    setPage,
    deleteArticle,
    updateArticle,
    publishArticle,
    archiveArticle,
  } = useArticlesStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedArticles, setDisplayedArticles] = useState(articles);
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  const totalPages = Math.ceil(total / perPage);

  // Cargar artículos al montar el componente y cuando cambia la página o filtros
  useEffect(() => {
    fetchArticles();
  }, [currentPage, filters]);

  // Transición suave cuando cambian los artículos
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayedArticles(articles);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [articles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ status: e.target.value as any });
  };

  const handleIntentFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ intent: e.target.value as any });
  };

  const handleAddArticle = () => {
    setSelectedArticle(null);
    setActiveView('editor');
  };

  const handleEditArticle = (article: ArticleItem) => {
    setSelectedArticle(article);
    setActiveView('editor');
  };

  const handleSaveArticle = async (article: ArticleItem) => {
    await fetchArticles();
    setSelectedArticle(article);
  };

  const handleBack = () => {
    setActiveView('list');
    setSelectedArticle(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setPage(newPage);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este artículo?')) {
      await deleteArticle(id);
    }
  };

  const handlePublish = async (id: string) => {
    await publishArticle(id);
  };

  const handleArchive = async (id: string) => {
    await archiveArticle(id);
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

  const getIntentBadge = (intent: string | undefined) => {
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

  if (loading && articles.length === 0) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando artículos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--red)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="view active">
      {activeView === 'list' ? (
        <>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Artículos</div>
          <div className="section-sub">Gestión de artículos del blog</div>
        </div>
        <button className="btn btn-primary" onClick={handleAddArticle}>
          <TiPlus /> Añadir artículo
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <TbSearch style={{ color: 'var(--text3)', fontSize: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar por título..." 
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-group">
          <button className="btn btn-ghost">
            <TiFilter /> Filtros
          </button>
          <select className="select" value={filters.status} onChange={handleStatusFilter}>
            <option value="">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
          <select className="select" value={filters.intent} onChange={handleIntentFilter}>
            <option value="">Todos los tipos</option>
            <option value="review">Review</option>
            <option value="news">Noticia</option>
            <option value="guide">Guía</option>
            <option value="list">Lista</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-count">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--green)' }}>{articles.filter(a => a.status === 'published').length}</span>
          <span className="stat-label">Publicado</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--gold)' }}>{articles.filter(a => a.status === 'draft').length}</span>
          <span className="stat-label">Borrador</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--text3)' }}>{articles.filter(a => a.status === 'archived').length}</span>
          <span className="stat-label">Archivado</span>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination pagination-centered">
        <button 
          className="btn btn-ghost" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <TiChevronLeft /> Anterior
        </button>
        <span className="page-info">
          Página {currentPage} de {totalPages || 1}
        </span>
        <button 
          className="btn btn-ghost"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
        >
          Siguiente <TiChevronRight />
        </button>
      </div>

      {/* Articles Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha publicación</th>
                <th>Actualizado</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedArticles.map((article, index) => (
                <tr 
                  key={article.id}
                  style={{
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                    transition: `opacity 0.2s ease, transform 0.2s ease ${index * 0.02}s`,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{article.title_es}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{article.slug}</div>
                  </td>
                  <td>{getIntentBadge(article.intent || 'review')}</td>
                  <td>{getStatusBadge(article.status)}</td>
                  <td style={{ fontSize: '12px' }}>
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {new Date(article.updated_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                    <div className="action-group">
                      {article.status === 'draft' && (
                        <button 
                          className="btn-icon" 
                          title="Publicar"
                          onClick={() => handlePublish(article.id)}
                        >
                          <TiPlus />
                        </button>
                      )}
                      {article.status === 'published' && (
                        <button 
                          className="btn-icon" 
                          title="Archivar"
                          onClick={() => handleArchive(article.id)}
                        >
                          📁
                        </button>
                      )}
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => handleEditArticle(article)}
                      >
                        <TiPencil />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar"
                        onClick={() => handleDelete(article.id)}
                      >
                        <TiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedArticles.length === 0 && (
                <tr style={{
                  opacity: isTransitioning ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    No hay artículos encontrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <ArticuloEditor 
          article={selectedArticle} 
          onBack={handleBack} 
          onSave={handleSaveArticle} 
        />
      )}

    </div>
  );
}
