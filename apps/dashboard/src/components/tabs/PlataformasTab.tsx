import { useState, useEffect } from 'react';
import { TiPlus, TiTrash, TiPencil } from 'react-icons/ti';
import type { MediaItem, WatchProvider, Platform } from './types';
import { mediaService, platformsService } from '../../services/api.service';
import { useAuthStore } from '../../store';

interface PlataformasTabProps {
  movie: MediaItem;
}

const REGIONS = [
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'US', name: 'Estados Unidos' },
];

export default function PlataformasTab({ movie }: PlataformasTabProps) {
  const { token } = useAuthStore();
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<WatchProvider | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('ES');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isRent, setIsRent] = useState(false);
  const [isBuy, setIsBuy] = useState(false);
  const [rentPrice, setRentPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [watchUrl, setWatchUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');

  useEffect(() => {
    loadData();
  }, [movie.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersResponse, platformsResponse] = await Promise.all([
        mediaService.getWatchProviders(movie.id, undefined, token || ''),
        platformsService.adminList(token || ''),
      ]);
      if (providersResponse.data) {
        setProviders(providersResponse.data);
      }
      if (platformsResponse.data) {
        setPlatforms(platformsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    if (!selectedPlatform) return;
    try {
      await mediaService.addWatchProvider(
        movie.id,
        {
          platform_id: selectedPlatform.id,
          region_code: selectedRegion,
          is_streaming: isStreaming,
          is_rent: isRent,
          is_buy: isBuy,
          rent_price_usd: rentPrice ? parseFloat(rentPrice) : null,
          buy_price_usd: buyPrice ? parseFloat(buyPrice) : null,
          watch_url: watchUrl || null,
          affiliate_url: affiliateUrl || null,
        },
        token || ''
      );
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error adding provider:', error);
      alert('Error al agregar la plataforma');
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plataforma?')) return;
    try {
      await mediaService.removeWatchProvider(movie.id, providerId, token || '');
      loadData();
    } catch (error) {
      console.error('Error removing provider:', error);
      alert('Error al eliminar la plataforma');
    }
  };

  const handleEditProvider = (provider: WatchProvider) => {
    setEditingProvider(provider);
    setSelectedPlatform(provider.platform);
    setSelectedRegion(provider.region_code);
    setIsStreaming(provider.is_streaming);
    setIsRent(provider.is_rent);
    setIsBuy(provider.is_buy);
    setRentPrice(provider.rent_price_usd?.toString() || '');
    setBuyPrice(provider.buy_price_usd?.toString() || '');
    setWatchUrl(provider.watch_url || '');
    setAffiliateUrl(provider.affiliate_url || '');
    setShowAddModal(true);
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider || !selectedPlatform) return;
    try {
      await mediaService.updateWatchProvider(
        movie.id,
        editingProvider.id,
        {
          is_streaming: isStreaming,
          is_rent: isRent,
          is_buy: isBuy,
          rent_price_usd: rentPrice ? parseFloat(rentPrice) : null,
          buy_price_usd: buyPrice ? parseFloat(buyPrice) : null,
          watch_url: watchUrl || null,
          affiliate_url: affiliate_url || null,
        },
        token || ''
      );
      setShowAddModal(false);
      setEditingProvider(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('Error al actualizar la plataforma');
    }
  };

  const resetForm = () => {
    setSelectedPlatform(null);
    setSelectedRegion('ES');
    setIsStreaming(true);
    setIsRent(false);
    setIsBuy(false);
    setRentPrice('');
    setBuyPrice('');
    setWatchUrl('');
    setAffiliateUrl('');
  };

  const getRegionName = (code: string) => {
    return REGIONS.find(r => r.code === code)?.name || code;
  };

  const getAvailabilityBadges = (provider: WatchProvider) => {
    const badges = [];
    if (provider.is_streaming) {
      badges.push(
        <span
          key="streaming"
          style={{
            background: 'var(--green)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Streaming
        </span>
      );
    }
    if (provider.is_rent) {
      badges.push(
        <span
          key="rent"
          style={{
            background: 'var(--blue)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Alquiler
        </span>
      );
    }
    if (provider.is_buy) {
      badges.push(
        <span
          key="buy"
          style={{
            background: 'var(--gold)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Compra
        </span>
      );
    }
    return badges;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        Cargando plataformas...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Plataformas</h3>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: '4px 0 0' }}>
            {providers.length} {providers.length === 1 ? 'plataforma' : 'plataformas'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingProvider(null);
            resetForm();
            setShowAddModal(true);
          }}
        >
          <TiPlus /> Agregar
        </button>
      </div>

      {/* Providers List */}
      {providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay plataformas</p>
          <p style={{ fontSize: '14px' }}>Agrega plataformas donde está disponible esta película</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {providers.map((provider) => (
            <div
              key={provider.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'var(--bg-raised)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Platform Logo */}
              {provider.platform.logo_url ? (
                <img
                  src={provider.platform.logo_url}
                  alt={provider.platform.name_es}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    background: 'white',
                    padding: '8px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: 'var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text3)',
                    fontSize: '24px',
                  }}
                >
                  {provider.platform.name_es.charAt(0)}
                </div>
              )}

              {/* Platform Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>
                    {provider.platform.name_es}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: '14px' }}>
                    ({getRegionName(provider.region_code)})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {getAvailabilityBadges(provider)}
                </div>
                {(provider.rent_price_usd || provider.buy_price_usd) && (
                  <div style={{ fontSize: '14px', color: 'var(--text3)', marginTop: '4px' }}>
                    {provider.rent_price_usd && <span>Alquiler: ${provider.rent_price_usd} </span>}
                    {provider.buy_price_usd && <span>Compra: ${provider.buy_price_usd}</span>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className="btn-icon"
                  onClick={() => handleEditProvider(provider)}
                  title="Editar"
                >
                  <TiPencil />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleRemoveProvider(provider.id)}
                  title="Eliminar"
                  style={{ color: 'var(--red)' }}
                >
                  <TiTrash />
                </button>
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
            setEditingProvider(null);
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
              {editingProvider ? 'Editar Plataforma' : 'Agregar Plataforma'}
            </h3>

            {/* Platform Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Plataforma
              </label>
              <select
                className="form-select"
                value={selectedPlatform?.id || ''}
                onChange={(e) => {
                  const platform = platforms.find(p => p.id === Number(e.target.value));
                  setSelectedPlatform(platform || null);
                }}
                style={{ width: '100%' }}
                disabled={!!editingProvider}
              >
                <option value="">Seleccionar plataforma</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name_es}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Región
              </label>
              <select
                className="form-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                style={{ width: '100%' }}
                disabled={!!editingProvider}
              >
                {REGIONS.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Tipo de disponibilidad
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isStreaming}
                    onChange={(e) => setIsStreaming(e.target.checked)}
                  />
                  Streaming
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isRent}
                    onChange={(e) => setIsRent(e.target.checked)}
                  />
                  Alquiler
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isBuy}
                    onChange={(e) => setIsBuy(e.target.checked)}
                  />
                  Compra
                </label>
              </div>
            </div>

            {/* Prices */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Precios (USD)
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Precio alquiler"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    disabled={!isRent}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Precio compra"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    disabled={!isBuy}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* URLs */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                URL de visualización
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={watchUrl}
                onChange={(e) => setWatchUrl(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                URL de afiliado
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProvider(null);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={editingProvider ? handleUpdateProvider : handleAddProvider}
                disabled={!selectedPlatform}
              >
                {editingProvider ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
