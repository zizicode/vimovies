import type { Context } from 'hono'
import { UsersService } from '../services/users.service.js'
import {
  ok,
  fail,
  notFound,
  paginated,
  serverError,
} from '@vimovies/utils'

const getUserId = (c: Context) => c.get('userId') as string

const parsePagination = (c: Context, defaults = { page: 1, perPage: 20 }) => ({
  page: Number(c.req.query('page') ?? defaults.page),
  perPage: Number(c.req.query('per_page') ?? defaults.perPage),
})

export const UsersController = {
  // ── Auth ─────────────────────────────────────

  async adminLogin(c: Context) {
    try {
      const body = await c.req.json()
      const { password } = body

      if (!password) {
        return fail(c, 'Contraseña requerida', 400)
      }

      const result = await UsersService.adminLogin(password)

      if (!result) {
        return fail(c, 'Credenciales inválidas', 401)
      }

      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Profile ─────────────────────────────────────

  async getMe(c: Context) {
    try {
      const user = await UsersService.findById(getUserId(c))
      return user ? ok(c, user) : notFound(c, 'Usuario')
    } catch (err) {
      return serverError(c, err)
    }
  },

  async updateMe(c: Context) {
    try {
      const body = await c.req.json()

      const user = await UsersService.updateProfile(
        getUserId(c),
        (({
          username,
          display_name,
          avatar_url,
          locale_pref,
          region_code,
        }) => ({
          username,
          display_name,
          avatar_url,
          locale_pref,
          region_code,
        }))(body)
      )

      return ok(c, user)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Reviews ─────────────────────────────────────

  async myReviews(c: Context) {
    try {
      return ok(
        c,
        await UsersService.findReviewsByUser(getUserId(c))
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async upsertReview(c: Context) {
    try {
      const body = await c.req.json()

      if (!body.rating || body.rating < 1 || body.rating > 10) {
        return fail(c, 'El rating debe ser entre 1 y 10', 422)
      }

      if (!body.media_id) {
        return fail(c, 'media_id es requerido', 400)
      }

      const review = await UsersService.upsertReview({
        user_id: getUserId(c),
        media_id: body.media_id,
        rating: body.rating,
        body: body.body,
        locale: body.locale ?? 'es',
      })

      return ok(c, review, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Watchlists ──────────────────────────────────

  async myWatchlists(c: Context) {
    try {
      return ok(
        c,
        await UsersService.findWatchlistsByUser(
          getUserId(c),
          true
        )
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async getWatchlist(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      const list = await UsersService.findWatchlistById(id)

      return list
        ? ok(c, list)
        : notFound(c, 'Lista')
    } catch (err) {
      return serverError(c, err)
    }
  },

  async createWatchlist(c: Context) {
    try {
      const body = await c.req.json()

      return ok(
        c,
        await UsersService.createWatchlist({
          ...body,
          user_id: getUserId(c),
        }),
        201
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async updateWatchlist(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)

      return ok(
        c,
        await UsersService.updateWatchlist(
          id,
          await c.req.json()
        )
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async deleteWatchlist(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      await UsersService.deleteWatchlist(id)

      return ok(c, {
        message: 'Lista eliminada',
      })
    } catch (err) {
      return serverError(c, err)
    }
  },

  async addToWatchlist(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      const { media_id } = await c.req.json()

      return ok(
        c,
        await UsersService.addToWatchlist(id, media_id),
        201
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async removeFromWatchlist(c: Context) {
    try {
      const { id, mediaId } = c.req.param()
      if (!id || !mediaId) return fail(c, 'IDs requeridos', 400)

      await UsersService.removeFromWatchlist(id, mediaId)

      return ok(c, {
        message: 'Elemento eliminado',
      })
    } catch (err) {
      return serverError(c, err)
    }
  },

  async markWatched(c: Context) {
    try {
      const { id, mediaId } = c.req.param()
      if (!id || !mediaId) return fail(c, 'IDs requeridos', 400)
      const { watched } = await c.req.json()

      return ok(
        c,
        await UsersService.markWatched(
          id,
          mediaId,
          watched
        )
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── Admin ───────────────────────────────────────

  async adminList(c: Context) {
    try {
      const { page, perPage } = parsePagination(c, {
        page: 1,
        perPage: 30,
      })

      const { data, total } =
        await UsersService.findAll(page, perPage)

      return paginated(c, data, total, page, perPage)
    } catch (err) {
      return serverError(c, err)
    }
  },

  async updateRole(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      const { role } = await c.req.json()

      return ok(
        c,
        await UsersService.updateRole(id, role)
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async deactivate(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      return ok(
        c,
        await UsersService.deactivate(id)
      )
    } catch (err) {
      return serverError(c, err)
    }
  },

  async adminReviews(c: Context) {
    try {
      const mediaId = c.req.query('media_id') ?? ''

      const { page, perPage } = parsePagination(c)

      const { data, total } =
        await UsersService.findReviewsByMedia(
          mediaId,
          page,
          perPage
        )

      return paginated(c, data, total, page, perPage)
    } catch (err) {
      return serverError(c, err)
    }
  },

  async moderateReview(c: Context) {
    try {
      const { id } = c.req.param()
      if (!id) return fail(c, 'ID requerido', 400)
      const { isVisible } = await c.req.json()

      return ok(
        c,
        await UsersService.moderateReview(
          id,
          isVisible as boolean
        )
      )
    } catch (err) {
      return serverError(c, err)
    }
  },
}