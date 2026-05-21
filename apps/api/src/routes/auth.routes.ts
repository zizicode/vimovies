import { Hono } from 'hono'
import { AuthController } from '../controllers/auth.controller'
import { createAuthMiddleware } from '@vimovies/utils/src/auth.utils'

export const authRoutes = new Hono()

// ── Public Auth Routes ────────────────────────────────────────────────────────

// POST /auth/admin/login
authRoutes.post('/admin/login', AuthController.adminLogin)

// ── Protected Auth Routes ──────────────────────────────────────────────────────

// GET /auth/verify (verificar token actual)
authRoutes.get('/verify', createAuthMiddleware(), AuthController.verifyToken)
