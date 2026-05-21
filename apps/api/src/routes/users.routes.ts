import { Hono } from 'hono'
import { UsersController } from '../controllers/users.controller'
import { createAuthMiddleware } from '@vimovies/utils'

export const usersRoutes = new Hono()

// ── Admin Routes ───────────────────────────────────────────────────────────

// Apply auth middleware to all admin routes
usersRoutes.use('/admin/*', createAuthMiddleware('admin'))

// ── Auth Routes ────────────────────────────────────────────────────────────

// POST /users/admin/login
// @deprecated Usa /auth/admin/login en su lugar
usersRoutes.post('/admin/login', UsersController.adminLogin)

// ── Profile Routes ────────────────────────────────────────────────────────

// Apply auth middleware to user profile routes
usersRoutes.use('/me/*', createAuthMiddleware())

// GET /users/me
usersRoutes.get('/me', UsersController.getMe)

// PATCH /users/me
usersRoutes.patch('/me', UsersController.updateMe)

// ── Reviews Routes ────────────────────────────────────────────────────────

// GET /users/me/reviews
usersRoutes.get('/me/reviews', UsersController.myReviews)

// POST /users/me/reviews
usersRoutes.post('/me/reviews', UsersController.upsertReview)

// ── Watchlists Routes ─────────────────────────────────────────────────────

// GET /users/me/watchlists
usersRoutes.get('/me/watchlists', UsersController.myWatchlists)

// GET /users/watchlists/:id
usersRoutes.get('/watchlists/:id', UsersController.getWatchlist)

// POST /users/me/watchlists
usersRoutes.post('/me/watchlists', UsersController.createWatchlist)

// PATCH /users/watchlists/:id
usersRoutes.patch('/watchlists/:id', UsersController.updateWatchlist)

// DELETE /users/watchlists/:id
usersRoutes.delete('/watchlists/:id', UsersController.deleteWatchlist)

// POST /users/watchlists/:id/items
usersRoutes.post('/watchlists/:id/items', UsersController.addToWatchlist)

// DELETE /users/watchlists/:id/items/:mediaId
usersRoutes.delete('/watchlists/:id/items/:mediaId', UsersController.removeFromWatchlist)

// PATCH /users/watchlists/:id/items/:mediaId/watched
usersRoutes.patch('/watchlists/:id/items/:mediaId/watched', UsersController.markWatched)

// ── Admin Routes ───────────────────────────────────────────────────────────

// GET /admin/users
usersRoutes.get('/admin', UsersController.adminList)

// PATCH /admin/users/:id/role
usersRoutes.patch('/admin/:id/role', UsersController.updateRole)

// PATCH /admin/users/:id/deactivate
usersRoutes.patch('/admin/:id/deactivate', UsersController.deactivate)

// GET /admin/users/reviews
usersRoutes.get('/admin/reviews', UsersController.adminReviews)

// PATCH /admin/users/reviews/:id/moderate
usersRoutes.patch('/admin/reviews/:id/moderate', UsersController.moderateReview)
