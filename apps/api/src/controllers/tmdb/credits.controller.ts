import type { Context } from 'hono'
import { CreditsRepository } from '@vimovies/repositories';
import type { ApiResponse, Credits } from '@vimovies/types';

export class CreditsController {
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
    
          const movie = await CreditsRepository.getCreditsById(id) as ApiResponse<Credits>;
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
}