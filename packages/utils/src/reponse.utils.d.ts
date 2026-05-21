import type { Context } from 'hono';
export interface ApiResponse<T = unknown> {
    success: boolean;
    status: number;
    data: T | null;
    error?: string;
    message?: string;
}
export interface PaginationMeta {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
    pagination: PaginationMeta;
}
/**
 * Success response
 */
export declare function ok<T>(c: Context, data: T, status?: number, message?: string): Response & import("hono").TypedResponse<string | number | boolean | T extends bigint | readonly bigint[] ? never : { [K in keyof {
    success: boolean;
    status: number;
    data: T;
    error?: string;
    message?: string;
} as (ApiResponse<T>[K] extends infer T_1 ? T_1 extends ApiResponse<T>[K] ? T_1 extends import("hono/utils/types").InvalidJSONValue ? true : false : never : never) extends true ? never : K]: boolean extends (ApiResponse<T>[K] extends infer T_2 ? T_2 extends ApiResponse<T>[K] ? T_2 extends import("hono/utils/types").InvalidJSONValue ? true : false : never : never) ? import("hono/utils/types").JSONParsed<ApiResponse<T>[K], bigint | readonly bigint[]> : import("hono/utils/types").JSONParsed<ApiResponse<T>[K], bigint | readonly bigint[]>; }, import("hono/utils/http-status").ContentfulStatusCode, "json">;
/**
 * Generic fail response
 */
export declare function fail(c: Context, error?: string, status?: number): Response & import("hono").TypedResponse<{
    success: boolean;
    status: number;
    error?: string;
    message?: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
/**
 * Not found response
 */
export declare function notFound(c: Context, entity?: string): Response & import("hono").TypedResponse<{
    success: boolean;
    status: number;
    error?: string;
    message?: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
/**
 * Internal server error response
 */
export declare function serverError(c: Context, err?: unknown): Response & import("hono").TypedResponse<{
    success: boolean;
    status: number;
    error?: string;
    message?: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
/**
 * Paginated response
 */
export declare function paginated<T>(c: Context, data: T[], total: number, page?: number, per_page?: number, status?: number): Response & import("hono").TypedResponse<{
    pagination: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
    success: boolean;
    status: number;
    data: import("hono/utils/types").JSONParsed<T extends import("hono/utils/types").InvalidJSONValue ? null : T, bigint | readonly bigint[]>[];
    error?: string;
    message?: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
