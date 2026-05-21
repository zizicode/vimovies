import type { ApiResponse, RequestConfig } from '@vimovies/types';
export declare function httpRequest<TResponse = unknown, TBody = unknown>(config: RequestConfig<TBody>): Promise<ApiResponse<TResponse>>;
