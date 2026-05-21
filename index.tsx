import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './sidebar.scss';
import { TbMovie } from "react-icons/tb";
import { GrGroup } from "react-icons/gr";
import { LuTags, LuTv, LuLayoutDashboard } from "react-icons/lu";
import { RiSeoLine } from "react-icons/ri";
import { PiArticle } from "react-icons/pi";
import { CiBoxList } from "react-icons/ci";
import { IoSettingsOutline, IoSync } from "react-icons/io5";
import logo from '/flash-svgrepo-com.svg'
import { useMediaStore } from '../../../store/media.store';
import { usePeopleStore } from '../../../store/people.store';
import { useGenresStore } from '../../../store/genres.store';
import { usePlatformsStore } from '../../../store/platforms.store';

const SidebarUI: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mediaStore = useMediaStore();
  const peopleStore = usePeopleStore();
  const genresStore = useGenresStore();
  const platformsStore = usePlatformsStore();

  const [counts, setCounts] = useState({
    movies: 0,
    people: 0,
    genres: 0,
    platforms: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        await mediaStore.fetchMovies();
        await peopleStore.fetchPeople();
        await genresStore.fetchGenres();
        await platformsStore.fetchPlatforms();
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    setCounts({
      movies: mediaStore.total || mediaStore.movies.length,
      people: peopleStore.total || peopleStore.people.length,
      genres: genresStore.total || genresStore.genres.length,
      platforms: platformsStore.total || platformsStore.platforms.length,
    });
  }, [mediaStore.total, mediaStore.movies.length, peopleStore.total, peopleStore.people.length, genresStore.total, genresStore.genres.length, platformsStore.total, platformsStore.platforms.length]);

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <div id='sidebar' className='sidebar'>
        <div className="sidebar-logo">
            <div className="logo-mark"><img src={logo} alt="vimovies" /></div>
            <div className="logo-text">
                Vi<span>movies Control</span>
            </div>
        </div>
        <nav className="sidebar-nav">
      <div 
        className={
av-item }
        onClick={() => handleNavClick('/home')}
      >
        <LuLayoutDashboard className="ti ti-layout-dashboard"/> Inicio
      </div>

      <div className="nav-section-label">Contenido</div>
      <div 
        className={
av-item }
        onClick={() => handleNavClick('/peliculas')}
      >
        <TbMovie className="ti ti-movie"/> Películas
        <span className="nav-badge">{counts.movies}</span>
      </div>
      <div 
        className={
av-item }
        style={{paddingLeft:'24px',fontSize:'12.5px'}}
        onClick={() => handleNavClick('/personas')}
      >
        <GrGroup className="ti ti-users"/> Personas
        <span className="nav-badge">{counts.people}</span>
      </div>
      <div 
        className={
av-item }
        style={{paddingLeft:'24px',fontSize:'12.5px'}}
        onClick={() => handleNavClick('/generos')}
      >
        <LuTags className="ti ti-tag"/> Géneros
        <span className="nav-badge">{counts.genres}</span>
      </div>
      <div 
        className={
av-item }
        style={{paddingLeft:'24px',fontSize:'12.5px'}}
        onClick={() => handleNavClick('/plataformas')}
      >
        <LuTv className="ti ti-device-tv"/> Plataformas
        <span className="nav-badge">{counts.platforms}</span>
      </div>

      <div className="nav-section-label">Publicación</div>
      <div className="nav-item">
        <RiSeoLine className="ti ti-search"/> SEO
        <span className="nav-badge">12</span>
      </div>
      <div 
        className={
av-item }
        onClick={() => handleNavClick('/articulos')}
      >
        <PiArticle className="ti ti-article"/> Artículos
      </div>
      <div className="nav-item">
        <CiBoxList className="ti ti-list"/> Listas
      </div>

      <div className="nav-section-label">Sistema</div>
      <div 
        className={
av-item }
        onClick={() => handleNavClick('/sincronizacion')}
      >
        <IoSync className="ti ti-refresh"/> Sincronización
      </div>
      <div className="nav-item">
        <IoSettingsOutline className="ti ti-settings"/> Configuración
      </div>
    </nav>
    </div>
  )
}

export default SidebarUI