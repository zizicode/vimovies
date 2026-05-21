import type { PlatformItem } from '../../services/api.service';

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

export interface Person {
  id: string;
  tmdb_id: number;
  slug: string;
  name: string;
  profile_path: string | null;
  tmdb_popularity: number | null;
  gender?: number | null;
  sitemap_priority?: string;
  created_at: string;
  updated_at: string;
}

export interface Credit {
  id: string;
  media_id: string;
  person_id: string;
  role: string;
  character_name: string | null;
  cast_order: number | null;
  department: string | null;
  job_title: string | null;
  person: Person;
}

export interface WatchProvider {
  id: string;
  media_id: string;
  platform_id: number;
  region_code: string;
  is_streaming: boolean;
  is_rent: boolean;
  is_buy: boolean;
  rent_price_usd: number | null;
  buy_price_usd: number | null;
  watch_url: string | null;
  affiliate_url: string | null;
  platform: PlatformItem;
}

export type VideoType = 'trailer' | 'teaser' | 'clip' | 'featurette' | 'behind_the_scenes' | 'bloopers';
export type VideoSite = 'youtube' | 'vimeo';
export type VideoLocale = 'es' | 'en';

export interface MediaVideo {
  id: string;
  media_id: string;
  locale: VideoLocale;
  video_type: VideoType;
  video_site: VideoSite;
  external_key: string;
  title: string | null;
  published_at: string | null;
  is_official: boolean;
}
