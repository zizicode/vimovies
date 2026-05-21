import { useState, useEffect } from 'react';
import { TiPlus, TiTrash, TiArrowUp, TiArrowDown } from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import type { MediaItem, Credit, Person } from './types';
import { mediaService, peopleService } from '../../services/api.service';
import { useAuthStore } from '../../store';

interface RepartoTabProps {
  movie: MediaItem;
}

export default function RepartoTab({ movie }: RepartoTabProps) {
  const { token } = useAuthStore();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [role, setRole] = useState<'actor' | 'director' | 'writer'>('actor');

  useEffect(() => {
    loadCredits();
  }, [movie.id]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await mediaService.getCredits(movie.id, token || '');
      if (response.data) {
        setCredits(response.data);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await peopleService.list(1, 20, query, token || '');
      if (response.data) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching people:', error);
    }
  };

  const handleAddCredit = async () => {
    if (!selectedPerson) return;
    try {
      const maxOrder = credits
        .filter(c => c.cast_order !== null)
        .reduce((max, c) => Math.max(max, c.cast_order || 0), -1);
      
      await mediaService.addCredit(
        movie.id,
        {
          person_id: selectedPerson.id,
          role,
          character_name: characterName || null,
          cast_order: maxOrder + 1,
        },
        token || ''
      );
      setShowAddModal(false);
      setSelectedPerson(null);
      setCharacterName('');
      setSearchQuery('');
      setSearchResults([]);
      loadCredits();
    } catch (error) {
      console.error('Error adding credit:', error);
      alert('Error al agregar el crédito');
    }
  };

  const handleRemoveCredit = async (creditId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este crédito?')) return;
    try {
      await mediaService.removeCredit(movie.id, creditId, token || '');
      loadCredits();
    } catch (error) {
      console.error('Error removing credit:', error);
      alert('Error al eliminar el crédito');
    }
  };

  const handleMoveUp = async (credit: Credit, index: number) => {
    if (index === 0) return;
    const creditAbove = credits[index - 1];
    try {
      await Promise.all([
        mediaService.updateCreditOrder(movie.id, credit.id, creditAbove.cast_order || index - 1, token || ''),
        mediaService.updateCreditOrder(movie.id, creditAbove.id, credit.cast_order || index, token || ''),
      ]);
      loadCredits();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleMoveDown = async (credit: Credit, index: number) => {
    if (index === credits.length - 1) return;
    const creditBelow = credits[index + 1];
    try {
      await Promise.all([
        mediaService.updateCreditOrder(movie.id, credit.id, creditBelow.cast_order || index + 1, token || ''),
        mediaService.updateCreditOrder(movie.id, creditBelow.id, credit.cast_order || index, token || ''),
      ]);
      loadCredits();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getProfileUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      actor: 'var(--blue)',
      director: 'var(--gold)',
      writer: 'var(--green)',
    };
    const labels: Record<string, string> = {
      actor: 'Actor',
      director: 'Director',
      writer: 'Guionista',
    };
    return (
      <span
        style={{
          background: colors[role] || 'var(--text3)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        {labels[role] || role}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        Cargando reparto...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Reparto y Equipo</h3>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: '4px 0 0' }}>
            {credits.length} {credits.length === 1 ? 'crédito' : 'créditos'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <TiPlus /> Agregar
        </button>
      </div>

      {/* Credits List */}
      {credits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay créditos</p>
          <p style={{ fontSize: '14px' }}>Agrega actores, directores y guionistas a esta película</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {credits.map((credit, index) => (
            <div
              key={credit.id}
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
              {/* Profile Image */}
              {credit.person.profile_path ? (
                <img
                  src={getProfileUrl(credit.person.profile_path)!}
                  alt={credit.person.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    objectFit: 'cover',
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
                  {credit.person.name.charAt(0)}
                </div>
              )}

              {/* Person Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>
                    {credit.person.name}
                  </span>
                  {getRoleBadge(credit.role)}
                </div>
                {credit.character_name && (
                  <p style={{ fontSize: '14px', color: 'var(--text3)', margin: 0 }}>
                    como {credit.character_name}
                  </p>
                )}
                {credit.job_title && (
                  <p style={{ fontSize: '14px', color: 'var(--text3)', margin: 0 }}>
                    {credit.job_title}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {credit.role === 'actor' && (
                  <>
                    <button
                      className="btn-icon"
                      onClick={() => handleMoveUp(credit, index)}
                      disabled={index === 0}
                      title="Mover arriba"
                    >
                      <TiArrowUp />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleMoveDown(credit, index)}
                      disabled={index === credits.length - 1}
                      title="Mover abajo"
                    >
                      <TiArrowDown />
                    </button>
                  </>
                )}
                <button
                  className="btn-icon"
                  onClick={() => handleRemoveCredit(credit.id)}
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

      {/* Add Modal */}
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
          onClick={() => setShowAddModal(false)}
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
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Agregar Crédito</h3>

            {/* Role Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Rol
              </label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="actor">Actor</option>
                <option value="director">Director</option>
                <option value="writer">Guionista</option>
              </select>
            </div>

            {/* Person Search */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Buscar persona
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre del actor, director..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <TbSearch
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text3)',
                  }}
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    background: 'var(--bg-raised)',
                  }}
                >
                  {searchResults.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => {
                        setSelectedPerson(person);
                        setSearchQuery(person.name);
                        setSearchResults([]);
                      }}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-raised)'}
                    >
                      {person.profile_path ? (
                        <img
                          src={getProfileUrl(person.profile_path)!}
                          alt={person.name}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            background: 'var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text3)',
                          }}
                        >
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <span>{person.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Person */}
            {selectedPerson && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-raised)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedPerson.profile_path ? (
                    <img
                      src={getProfileUrl(selectedPerson.profile_path)!}
                      alt={selectedPerson.name}
                      style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '6px',
                        background: 'var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text3)',
                      }}
                    >
                      {selectedPerson.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600' }}>{selectedPerson.name}</div>
                    <button
                      onClick={() => {
                        setSelectedPerson(null);
                        setSearchQuery('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Character Name (for actors) */}
            {role === 'actor' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Nombre del personaje (opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Bruce Wayne"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPerson(null);
                  setSearchQuery('');
                  setCharacterName('');
                  setSearchResults([]);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddCredit}
                disabled={!selectedPerson}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
