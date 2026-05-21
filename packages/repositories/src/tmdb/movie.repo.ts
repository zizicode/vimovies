import { httpRequest } from '@vimovies/utils'
import { env } from '@vimovies/utils'
import {
  TmdbEndpoint,
  buildTmdbEndpoint,
  type ApiResponse,
  type MovieDetails,
  type LocalizedData,
  type MovieListResponse,
} from '@vimovies/types'

// const MOVIE_APPEND = 'credits'
const MOVIE_APPEND = 'credits,videos,images,recommendations,similar,watch/providers,reviews,keywords'

export class MovieRepository {
  static async getById(
    id: number
  ): Promise<ApiResponse<LocalizedData<MovieDetails>>> {
    const [es, en] = await Promise.allSettled([
      httpRequest<MovieDetails>({
        url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_DETAILS, { id }),
        baseURL: env.TMDB_BASE_URL,
        method: 'GET',
        token: env.TMDB_API_KEY,
        params: {
          language: 'es-ES',
          append_to_response: MOVIE_APPEND,
        },
      }),

      httpRequest<MovieDetails>({
        url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_DETAILS, { id }),
        baseURL: env.TMDB_BASE_URL,
        method: 'GET',
        token: env.TMDB_API_KEY,
        params: {
          language: 'en-US',
          append_to_response: MOVIE_APPEND,
        },
      }),
    ])

    const esData =
      es.status === 'fulfilled'
        ? es.value.data
        : null

    const enData =
      en.status === 'fulfilled'
        ? en.value.data
        : null

    return {
      success: !!(esData || enData),
      status: esData || enData ? 200 : 500,
      data: {
        es: esData,
        en: enData,
      },
    }
  }

  static async getPopular(page = 1): Promise<ApiResponse<MovieListResponse>> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_POPULAR),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        language: 'es-ES',
        page,
      },
    })
  }

  static async getTrending(page = 1): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.TRENDING_MOVIE_WEEK),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        language: 'es-ES',
        page,
      },
    })
  }

  static async search(query: string, page = 1): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.SEARCH_MOVIE),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        query,
        language: 'es-ES',
        include_adult: false,
        page,
      },
    })
  }

  static async Movie_En(id: number): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_DETAILS, {id}),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        language: 'en-EN',
      },
    })
  }

  static async Movie_Es(id: number): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_DETAILS, {id}),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        language: 'es-ES',
      },
    })
  }

  static async Movie_Video(id: number): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_VIDEOS, {id}),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
    })
  }

  static async Movie_Providers(id: number): Promise<ApiResponse> {
    return await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_WATCH_PROVIDERS, {id}),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
    })
  }

}