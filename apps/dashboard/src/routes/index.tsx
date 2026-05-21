// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootLayout from '../root-layout'

import { Login } from '../pages/login'
import { Dashboard } from '../pages/dashboard'

import Home from '../pages/home'
import Peliculas from '../pages/peliculas'
import Articulos from '../pages/articulos'
import Personas from '../pages/personas'
import Generos from '../pages/generos'
import Plataformas from '../pages/plataformas'
import Sincronizacion from '../pages/sincronizacion'
import Seo from '../pages/seo'

import { ProtectedRoute } from './protection.route'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },

      {
        path: 'home',
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },

      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      {
        path: 'peliculas',
        element: (
          <ProtectedRoute>
            <Peliculas />
          </ProtectedRoute>
        ),
      },

      {
        path: 'articulos',
        element: (
          <ProtectedRoute>
            <Articulos />
          </ProtectedRoute>
        ),
      },

      {
        path: 'personas',
        element: (
          <ProtectedRoute>
            <Personas />
          </ProtectedRoute>
        ),
      },

      {
        path: 'generos',
        element: (
          <ProtectedRoute>
            <Generos />
          </ProtectedRoute>
        ),
      },

      {
        path: 'plataformas',
        element: (
          <ProtectedRoute>
            <Plataformas />
          </ProtectedRoute>
        ),
      },

      {
        path: 'sincronizacion',
        element: (
          <ProtectedRoute>
            <Sincronizacion />
          </ProtectedRoute>
        ),
      },

      {
        path: 'seo',
        element: (
          <ProtectedRoute>
            <Seo />
          </ProtectedRoute>
        ),
      },

      {
        path: '*',
        element: <h2>404 - Página no encontrada</h2>,
      },
    ],
  },
])