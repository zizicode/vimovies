export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpStatusCode =
  | 200
  | 201
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503

export interface RequestConfig<TBody = unknown> {
  url: string
  method?: HttpMethod
  baseURL?: string

  params?: Record<string, unknown>
  data?: TBody

  headers?: Record<string, string>

  token?: string
  timeout?: number
}


export interface ApiResponse<T = unknown> {
  success: boolean
  status: number
  data: T | null
  error?: string
}
