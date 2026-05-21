import { Hono } from 'hono'
import { MovieController } from '../controllers/tmdb/movie.controller'

export const movieRoutes = new Hono()

// GET /tmdb/movies/popular
movieRoutes.get('/popular', MovieController.getPopular)

// GET /tmdb/movies/search
movieRoutes.get('/search', MovieController.search)

// GET /tmdb/movies/:id
movieRoutes.get('/:id', MovieController.getById)