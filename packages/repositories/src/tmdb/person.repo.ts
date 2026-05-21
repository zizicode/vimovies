import { buildTmdbEndpoint, TmdbEndpoint, type ApiResponse, type PersonDetails } from '@vimovies/types'
import { httpRequest } from '@vimovies/utils'
import { env } from '@vimovies/utils'


export class PersonRepository {
    static async getPersonById(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: env.TMDB_BASE_URL,
            method: 'GET',
            token: env.TMDB_API_KEY,
        })
    }

    static async getPersonById_En(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: env.TMDB_BASE_URL,
            method: 'GET',
            token: env.TMDB_API_KEY,
            params: {
                language: 'en-En'
            }
        })
    }

    static async getPersonById_Es(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: env.TMDB_BASE_URL,
            method: 'GET',
            token: env.TMDB_API_KEY,
            params: {
                language: 'es-ES'
            }
        })
    }
}