import { buildTmdbEndpoint, TmdbEndpoint } from '@vimovies/types'
import { httpRequest } from '@vimovies/utils'



export class CreditsRepository {
    static async getCreditsById(id: number): Promise<any>{
        return await httpRequest<any>({
            url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_CREDITS, { id }),
            baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
            method: 'GET',
            token: process.env.TMDB_API_KEY,
        })
    }
}