import {
  TiPlus,
  TiPencil,
  TiTrash,
  TiChevronLeft,
  TiChevronRight,
  TiFilter
} from 'react-icons/ti';
import { TbSearch } from 'react-icons/tb';
import { usePeopleStore } from '../store/people.store';
import { useEffect, useState } from 'react';
import PersonaEditor from '../components/PersonaEditor';
import type { PersonItem } from '../store/people.store';

export default function Personas() {
  const {
    people,
    total,
    currentPage,
    perPage,
    loading,
    error,
    filters,
    fetchPeople,
    setFilters,
    setPage,
    deletePerson,
    updatePerson,
  } = usePeopleStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPeople, setDisplayedPeople] = useState(people);
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [selectedPerson, setSelectedPerson] = useState<PersonItem | null>(null);

  const totalPages = Math.ceil(total / perPage);

  // Cargar personas al montar el componente y cuando cambia la página o filtros
  useEffect(() => {
    fetchPeople();
  }, [currentPage, filters]);

  // Transición suave cuando cambian las personas
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayedPeople(people);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [people]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setActiveView('editor');
  };

  const handleEditPerson = async (person: PersonItem) => {
    // Fetch complete person data including all fields
    const { getPersonById } = usePeopleStore.getState();
    const completePerson = await getPersonById(person.id);
    
    if (completePerson) {
      setSelectedPerson(completePerson);
      setActiveView('editor');
    } else {
      alert('Error al cargar los datos de la persona');
    }
  };

  const handleSavePerson = async (person: PersonItem) => {
    // The PersonaEditor already handles the update, we just need to refresh and go back
    setActiveView('list');
    setSelectedPerson(null);
    await fetchPeople();
  };

  const handleBack = () => {
    setActiveView('list');
    setSelectedPerson(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setPage(newPage);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta persona?')) {
      await deletePerson(id);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // Parse the date string directly to avoid timezone conversion
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const getGenderText = (gender: number | null | undefined) => {
    switch (gender) {
      case 0: return 'No especificado';
      case 1: return 'Femenino';
      case 2: return 'Masculino';
      case 3: return 'No binario';
      default: return 'N/A';
    }
  };

  if (activeView === 'editor') {
    return (
      <div className="view active">
        <PersonaEditor
          person={selectedPerson}
          onBack={handleBack}
          onSave={handleSavePerson}
        />
      </div>
    );
  }

  if (loading && people.length === 0) {
    return (
      <div className="view active">
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando personas...</div>
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
      {/* Section Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Personas</div>
          <div className="section-sub">Gestión de personas del sistema</div>
        </div>
        <button className="btn btn-primary" onClick={handleAddPerson}>
          <TiPlus /> Agregar Persona
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <TbSearch style={{ color: 'var(--text3)', fontSize: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar personas..." 
            value={filters.search || ''}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-group">
          <button className="btn btn-ghost">
            <TiFilter /> Filtros
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-count">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--blue)' }}>{people.filter(p => p.gender === 1).length}</span>
          <span className="stat-label">Femenino</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--purple)' }}>{people.filter(p => p.gender === 2).length}</span>
          <span className="stat-label">Masculino</span>
        </div>
        <div className="stat-item">
          <span className="stat-count" style={{ color: 'var(--text3)' }}>{people.filter(p => !p.gender).length}</span>
          <span className="stat-label">No especificado</span>
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

      {/* People Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {people.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              No se encontraron personas
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha de Nacimiento</th>
                  <th>Género</th>
                  <th>Popularidad</th>
                  <th>Slug</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {person.profile_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                            alt={person.name}
                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{person.name}</div>
                          {person.also_known_as && person.also_known_as.length > 0 && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                              También conocido como: {person.also_known_as[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(person.birthdate ?? null)}</td>
                    <td>{getGenderText(person.gender)}</td>
                    <td>{person.tmdb_popularity?.toFixed(1) || 'N/A'}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{person.slug}</code>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                      <div className="action-group">
                        <button 
                          className="btn-icon" 
                          title="Editar"
                          onClick={() => handleEditPerson(person)}
                        >
                          <TiPencil />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Eliminar"
                          onClick={() => handleDelete(person.id)}
                        >
                          <TiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}
