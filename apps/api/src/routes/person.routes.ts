import { Hono } from 'hono'
import { PersonController } from '../controllers/tmdb/person.controller.js'

export const personRoutes = new Hono()

// GET /tmdb/people/:id
personRoutes.get('/:id', PersonController.getPersonById)