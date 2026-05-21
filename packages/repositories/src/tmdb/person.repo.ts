import { buildTmdbEndpoint, TmdbEndpoint, type ApiResponse, type PersonDetails } from '@vimovies/types'
import { httpRequest } from '@vimovies/utils'



export class PersonRepository {
    static async getPersonById(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
            method: 'GET',
            ...(process.env.TMDB_API_KEY && { token: process.env.TMDB_API_KEY }),
        })
    }

    static async getPersonById_En(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
            method: 'GET',
            ...(process.env.TMDB_API_KEY && { token: process.env.TMDB_API_KEY }),
            params: {
                language: 'en-En'
            }
        })
    }

    static async getPersonById_Es(id: number): Promise<ApiResponse<PersonDetails>>{
        return await httpRequest<PersonDetails>({
            url: buildTmdbEndpoint(TmdbEndpoint.PERSON_DETAILS, { id }),
            baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
            method: 'GET',
            ...(process.env.TMDB_API_KEY && { token: process.env.TMDB_API_KEY }),
            params: {
                language: 'es-ES'
            }
        })
    }
}