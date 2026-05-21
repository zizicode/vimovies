import type { Context } from 'hono'
import { MovieRepository } from '@vimovies/repositories'
import type { ApiResponse, MovieDetails } from '@vimovies/types'


export class MovieController {
  static async getById(c: Context) {
    try {
      const id = Number(c.req.param('id'))

      if (!id || Number.isNaN(id)) {
        return c.json(
          {
            success: false,
            error: 'Invalid movie id',
          },
          400
        )
      }

      const movie = await MovieRepository.getById(id) as ApiResponse<MovieDetails>;
      return c.json(movie, movie.success ? 200 : movie.status as 500)
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Internal server error',
        },
        500
      )
    }
  }

  static async getPopular(c: Context) {
    try {
      const page = Number(c.req.query('page') ?? 1)

      const movies = await MovieRepository.getPopular(page)
      return c.json(movies, movies.success ? 200 : movies.status as 500)
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Internal server error',
        },
        500
      )
    }
  }

  static async search(c: Context) {
    try {
      const query = c.req.query('query')

      if (!query) {
        return c.json(
          {
            success: false,
            error: 'Query parameter is required',
          },
          400
        )
      }

      const page = Number(c.req.query('page') ?? 1)

      const result = await MovieRepository.search(query, page)

      return c.json(result, result.success ? 200 : result.status as 500)
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Internal server error',
        },
        500
      )
    }
  }
}