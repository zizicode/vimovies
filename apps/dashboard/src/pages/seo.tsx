import { useState, useEffect } from 'react';
import { useSeoStore } from '../store/seo.store';
import { TiPlus, TiPencil, TiTrash, TiRefresh, TiTick, TiTimes, TiExport, TiUpload } from 'react-icons/ti';
import './seo.scss';

type TabType = 'audit' | 'redirects' | 'sitemaps';

export default function SeoPage() {
  const {
    auditLogs,
    auditLogsLoading,
    auditLogsError,
    redirects,
    redirectsLoading,
    redirectsError,
    sitemaps,
    sitemapsLoading,
    sitemapsError,
    fetchAuditLogs,
    runAudit,
    fetchRedirects,
    createRedirect,
    updateRedirect,
    deleteRedirect,
    fetchSitemaps,
    generateSitemap,
    submitSitemap,
  } = useSeoStore();

  const [activeTab, setActiveTab] = useState<TabType>('audit');
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<number | null>(null);
  const [redirectForm, setRedirectForm] = useState({
    from_path: '',
    to_path: '',
    status_code: 301 as 301 | 302,
    reason: '',
    is_active: true,
  });

  // Load data on mount
  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'redirects') fetchRedirects();
    if (activeTab === 'sitemaps') fetchSitemaps();
  }, [activeTab]);

  // Audit Handlers
  const handleRunAudit = async (entityType: string, entityId: string, locale: string) => {
    await runAudit(entityType, entityId, locale);
  };

  // Redirect Handlers
  const handleCreateRedirect = async () => {
    await createRedirect(redirectForm);
    setShowRedirectModal(false);
    setRedirectForm({ from_path: '', to_path: '', status_code: 301, reason: '', is_active: true });
  };

  const handleUpdateRedirect = async () => {
    if (editingRedirect) {
      await updateRedirect(editingRedirect, redirectForm);
      setShowRedirectModal(false);
      setEditingRedirect(null);
      setRedirectForm({ from_path: '', to_path: '', status_code: 301, reason: '', is_active: true });
    }
  };

  const handleEditRedirect = (redirect: any) => {
    setEditingRedirect(redirect.id);
    setRedirectForm({
      from_path: redirect.from_path,
      to_path: redirect.to_path,
      status_code: redirect.status_code,
      reason: redirect.reason || '',
      is_active: redirect.is_active,
    });
    setShowRedirectModal(true);
  };

  const handleDeleteRedirect = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta redirección?')) {
      await deleteRedirect(id);
    }
  };

  // Sitemap Handlers
  const handleGenerateSitemap = async (section: string) => {
    await generateSitemap(section);
  };

  const handleSubmitSitemap = async (section: string) => {
    await submitSitemap(section);
  };

  const getAuditScore = (audit: any) => {
    const checks = [
      audit.has_title,
      audit.has_description,
      audit.has_h1,
      audit.has_canonical,
      audit.has_og_image,
      audit.has_schema,
      audit.has_faq,
    ];
    const passed = checks.filter(Boolean).length;
    const total = checks.length;
    return Math.round((passed / total) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="seo-page">
      <div className="page-header">
        <h1>Gestión SEO</h1>
        <p>Administra la optimización para motores de búsqueda del sitio</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Auditoría SEO
        </button>
        <button
          className={`tab ${activeTab === 'redirects' ? 'active' : ''}`}
          onClick={() => setActiveTab('redirects')}
        >
          Redirecciones
        </button>
        <button
          className={`tab ${activeTab === 'sitemaps' ? 'active' : ''}`}
          onClick={() => setActiveTab('sitemaps')}
        >
          Sitemaps
        </button>
      </div>

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Auditoría SEO</h2>
            <button className="btn btn-secondary" onClick={() => fetchAuditLogs()}>
              <TiRefresh /> Actualizar
            </button>
          </div>

          {auditLogsError && (
            <div className="alert alert-error">
              <TiTimes /> {auditLogsError}
            </div>
          )}

          {auditLogsLoading ? (
            <div className="loading">Cargando auditorías...</div>
          ) : (
            <div className="audit-list">
              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No hay auditorías registradas</p>
                </div>
              ) : (
                auditLogs.map((audit) => {
                  const score = getAuditScore(audit);
                  return (
                    <div key={audit.id} className="audit-card">
                      <div className="audit-header">
                        <div className="audit-entity">
                          <span className="entity-type">{audit.entity_type}</span>
                          <span className="entity-id">#{audit.entity_id}</span>
                          <span className="locale-badge">{audit.locale}</span>
                        </div>
                        <div className={`audit-score ${getScoreColor(score)}`}>
                          {score}%
                        </div>
                      </div>
                      <div className="audit-details">
                        <div className="audit-checks">
                          <span className={audit.has_title ? 'check pass' : 'check fail'}>
                            {audit.has_title ? <TiTick /> : <TiTimes />} Título
                          </span>
                          <span className={audit.has_description ? 'check pass' : 'check fail'}>
                            {audit.has_description ? <TiTick /> : <TiTimes />} Descripción
                          </span>
                          <span className={audit.has_h1 ? 'check pass' : 'check fail'}>
                            {audit.has_h1 ? <TiTick /> : <TiTimes />} H1
                          </span>
                          <span className={audit.has_canonical ? 'check pass' : 'check fail'}>
                            {audit.has_canonical ? <TiTick /> : <TiTimes />} Canonical
                          </span>
                          <span className={audit.has_og_image ? 'check pass' : 'check fail'}>
                            {audit.has_og_image ? <TiTick /> : <TiTimes />} OG Image
                          </span>
                          <span className={audit.has_schema ? 'check pass' : 'check fail'}>
                            {audit.has_schema ? <TiTick /> : <TiTimes />} Schema
                          </span>
                          <span className={audit.has_faq ? 'check pass' : 'check fail'}>
                            {audit.has_faq ? <TiTick /> : <TiTimes />} FAQ
                          </span>
                        </div>
                        {audit.internal_link_count !== null && (
                          <div className="audit-metric">
                            <span>Links internos:</span> {audit.internal_link_count}
                          </div>
                        )}
                        {(audit.pagespeed_mobile !== null || audit.pagespeed_desktop !== null) && (
                          <div className="audit-metrics">
                            {audit.pagespeed_mobile !== null && (
                              <div className="audit-metric">
                                <span>PageSpeed Mobile:</span> {audit.pagespeed_mobile}/100
                              </div>
                            )}
                            {audit.pagespeed_desktop !== null && (
                              <div className="audit-metric">
                                <span>PageSpeed Desktop:</span> {audit.pagespeed_desktop}/100
                              </div>
                            )}
                          </div>
                        )}
                        {audit.notes && (
                          <div className="audit-notes">
                            <strong>Notas:</strong> {audit.notes}
                          </div>
                        )}
                        <div className="audit-date">
                          Auditado: {new Date(audit.checked_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Redirects Tab */}
      {activeTab === 'redirects' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Redirecciones</h2>
            <button className="btn btn-primary" onClick={() => setShowRedirectModal(true)}>
              <TiPlus /> Nueva Redirección
            </button>
          </div>

          {redirectsError && (
            <div className="alert alert-error">
              <TiTimes /> {redirectsError}
            </div>
          )}

          {redirectsLoading ? (
            <div className="loading">Cargando redirecciones...</div>
          ) : (
            <div className="redirects-table">
              {redirects.length === 0 ? (
                <div className="empty-state">
                  <p>No hay redirecciones configuradas</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Desde</th>
                      <th>Hacia</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Razón</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redirects.map((redirect) => (
                      <tr key={redirect.id} className={!redirect.is_active ? 'inactive' : ''}>
                        <td className="from-path">{redirect.from_path}</td>
                        <td className="to-path">{redirect.to_path}</td>
                        <td>
                          <span className={`status-code status-${redirect.status_code}`}>
                            {redirect.status_code}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${redirect.is_active ? 'active' : 'inactive'}`}>
                            {redirect.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>{redirect.reason || '-'}</td>
                        <td>{new Date(redirect.created_at).toLocaleDateString('es-ES')}</td>
                        <td className="actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditRedirect(redirect)}
                            title="Editar"
                          >
                            <TiPencil />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteRedirect(redirect.id)}
                            title="Eliminar"
                          >
                            <TiTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sitemaps Tab */}
      {activeTab === 'sitemaps' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Sitemaps</h2>
            <button className="btn btn-secondary" onClick={() => fetchSitemaps()}>
              <TiRefresh /> Actualizar
            </button>
          </div>

          {sitemapsError && (
            <div className="alert alert-error">
              <TiTimes /> {sitemapsError}
            </div>
          )}

          {sitemapsLoading ? (
            <div className="loading">Cargando sitemaps...</div>
          ) : (
            <div className="sitemaps-grid">
              {sitemaps.length === 0 ? (
                <div className="empty-state">
                  <p>No hay sitemaps registrados</p>
                </div>
              ) : (
                sitemaps.map((sitemap) => (
                  <div key={sitemap.id} className="sitemap-card">
                    <div className="sitemap-header">
                      <h3>{sitemap.section}</h3>
                      <span className={`priority ${sitemap.priority}`}>{sitemap.priority}</span>
                    </div>
                    <div className="sitemap-details">
                      <div className="detail">
                        <span>Archivo:</span> {sitemap.filename}
                      </div>
                      <div className="detail">
                        <span>URLs:</span> {sitemap.url_count}
                      </div>
                      {sitemap.last_generated_at && (
                        <div className="detail">
                          <span>Generado:</span>{' '}
                          {new Date(sitemap.last_generated_at).toLocaleString('es-ES')}
                        </div>
                      )}
                      {sitemap.last_submitted_at && (
                        <div className="detail">
                          <span>Enviado a Google:</span>{' '}
                          {new Date(sitemap.last_submitted_at).toLocaleString('es-ES')}
                        </div>
                      )}
                    </div>
                    <div className="sitemap-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleGenerateSitemap(sitemap.section)}
                      >
                        <TiExport /> Generar
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSubmitSitemap(sitemap.section)}
                      >
                        <TiUpload /> Enviar a Google
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Redirect Modal */}
      {showRedirectModal && (
        <div className="modal-overlay" onClick={() => setShowRedirectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRedirect ? 'Editar Redirección' : 'Nueva Redirección'}</h3>
              <button className="btn-icon" onClick={() => setShowRedirectModal(false)}>
                <TiTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Desde (path)</label>
                <input
                  type="text"
                  value={redirectForm.from_path}
                  onChange={(e) => setRedirectForm({ ...redirectForm, from_path: e.target.value })}
                  placeholder="/vieja-url"
                />
              </div>
              <div className="form-group">
                <label>Hacia (path)</label>
                <input
                  type="text"
                  value={redirectForm.to_path}
                  onChange={(e) => setRedirectForm({ ...redirectForm, to_path: e.target.value })}
                  placeholder="/nueva-url"
                />
              </div>
              <div className="form-group">
                <label>Tipo de Redirección</label>
                <select
                  value={redirectForm.status_code}
                  onChange={(e) => setRedirectForm({ ...redirectForm, status_code: Number(e.target.value) as 301 | 302 })}
                >
                  <option value={301}>301 - Permanente</option>
                  <option value={302}>302 - Temporal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Razón</label>
                <input
                  type="text"
                  value={redirectForm.reason}
                  onChange={(e) => setRedirectForm({ ...redirectForm, reason: e.target.value })}
                  placeholder="Motivo de la redirección"
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={redirectForm.is_active}
                    onChange={(e) => setRedirectForm({ ...redirectForm, is_active: e.target.checked })}
                  />
                  Activa
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRedirectModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={editingRedirect ? handleUpdateRedirect : handleCreateRedirect}
              >
                {editingRedirect ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
