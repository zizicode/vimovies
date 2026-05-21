import { httpRequest } from '@vimovies/utils';
import type { ApiResponse, RequestConfig } from '@vimovies/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  password: string;
}

export const authService = {
  async login(password: string): Promise<ApiResponse<string>> {
    return httpRequest<string, LoginRequest>({
      url: `${API_URL}/api/auth/admin/login`,
      method: 'POST',
      data: { password },
    });
  },

  async verifyToken(token: string): Promise<ApiResponse<{ valid: boolean; user: { id: string; role: string } }>> {
    return httpRequest({
      url: `${API_URL}/api/auth/verify`,
      method: 'GET',
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: unknown;
}

export interface MediaItem {
  id: string;
  tmdb_id: number;
  imdb_id?: string;
  slug: string;
  original_title: string;
  original_language?: string;
  title_es: string | null;
  title_en: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string | null;
  release_date: string | null;
  status: string;
  tmdb_popularity: number | null;
  created_at: string;
  updated_at: string;
  editorial_rating?: number | null;
  editorial_verdict_es?: string | null;
  editorial_verdict_en?: string | null;
  editorial_review_es?: string | null;
  editorial_review_en?: string | null;
  runtime_minutes?: number | null;
  synopsis_es?: string | null;
  synopsis_en?: string | null;
  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  media_type?: string;
  is_prerendered?: boolean;
  noindex?: boolean;
  sitemap_priority?: string;
  og_image_url?: string | null;
  canonical_url_es?: string | null;
  canonical_url_en?: string | null;
  tmdb_last_synced_at?: string;
  genre_ids?: number[];
}

export const mediaService = {
  async list(params?: MediaListParams, token?: string): Promise<ApiResponse<MediaItem[]>> {
    return httpRequest<MediaItem[]>({
      url: `${API_URL}/api/media/admin`,
      method: 'GET',
      params,
      token,
    });
  },

  async getById(id: string, token?: string): Promise<ApiResponse<MediaItem>> {
    return httpRequest<MediaItem>({
      url: `${API_URL}/api/media/admin/${id}`,
      method: 'GET',
      token,
    });
  },

  async updateEditorial(id: string, data: any, token: string): Promise<ApiResponse<MediaItem>> {
    return httpRequest<MediaItem, any>({
      url: `${API_URL}/api/media/admin/${id}`,
      method: 'PATCH',
      data,
      token,
    });
  },

  async patch(id: string, data: any, token: string): Promise<ApiResponse<MediaItem>> {
    return httpRequest<MediaItem, any>({
      url: `${API_URL}/api/media/admin/${id}/patch`,
      method: 'PATCH',
      data,
      token,
    });
  },

  async remove(id: string, token: string): Promise<ApiResponse<void>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}`,
      method: 'DELETE',
      token,
    });
  },

  async getCredits(id: string, token: string): Promise<ApiResponse<any[]>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/credits`,
      method: 'GET',
      token,
    });
  },

  async addCredit(id: string, credit: any, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/credits`,
      method: 'POST',
      data: credit,
      token,
    });
  },

  async removeCredit(mediaId: string, creditId: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/credits/${creditId}`,
      method: 'DELETE',
      token,
    });
  },

  async updateCreditOrder(mediaId: string, creditId: string, castOrder: number, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/credits/${creditId}/order`,
      method: 'PATCH',
      data: { cast_order: castOrder },
      token,
    });
  },

  async getWatchProviders(id: string, region?: string, token?: string): Promise<ApiResponse<any[]>> {
    const params = region ? { region } : {};
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/providers`,
      method: 'GET',
      params,
      token,
    });
  },

  async addWatchProvider(id: string, provider: any, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/providers`,
      method: 'POST',
      data: provider,
      token,
    });
  },

  async removeWatchProvider(mediaId: string, providerId: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/providers/${providerId}`,
      method: 'DELETE',
      token,
    });
  },

  async updateWatchProvider(mediaId: string, providerId: string, updates: any, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/providers/${providerId}`,
      method: 'PATCH',
      data: updates,
      token,
    });
  },

  async getVideos(id: string, token?: string): Promise<ApiResponse<any[]>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/videos/list`,
      method: 'GET',
      token,
    });
  },

  async addVideo(id: string, video: any, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${id}/videos/single`,
      method: 'POST',
      data: video,
      token,
    });
  },

  async removeVideo(mediaId: string, videoId: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/videos/${videoId}`,
      method: 'DELETE',
      token,
    });
  },

  async updateVideo(mediaId: string, videoId: string, updates: any, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest({
      url: `${API_URL}/api/media/admin/${mediaId}/videos/${videoId}`,
      method: 'PATCH',
      data: updates,
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: string;
  [key: string]: unknown;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title_es: string;
  title_en: string | null;
  excerpt_es: string;
  excerpt_en: string | null;
  content_es: string | null;
  content_en: string | null;
  status: string;
  intent: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  seo_title_es: string | null;
  seo_title_en: string | null;
  seo_description_es: string | null;
  seo_description_en: string | null;
  og_image_url: string | null;
  canonical_url_es: string | null;
  canonical_url_en: string | null;
  primary_keyword_es: string | null;
  primary_keyword_en: string | null;
  secondary_keywords: string[] | null;
  author_id: string | null;
  category_id: number | null;
  cover_image_url: string | null;
  cover_image_alt_es: string | null;
  cover_image_alt_en: string | null;
  locale: string;
  has_en_version: boolean;
  word_count_es: number | null;
  word_count_en: number | null;
  reading_time_minutes: number | null;
  sitemap_priority: string;
  noindex: boolean;
  author?: {
    display_name: string;
    avatar_url: string | null;
    slug: string;
    expertise_es: string | null;
    expertise_en: string | null;
  };
  category?: {
    slug: string;
    name_es: string;
    name_en: string;
    description_es: string | null;
    description_en: string | null;
  };
  tags?: Array<{
    id: number;
    slug: string;
    name_es: string;
    name_en: string;
  }>;
  faqs?: Array<{
    id: string;
    question_es: string;
    question_en: string | null;
    answer_es: string;
    answer_en: string | null;
    display_order: number;
  }>;
  media_mentions?: Array<{
    media_id: string;
    mention_type: 'primary' | 'supporting' | 'mentioned';
    display_order: number;
    media?: {
      id: string;
      slug: string;
      title_es: string;
      title_en: string | null;
      poster_path: string | null;
    };
  }>;
}

export const articlesService = {
  async list(params?: ArticleListParams, token?: string): Promise<ApiResponse<ArticleItem[]>> {
    return httpRequest<ArticleItem[]>({
      url: `${API_URL}/api/articles/admin`,
      method: 'GET',
      params,
      token,
    });
  },

  async getById(id: string, token?: string): Promise<ApiResponse<ArticleItem>> {
    return httpRequest<ArticleItem>({
      url: `${API_URL}/api/articles/admin/${id}`,
      method: 'GET',
      token,
    });
  },

  async create(data: any, token: string): Promise<ApiResponse<ArticleItem>> {
    return httpRequest<ArticleItem, any>({
      url: `${API_URL}/api/articles/admin`,
      method: 'POST',
      data,
      token,
    });
  },

  async update(id: string, data: any, token: string): Promise<ApiResponse<ArticleItem>> {
    return httpRequest<ArticleItem, any>({
      url: `${API_URL}/api/articles/admin/${id}`,
      method: 'PATCH',
      data,
      token,
    });
  },

  async publish(id: string, token: string): Promise<ApiResponse<ArticleItem>> {
    return httpRequest<ArticleItem>({
      url: `${API_URL}/api/articles/admin/${id}/publish`,
      method: 'POST',
      token,
    });
  },

  async archive(id: string, token: string): Promise<ApiResponse<ArticleItem>> {
    return httpRequest<ArticleItem>({
      url: `${API_URL}/api/articles/admin/${id}/archive`,
      method: 'POST',
      token,
    });
  },

  async remove(id: string, token: string): Promise<ApiResponse<void>> {
    return httpRequest({
      url: `${API_URL}/api/articles/admin/${id}`,
      method: 'DELETE',
      token,
    });
  },

  async getAllTags(token?: string): Promise<ApiResponse<Array<{ id: number; slug: string; name_es: string; name_en: string }>>> {
    return httpRequest({
      url: `${API_URL}/api/articles/admin/tags`,
      method: 'GET',
      token,
    });
  },

  async seedTags(token: string): Promise<ApiResponse<{ message: string; count: number }>> {
    return httpRequest({
      url: `${API_URL}/api/articles/admin/tags/seed`,
      method: 'POST',
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PEOPLE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const peopleService = {
  async list(page = 1, perPage = 20, search?: string, token?: string): Promise<ApiResponse<{ data: any[]; total: number }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search) params.append('search', search);
    
    return httpRequest({
      url: `${API_URL}/api/people/admin?${params.toString()}`,
      method: 'GET',
      token,
    });
  },

  async getById(id: string, token?: string): Promise<ApiResponse<any>> {
    return httpRequest({
      url: `${API_URL}/api/people/admin/${id}`,
      method: 'GET',
      token,
    });
  },

  async update(id: string, data: any, token: string): Promise<ApiResponse<any>> {
    return httpRequest({
      url: `${API_URL}/api/people/admin/${id}`,
      method: 'PATCH',
      token,
      data: data,
    });
  },

  async remove(id: string, token: string): Promise<ApiResponse<void>> {
    return httpRequest({
      url: `${API_URL}/api/people/admin/${id}`,
      method: 'DELETE',
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GENRES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface GenreItem {
  id: number;
  tmdb_id: number;
  slug: string;
  name_es: string;
  name_en: string;
  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  description_es?: string | null;
  description_en?: string | null;
  cover_image_url?: string | null;
  sitemap_priority: string;
  created_at: string;
  updated_at: string;
}

export const genresService = {
  async list(token?: string): Promise<ApiResponse<GenreItem[]>> {
    return httpRequest<GenreItem[]>({
      url: `${API_URL}/api/genres`,
      method: 'GET',
      token,
    });
  },

  async getById(id: number, token?: string): Promise<ApiResponse<GenreItem>> {
    return httpRequest<GenreItem>({
      url: `${API_URL}/api/genres/${id}`,
      method: 'GET',
      token,
    });
  },

  async create(genre: Partial<GenreItem>, token?: string): Promise<ApiResponse<GenreItem>> {
    return httpRequest<GenreItem>({
      url: `${API_URL}/api/genres/admin`,
      method: 'POST',
      data: genre,
      token,
    });
  },

  async update(id: number, genre: Partial<GenreItem>, token?: string): Promise<ApiResponse<GenreItem>> {
    return httpRequest<GenreItem>({
      url: `${API_URL}/api/genres/admin/${id}`,
      method: 'PATCH',
      data: genre,
      token,
    });
  },

  async remove(id: number, token?: string): Promise<ApiResponse<void>> {
    return httpRequest<void>({
      url: `${API_URL}/api/genres/admin/${id}`,
      method: 'DELETE',
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORMS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformItem {
  id: number;
  slug: string;
  name_es: string;
  name_en: string;
  description_es?: string | null;
  description_en?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  platform_type: string;
  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  sitemap_priority: string;
  affiliate_url_es?: string | null;
  affiliate_url_en?: string | null;
  affiliate_id?: string | null;
  tmdb_provider_id?: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const platformsService = {
  async list(token?: string): Promise<ApiResponse<PlatformItem[]>> {
    return httpRequest<PlatformItem[]>({
      url: `${API_URL}/api/platforms`,
      method: 'GET',
      token,
    });
  },

  async adminList(token?: string): Promise<ApiResponse<PlatformItem[]>> {
    return httpRequest<PlatformItem[]>({
      url: `${API_URL}/api/platforms/admin`,
      method: 'GET',
      token,
    });
  },

  async create(platform: Partial<PlatformItem>, token?: string): Promise<ApiResponse<PlatformItem>> {
    return httpRequest<PlatformItem>({
      url: `${API_URL}/api/platforms/admin`,
      method: 'POST',
      data: platform,
      token,
    });
  },

  async update(id: number, platform: Partial<PlatformItem>, token?: string): Promise<ApiResponse<PlatformItem>> {
    return httpRequest<PlatformItem>({
      url: `${API_URL}/api/platforms/admin/${id}`,
      method: 'PATCH',
      data: platform,
      token,
    });
  },

  async remove(id: number, token?: string): Promise<ApiResponse<void>> {
    return httpRequest<void>({
      url: `${API_URL}/api/platforms/admin/${id}`,
      method: 'DELETE',
      token,
    });
  },

  async updateAffiliate(id: number, affiliateData: any, token?: string): Promise<ApiResponse<any>> {
    return httpRequest({
      url: `${API_URL}/api/platforms/admin/providers/${id}/affiliate`,
      method: 'PATCH',
      data: affiliateData,
      token,
    });
  },

  async syncProviders(mediaId: string, token?: string): Promise<ApiResponse<any>> {
    return httpRequest({
      url: `${API_URL}/api/platforms/admin/media/${mediaId}/providers/sync`,
      method: 'POST',
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface SeoAuditLogItem {
  id: number;
  entity_type: 'media' | 'article' | 'genre' | 'platform' | 'person';
  entity_id: string;
  locale: 'ES' | 'EN';
  checked_at: string;
  has_title: boolean;
  has_description: boolean;
  has_h1: boolean;
  has_canonical: boolean;
  has_og_image: boolean;
  has_schema: boolean;
  has_faq: boolean;
  internal_link_count?: number | null;
  lcp_score?: number | null;
  cls_score?: number | null;
  pagespeed_mobile?: number | null;
  pagespeed_desktop?: number | null;
  notes?: string | null;
}

export interface RedirectItem {
  id: number;
  from_path: string;
  to_path: string;
  status_code: 301 | 302;
  reason?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SitemapIndexItem {
  id: number;
  section: string;
  filename: string;
  url_count: number;
  priority: 'high' | 'medium' | 'low' | 'minimal';
  last_generated_at?: string | null;
  last_submitted_at?: string | null;
}

export const seoService = {
  // Audit Logs
  async listAuditLogs(params?: { entity_type?: string; locale?: string }, token?: string): Promise<ApiResponse<SeoAuditLogItem[]>> {
    return httpRequest<SeoAuditLogItem[]>({
      url: `${API_URL}/api/seo/audit-logs`,
      method: 'GET',
      params,
      token,
    });
  },

  async runAudit(entityType: string, entityId: string, locale: string, token?: string): Promise<ApiResponse<SeoAuditLogItem>> {
    return httpRequest<SeoAuditLogItem>({
      url: `${API_URL}/api/seo/audit`,
      method: 'POST',
      data: { entity_type: entityType, entity_id: entityId, locale },
      token,
    });
  },

  // Redirects
  async listRedirects(token?: string): Promise<ApiResponse<RedirectItem[]>> {
    return httpRequest<RedirectItem[]>({
      url: `${API_URL}/api/seo/redirects`,
      method: 'GET',
      token,
    });
  },

  async createRedirect(redirect: Omit<RedirectItem, 'id' | 'created_at'>, token?: string): Promise<ApiResponse<RedirectItem>> {
    return httpRequest<RedirectItem>({
      url: `${API_URL}/api/seo/redirects`,
      method: 'POST',
      data: redirect,
      token,
    });
  },

  async updateRedirect(id: number, redirect: Partial<RedirectItem>, token?: string): Promise<ApiResponse<RedirectItem>> {
    return httpRequest<RedirectItem>({
      url: `${API_URL}/api/seo/redirects/${id}`,
      method: 'PATCH',
      data: redirect,
      token,
    });
  },

  async deleteRedirect(id: number, token?: string): Promise<ApiResponse<void>> {
    return httpRequest<void>({
      url: `${API_URL}/api/seo/redirects/${id}`,
      method: 'DELETE',
      token,
    });
  },

  // Sitemaps
  async listSitemaps(token?: string): Promise<ApiResponse<SitemapIndexItem[]>> {
    return httpRequest<SitemapIndexItem[]>({
      url: `${API_URL}/api/seo/sitemaps`,
      method: 'GET',
      token,
    });
  },

  async generateSitemap(section: string, token?: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest<{ message: string }>({
      url: `${API_URL}/api/seo/sitemaps/generate`,
      method: 'POST',
      data: { section },
      token,
    });
  },

  async submitSitemapToGoogle(section: string, token?: string): Promise<ApiResponse<{ message: string }>> {
    return httpRequest<{ message: string }>({
      url: `${API_URL}/api/seo/sitemaps/submit`,
      method: 'POST',
      data: { section },
      token,
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrapper para hacer requests con el token del store automáticamente
 */
export async function apiRequest<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>
): Promise<ApiResponse<TResponse>> {
  // Si no se proporciona baseURL, usar la de la API
  const finalConfig = {
    ...config,
    baseURL: config.baseURL || API_URL,
  };

  return httpRequest<TResponse, TBody>(finalConfig);
}
