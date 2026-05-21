// packages/utils/src/lib/response.ts

import type { Context } from 'hono'

export interface ApiResponse<T = unknown> {
  success: boolean
  status: number
  data: T | null
  error?: string
  message?: string
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginatedResponse<T = unknown>
  extends ApiResponse<T[]> {
  pagination: PaginationMeta
}

/**
 * Success response
 */
export function ok<T>(
  c: Context,
  data: T,
  status = 200,
  message?: string
) {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      status,
      data,
      ...(message && { message }),
    },
    status as 200
  )
}

/**
 * Generic fail response
 */
export function fail(
  c: Context,
  error = 'Bad request',
  status = 400
) {
  return c.json<ApiResponse<null>>(
    {
      success: false,
      status,
      data: null,
      error,
    },
    status as 400
  )
}

/**
 * Not found response
 */
export function notFound(
  c: Context,
  entity = 'Recurso'
) {
  return fail(
    c,
    `${entity} no encontrado`,
    404
  )
}

/**
 * Internal server error response
 */
export function serverError(
  c: Context,
  err?: unknown
) {
  return c.json<ApiResponse<null>>(
    {
      success: false,
      status: 500,
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error',
    },
    500
  )
}

/**
 * Paginated response
 */
export function paginated<T>(
  c: Context,
  data: T[],
  total: number,
  page = 1,
  per_page = 20,
  status = 200
) {
  return c.json<PaginatedResponse<T>>(
    {
      success: true,
      status,
      data,
      pagination: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    },
    status as 200
  )
}