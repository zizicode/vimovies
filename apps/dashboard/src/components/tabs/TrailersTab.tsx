import { useState, useEffect } from 'react';
import { TiPlus, TiTrash, TiPencil, TiVideo } from 'react-icons/ti';
import type { MediaItem, MediaVideo, VideoType, VideoSite, VideoLocale } from './types';
import { mediaService } from '../../services/api.service';
import { useAuthStore } from '../../store';

interface TrailersTabProps {
  movie: MediaItem;
}

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: 'trailer', label: 'Trailer' },
  { value: 'teaser', label: 'Teaser' },
  { value: 'clip', label: 'Clip' },
  { value: 'featurette', label: 'Featurette' },
  { value: 'behind_the_scenes', label: 'Detrás de cámaras' },
  { value: 'bloopers', label: 'Bloopers' },
];

const VIDEO_SITES: { value: VideoSite; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
];

const LOCALES: { value: VideoLocale; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
];

export default function TrailersTab({ movie }: TrailersTabProps) {
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MediaVideo | null>(null);
  const [selectedType, setSelectedType] = useState<VideoType>('trailer');
  const [selectedSite, setSelectedSite] = useState<VideoSite>('youtube');
  const [selectedLocale, setSelectedLocale] = useState<VideoLocale>('es');
  const [externalKey, setExternalKey] = useState('');
  const [title, setTitle] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);
  const [previewVideo, setPreviewVideo] = useState<MediaVideo | null>(null);

  useEffect(() => {
    loadVideos();
  }, [movie.id]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await mediaService.getVideos(movie.id, token || '');
      if (response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeKey = (input: string): string | null => {
    // Try to extract key from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/, // Direct key
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddVideo = async () => {
    const key = selectedSite === 'youtube' ? extractYouTubeKey(externalKey) : externalKey;
    if (!key) {
      alert('Por favor ingresa una URL o key válida');
      return;
    }
    try {
      await mediaService.addVideo(
        movie.id,
        {
          locale: selectedLocale,
          video_type: selectedType,
          video_site: selectedSite,
          external_key: key,
          title: title || null,
          published_at: publishedAt || null,
          is_official: isOfficial,
        },
        token || ''
      );
      setShowAddModal(false);
      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error al agregar el video');
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este video?')) return;
    try {
      await mediaService.removeVideo(movie.id, videoId, token || '');
      loadVideos();
    } catch (error) {
      console.error('Error removing video:', error);
      alert('Error al eliminar el video');
    }
  };

  const handleEditVideo = (video: MediaVideo) => {
    setEditingVideo(video);
    setSelectedType(video.video_type);
    setSelectedSite(video.video_site);
    setSelectedLocale(video.locale);
    setExternalKey(video.external_key);
    setTitle(video.title || '');
    setPublishedAt(video.published_at || '');
    setIsOfficial(video.is_official);
    setShowAddModal(true);
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    try {
      await mediaService.updateVideo(
        movie.id,
        editingVideo.id,
        {
          title: title || null,
          published_at: publishedAt || null,
          is_official: isOfficial,
        },
        token || ''
      );
      setShowAddModal(false);
      setEditingVideo(null);
      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Error al actualizar el video');
    }
  };

  const resetForm = () => {
    setSelectedType('trailer');
    setSelectedSite('youtube');
    setSelectedLocale('es');
    setExternalKey('');
    setTitle('');
    setPublishedAt('');
    setIsOfficial(true);
  };

  const getThumbnailUrl = (video: MediaVideo) => {
    if (video.video_site === 'youtube') {
      return `https://img.youtube.com/vi/${video.external_key}/mqdefault.jpg`;
    }
    return null;
  };

  const getVideoUrl = (video: MediaVideo) => {
    if (video.video_site === 'youtube') {
      return `https://www.youtube.com/watch?v=${video.external_key}`;
    }
    return null;
  };

  const getEmbedUrl = (video: MediaVideo) => {
    if (video.video_site === 'youtube') {
      return `https://www.youtube.com/embed/${video.external_key}`;
    }
    return null;
  };

  const getTypeLabel = (type: VideoType) => {
    return VIDEO_TYPES.find(t => t.value === type)?.label || type;
  };

  const getSiteLabel = (site: VideoSite) => {
    return VIDEO_SITES.find(s => s.value === site)?.label || site;
  };

  const getLocaleLabel = (locale: VideoLocale) => {
    return LOCALES.find(l => l.value === locale)?.label || locale;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        Cargando videos...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Videos y Trailers</h3>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: '4px 0 0' }}>
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingVideo(null);
            resetForm();
            setShowAddModal(true);
          }}
        >
          <TiPlus /> Agregar
        </button>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay videos</p>
          <p style={{ fontSize: '14px' }}>Agrega trailers, teasers y clips de esta película</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                background: 'var(--bg-raised)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%', // 16:9 aspect ratio
                  background: '#000',
                  cursor: 'pointer',
                }}
                onClick={() => setPreviewVideo(video)}
              >
                {getThumbnailUrl(video) ? (
                  <img
                    src={getThumbnailUrl(video)!}
                    alt={video.title || 'Video'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text3)',
                    }}
                  >
                    <TiVideo style={{ fontSize: '48px' }} />
                  </div>
                )}
                {/* Play button overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                  }}
                >
                  <TiVideo style={{ fontSize: '24px', color: 'white', marginLeft: '4px' }} />
                </div>
                {/* Official badge */}
                {video.is_official && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'var(--gold)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Oficial
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      background: 'var(--blue)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {getTypeLabel(video.video_type)}
                  </span>
                  <span
                    style={{
                      background: 'var(--border-subtle)',
                      color: 'var(--text2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {getLocaleLabel(video.locale)}
                  </span>
                </div>
                {video.title && (
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 8px', lineHeight: '1.4' }}>
                    {video.title}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {getSiteLabel(video.video_site)}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {getVideoUrl(video) && (
                      <a
                        href={getVideoUrl(video)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        style={{ color: 'var(--blue)' }}
                        title="Ver en YouTube"
                      >
                        <TiVideo />
                      </a>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => handleEditVideo(video)}
                      title="Editar"
                    >
                      <TiPencil />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleRemoveVideo(video.id)}
                      title="Eliminar"
                      style={{ color: 'var(--red)' }}
                    >
                      <TiTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAddModal(false);
            setEditingVideo(null);
            resetForm();
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              {editingVideo ? 'Editar Video' : 'Agregar Video'}
            </h3>

            {/* Video Site */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Plataforma
              </label>
              <select
                className="form-select"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value as VideoSite)}
                style={{ width: '100%' }}
                disabled={!!editingVideo}
              >
                {VIDEO_SITES.map((site) => (
                  <option key={site.value} value={site.value}>
                    {site.label}
                  </option>
                ))}
              </select>
            </div>

            {/* External Key / URL */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                {selectedSite === 'youtube' ? 'URL de YouTube o ID del video' : 'ID del video'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={selectedSite === 'youtube' ? 'https://youtube.com/watch?v=...' : 'ID del video'}
                value={externalKey}
                onChange={(e) => setExternalKey(e.target.value)}
                disabled={!!editingVideo}
                style={{ width: '100%' }}
              />
            </div>

            {/* Video Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Tipo de video
              </label>
              <select
                className="form-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as VideoType)}
                style={{ width: '100%' }}
                disabled={!!editingVideo}
              >
                {VIDEO_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Locale */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Idioma
              </label>
              <select
                className="form-select"
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value as VideoLocale)}
                style={{ width: '100%' }}
                disabled={!!editingVideo}
              >
                {LOCALES.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Título (opcional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Trailer Oficial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Published At */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Fecha de publicación (opcional)
              </label>
              <input
                type="date"
                className="form-input"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Is Official */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                />
                Video oficial
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVideo(null);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={editingVideo ? handleUpdateVideo : handleAddVideo}
                disabled={!externalKey}
              >
                {editingVideo ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setPreviewVideo(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              aspectRatio: '16/9',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {getEmbedUrl(previewVideo) ? (
              <iframe
                src={`${getEmbedUrl(previewVideo)}?autoplay=1`}
                title={previewVideo.title || 'Video'}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '12px',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                }}
              >
                No se puede previsualizar este video
              </div>
            )}
            <button
              onClick={() => setPreviewVideo(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
