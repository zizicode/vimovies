import { Hono } from 'hono'
import { CreditsController } from '../controllers/tmdb/credits.controller'
// import { PersonController } from '../controllers/tmdb/person.controller'

export const creditsRoutes = new Hono()

// GET /tmdb/credits/:id
creditsRoutes.get('/:id', CreditsController.getById)