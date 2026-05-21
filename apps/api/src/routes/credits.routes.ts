import { Hono } from 'hono'
import { CreditsController } from '../controllers/tmdb/credits.controller.js'
// import { PersonController } from '../controllers/tmdb/person.controller.js'

export const creditsRoutes = new Hono()

// GET /tmdb/credits/:id
creditsRoutes.get('/:id', CreditsController.getById)