import { TiArrowBack, TiHome, TiGroup, TiDeviceDesktop, TiVideo, TiBook } from 'react-icons/ti';
import { useState, useEffect } from 'react';
import GeneralTab from './tabs/GeneralTab';
import RepartoTab from './tabs/RepartoTab';
import PlataformasTab from './tabs/PlataformasTab';
import TrailersTab from './tabs/TrailersTab';
import EditorialTab from './tabs/EditorialTab';
import type { MediaItem } from './tabs/types';

interface VistaPreviaProps {
  movie: MediaItem | null;
  onBack: () => void;
  onSave?: (updatedMovie: MediaItem) => void;
}

type TabType = 'general' | 'reparto' | 'plataformas' | 'trailers' | 'editorial';

export default function VistaPrevia({ movie, onBack, onSave }: VistaPreviaProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Scroll to top when component mounts or movie changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movie]);

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
        No hay película seleccionada
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab movie={movie} onSave={onSave} />;
      case 'reparto':
        return <RepartoTab movie={movie} />;
      case 'plataformas':
        return <PlataformasTab movie={movie} />;
      case 'trailers':
        return <TrailersTab movie={movie} />;
      case 'editorial':
        return <EditorialTab movie={movie} />;
      default:
        return <GeneralTab movie={movie} onSave={onSave} />;
    }
  };

  return (
    <div className="view active">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          <TiArrowBack /> Volver
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Vista Previa: {movie.title_es || movie.original_title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: '4px 0 0' }}>
            {movie.slug}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'var(--bg-raised)',
        padding: '4px',
        borderRadius: '12px',
      }}>
        <button 
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'general' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'general' ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={() => setActiveTab('general')}
        >
          <TiHome /> General
        </button>
        <button 
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'reparto' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'reparto' ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={() => setActiveTab('reparto')}
        >
          <TiGroup /> Reparto
        </button>
        <button 
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'plataformas' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'plataformas' ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={() => setActiveTab('plataformas')}
        >
          <TiDeviceDesktop /> Plataformas
        </button>
        <button 
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'trailers' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'trailers' ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={() => setActiveTab('trailers')}
        >
          <TiVideo /> Trailers
        </button>
        <button 
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'editorial' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'editorial' ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={() => setActiveTab('editorial')}
        >
          <TiBook /> Editorial
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden',
        padding: '32px',
      }}>
        {renderTab()}
      </div>
    </div>
  );
}
