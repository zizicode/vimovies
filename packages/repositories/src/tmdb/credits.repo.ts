import { buildTmdbEndpoint, TmdbEndpoint } from '@vimovies/types'
import { httpRequest } from '@vimovies/utils'
import { env } from '@vimovies/utils/src/env'


export class CreditsRepository {
    static async getCreditsById(id: number): Promise<any>{
        return await httpRequest<any>({
            url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_CREDITS, { id }),
            baseURL: env.TMDB_BASE_URL,
            method: 'GET',
            token: env.TMDB_API_KEY,
        })
    }
}