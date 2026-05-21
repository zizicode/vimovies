// ============================================================
// VIMVIES — TypeScript Types, Enums & Constants
// src/types/database.types.ts
// Mirrors the PostgreSQL schema exactly — single source of truth
// ============================================================

// ─────────────────────────────────────────────
// ENUMS (mirror DB enums)
// ─────────────────────────────────────────────

export enum ContentStatus {
    Draft      = 'draft',
    Published  = 'published',
    Archived   = 'archived',
    Scheduled  = 'scheduled',
  }
  
  export enum SupportedLocale {
    ES = 'es',
    EN = 'en',
  }
  
  export enum MediaType {
    Movie        = 'movie',
    Series       = 'series',
    Documentary  = 'documentary',
    Short        = 'short',
    Special      = 'special',
  }
  
  export enum VideoType {
    Trailer           = 'trailer',
    Teaser            = 'teaser',
    Clip              = 'clip',
    Featurette        = 'featurette',
    BehindTheScenes   = 'behind_the_scenes',
    Bloopers          = 'bloopers',
  }
  
  export enum VideoSite {
    YouTube = 'youtube',
    Vimeo   = 'vimeo',
  }
  
  export enum PersonRole {
    Actor            = 'actor',
    Director         = 'director',
    Writer           = 'writer',
    Producer         = 'producer',
    Composer         = 'composer',
    Cinematographer  = 'cinematographer',
  }
  
  export enum UserRole {
    Admin  = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
  }
  
  export enum ArticleIntent {
    Informational = 'informational',
    Navigational  = 'navigational',
    Transactional = 'transactional',
    Seasonal      = 'seasonal',
  }
  
  export enum PlatformType {
    SVOD      = 'svod',
    TVOD      = 'tvod',
    AVOD      = 'avod',
    Cable     = 'cable',
    Broadcast = 'broadcast',
  }
  
  export enum RatingSource {
    TMDB       = 'tmdb',
    IMDB       = 'imdb',
    RTCritics  = 'rt_critics',
    RTAudience = 'rt_audience',
    Vimovies  = 'vimovies',
  }
  
  export enum ListVisibility {
    Public   = 'public',
    Private  = 'private',
    Unlisted = 'unlisted',
  }
  
  export enum SitemapPriority {
    Critical = 'critical',  // 1.0
    High     = 'high',      // 0.9
    Medium   = 'medium',    // 0.7-0.8
    Low      = 'low',       // 0.5
    Minimal  = 'minimal',   // 0.3
  }
  
  // ─────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────
  
  export const SITE_NAME = 'Vimovies' as const;
  export const SITE_URL  = 'https://www.vimovies.com' as const;
  export const SUPPORTED_LOCALES = [SupportedLocale.ES, SupportedLocale.EN] as const;
  export const DEFAULT_LOCALE    = SupportedLocale.ES as const;
  
  /** Numeric values for sitemap <priority> tag */
  export const SITEMAP_PRIORITY_VALUES: Record<SitemapPriority, number> = {
    [SitemapPriority.Critical]: 1.0,
    [SitemapPriority.High]:     0.9,
    [SitemapPriority.Medium]:   0.7,
    [SitemapPriority.Low]:      0.5,
    [SitemapPriority.Minimal]:  0.3,
  } as const;
  
  /** TMDB genre IDs — synced with DB seed */
  export const TMDB_GENRE_IDS: Record<string, number> = {
    accion:           28,
    aventura:         12,
    animacion:        16,
    comedia:          35,
    crimen:           80,
    documental:       99,
    drama:            18,
    familia:          10751,
    fantasia:         14,
    historia:         36,
    terror:           27,
    musica:           10402,
    misterio:         9648,
    romance:          10749,
    'ciencia-ficcion':878,
    television:       10770,
    thriller:         53,
    guerra:           10752,
    western:          37,
  } as const;
  
  /** TMDB provider IDs — synced with DB seed */
  export const TMDB_PROVIDER_IDS: Record<string, number> = {
    netflix:       8,
    'prime-video': 119,
    'disney-plus': 337,
    'hbo-max':     384,
    'apple-tv':    350,
    paramount:     531,
    'star-plus':   619,
    mubi:          11,
    crunchyroll:   283,
    'pluto-tv':    300,
  } as const;
  
  /** Default regions for watch provider lookups */
  export const SUPPORTED_REGIONS = ['ES', 'MX', 'AR', 'CO', 'US'] as const;
  export type SupportedRegion = typeof SUPPORTED_REGIONS[number];
  export const DEFAULT_REGION: SupportedRegion = 'ES';
  
  /** SEO character limits (matching SEO_ESTRATEGIA.md) */
  export const SEO_LIMITS = {
    TITLE_MAX:       60,
    DESCRIPTION_MAX: 160,
    SLUG_MAX:        80,
    OG_IMAGE_WIDTH:  1200,
    OG_IMAGE_HEIGHT: 630,
  } as const;
  
  /** Content minimums for editorial quality gate */
  export const CONTENT_MINIMUMS = {
    ARTICLE_WORDS_MIN:    800,
    ARTICLE_WORDS_TARGET: 1200,
    SYNOPSIS_WORDS_MIN:   100,
    REVIEW_WORDS_MIN:     200,
    FAQ_QUESTIONS_MIN:    3,
    INTERNAL_LINKS_MIN:   5,
    IMAGES_MIN:           5,
  } as const;
  
  /** TMDB popularity threshold for pre-rendering */
  export const PRERENDER_THRESHOLDS = {
    MOVIES_TOP_N:  1000,
    SERIES_TOP_N:  500,
    ACTORS_TOP_N:  500,
    MIN_POPULARITY: 10,
  } as const;
  
  // ─────────────────────────────────────────────
  // MODULE 1 — CATALOG TYPES
  // ─────────────────────────────────────────────
  
  export interface Genre {
    id:               number;
    tmdb_id:          number;
    slug:             string;
    name_es:          string;
    name_en:          string;
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    description_es?:  string | null;
    description_en?:  string | null;
    cover_image_url?: string | null;
    sitemap_priority: SitemapPriority;
    created_at:       string;
    updated_at:       string;
  }
  
  export interface Media {
    id:               string;   // UUID
    tmdb_id:          number;
    imdb_id?:         string | null;
    media_type:       MediaType;
    slug:             string;
  
    original_title:     string;
    original_language:  string;
    release_date?:      string | null;  // ISO date
    runtime_minutes?:   number | null;
    tmdb_popularity?:   number | null;
  
    title_es?:    string | null;
    title_en?:    string | null;
  
    synopsis_es?:  string | null;
    synopsis_en?:  string | null;
  
    editorial_review_es?:   string | null;
    editorial_review_en?:   string | null;
    editorial_rating?:      number | null;
    editorial_verdict_es?:  string | null;
    editorial_verdict_en?:  string | null;
  
    poster_path?:   string | null;
    backdrop_path?: string | null;
    logo_path?:     string | null;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    og_image_url?:        string | null;
  
    status:            ContentStatus;
    is_prerendered:    boolean;
    sitemap_priority:  SitemapPriority;
    noindex:           boolean;
  
    tmdb_last_synced_at?: string | null;
    created_at:  string;
    updated_at:  string;
  }
  
  /** Media with all relations loaded */
  export interface MediaDetail extends Media {
    genres:         Genre[];
    credits:        MediaCredit[];
    videos:         MediaVideo[];
    ratings:        MediaRating[];
    watch_providers: MediaWatchProvider[];
    faqs:           ArticleFAQ[];
    similar?:       Media[];
  }
  
  export interface Person {
    id:       string;  // UUID
    tmdb_id:  number;
    slug:     string;
  
    name:            string;
    also_known_as?:  string[] | null;
    birthdate?:      string | null;
    deathdate?:      string | null;
    birthplace?:     string | null;
    biography_es?:   string | null;
    biography_en?:   string | null;
    gender?:         0 | 1 | 2 | 3 | null;
  
    profile_path?:   string | null;
    homepage_url?:   string | null;
    imdb_id?:        string | null;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
  
    tmdb_popularity?:   number | null;
    sitemap_priority:   SitemapPriority;
  
    tmdb_last_synced_at?: string | null;
    created_at:  string;
    updated_at:  string;
  }
  
  export interface MediaCredit {
    id:         string;
    media_id:   string;
    person_id:  string;
    role:       PersonRole;
  
    character_name?: string | null;
    cast_order?:     number | null;
  
    department?: string | null;
    job_title?:  string | null;
  
    // Joined
    person?: Person;
  }
  
  export interface MediaVideo {
    id:       string;
    media_id: string;
    locale:   SupportedLocale;
  
    video_type:   VideoType;
    video_site:   VideoSite;
    external_key: string;
    title?:       string | null;
    published_at?: string | null;
    is_official:  boolean;
  }
  
  export interface MediaRating {
    media_id:    string;
    source:      RatingSource;
    score:       number;
    vote_count?: number | null;
    raw_score?:  string | null;
    fetched_at:  string;
  }
  
  // ─────────────────────────────────────────────
  // MODULE 2 — PLATFORMS
  // ─────────────────────────────────────────────
  
  export interface Platform {
    id:     number;
    slug:   string;
  
    name_es:       string;
    name_en:       string;
    description_es?: string | null;
    description_en?: string | null;
  
    logo_url?:      string | null;
    website_url?:   string | null;
    platform_type:  PlatformType;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    sitemap_priority:     SitemapPriority;
  
    affiliate_url_es?:  string | null;
    affiliate_url_en?:  string | null;
    affiliate_id?:      string | null;
  
    tmdb_provider_id?: number | null;
    is_active:         boolean;
    display_order:     number;
  
    created_at:  string;
    updated_at:  string;
  }
  
  export interface MediaWatchProvider {
    id:          string;
    media_id:    string;
    platform_id: number;
    region_code: string;
  
    is_streaming: boolean;
    is_rent:      boolean;
    is_buy:       boolean;
  
    rent_price_usd?: number | null;
    buy_price_usd?:  number | null;
  
    watch_url?:     string | null;
    affiliate_url?: string | null;
  
    tmdb_synced_at?: string | null;
    verified_at?:    string | null;
  
    // Joined
    platform?: Platform;
  }
  
  // ─────────────────────────────────────────────
  // MODULE 3 — EDITORIAL
  // ─────────────────────────────────────────────
  
  export interface Author {
    id:   string;
    slug: string;
  
    display_name:    string;
    email:           string;
    bio_es?:         string | null;
    bio_en?:         string | null;
    avatar_url?:     string | null;
    twitter_handle?: string | null;
    website_url?:    string | null;
  
    expertise_es?: string | null;
    expertise_en?: string | null;
  
    is_active:  boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface ArticleCategory {
    id:   number;
    slug: string;
  
    name_es:         string;
    name_en:         string;
    description_es?: string | null;
    description_en?: string | null;
  
    genre_id?:            number | null;
    parent_category_id?:  number | null;
    display_order:        number;
  }
  
  export interface Article {
    id:          string;
    slug:        string;
    author_id:   string;
    category_id: number;
  
    title_es:    string;
    title_en?:   string | null;
  
    excerpt_es:  string;
    excerpt_en?: string | null;
  
    content_es:  string;
    content_en?: string | null;
  
    cover_image_url?:     string | null;
    cover_image_alt_es?:  string | null;
    cover_image_alt_en?:  string | null;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    og_image_url?:        string | null;
    canonical_url_es?:    string | null;
    canonical_url_en?:    string | null;
  
    intent:              ArticleIntent;
    primary_keyword_es?: string | null;
    primary_keyword_en?: string | null;
    secondary_keywords?: string[] | null;
  
    status:         ContentStatus;
    locale:         SupportedLocale;
    has_en_version: boolean;
    published_at?:  string | null;
    scheduled_at?:  string | null;
  
    word_count_es?:         number | null;
    word_count_en?:         number | null;
    reading_time_minutes?:  number | null;
  
    sitemap_priority: SitemapPriority;
    noindex:          boolean;
  
    created_at: string;
    updated_at: string;
  }
  
  /** Article with all relations */
  export interface ArticleDetail extends Article {
    author:         Author;
    category:       ArticleCategory;
    faqs:           ArticleFAQ[];
    media_mentions: ArticleMediaMention[];
    tags:           Tag[];
  }
  
  export interface ArticleMediaMention {
    article_id:   string;
    media_id:     string;
    mention_type: 'primary' | 'supporting' | 'mentioned';
    display_order: number;
    media?: Media;
  }
  
  export interface ArticleFAQ {
    id:           string;
    article_id?:  string | null;
    media_id?:    string | null;
  
    question_es:  string;
    question_en?: string | null;
    answer_es:    string;
    answer_en?:   string | null;
    display_order: number;
  }
  
  export interface Tag {
    id:      number;
    slug:    string;
    name_es: string;
    name_en: string;
  }
  
  // ─────────────────────────────────────────────
  // MODULE 4 — USERS & UGC
  // ─────────────────────────────────────────────
  
  export interface User {
    id:           string;
    email:        string;
    username?:    string | null;
    display_name?: string | null;
    avatar_url?:  string | null;
    role:         UserRole;
    locale_pref:  SupportedLocale;
    region_code?: string | null;
  
    email_verified_at?: string | null;
    last_sign_in_at?:   string | null;
    is_active:          boolean;
  
    created_at: string;
    updated_at: string;
  }
  
  export interface UserReview {
    id:         string;
    user_id:    string;
    media_id:   string;
    rating:     number;   // 1–10
    body?:      string | null;
    locale:     SupportedLocale;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
  }
  
  export interface UserWatchlist {
    id:          string;
    user_id:     string;
    name_es:     string;
    name_en?:    string | null;
    description?: string | null;
    visibility:  ListVisibility;
    is_default:  boolean;
    created_at:  string;
    updated_at:  string;
    items?: UserWatchlistItem[];
  }
  
  export interface UserWatchlistItem {
    watchlist_id: string;
    media_id:     string;
    added_at:     string;
    watched:      boolean;
    watched_at?:  string | null;
    media?: Media;
  }
  
  // ─────────────────────────────────────────────
  // MODULE 5 — SEO INFRASTRUCTURE
  // ─────────────────────────────────────────────
  
  export interface Redirect {
    id:          number;
    from_path:   string;
    to_path:     string;
    status_code: 301 | 302;
    reason?:     string | null;
    is_active:   boolean;
    created_at:  string;
  }
  
  export interface SitemapIndex {
    id:       number;
    section:  string;
    filename: string;
    url_count: number;
    priority: SitemapPriority;
    last_generated_at?: string | null;
    last_submitted_at?: string | null;
  }
  
  export interface SeoAuditLog {
    id:          number;
    entity_type: 'media' | 'article' | 'genre' | 'platform' | 'person';
    entity_id:   string;
    locale:      SupportedLocale;
    checked_at:  string;
  
    has_title:       boolean;
    has_description: boolean;
    has_h1:          boolean;
    has_canonical:   boolean;
    has_og_image:    boolean;
    has_schema:      boolean;
    has_faq:         boolean;
    internal_link_count?: number | null;
  
    lcp_score?:          number | null;
    cls_score?:          number | null;
    pagespeed_mobile?:   number | null;
    pagespeed_desktop?:  number | null;
  
    notes?: string | null;
  }
  
  // ─────────────────────────────────────────────
  // MODULE 6 — CURATED LISTS
  // ─────────────────────────────────────────────
  
  export type CuratedListType = 'ranking' | 'collection' | 'seasonal' | 'thematic';
  
  export interface CuratedList {
    id:   string;
    slug: string;
  
    title_es:       string;
    title_en?:      string | null;
    description_es?: string | null;
    description_en?: string | null;
  
    seo_title_es?:        string | null;
    seo_title_en?:        string | null;
    seo_description_es?:  string | null;
    seo_description_en?:  string | null;
    cover_image_url?:     string | null;
  
    list_type:       CuratedListType;
    is_auto_updated: boolean;
    status:          ContentStatus;
  
    author_id?: string | null;
    genre_id?:  number | null;
  
    sitemap_priority: SitemapPriority;
    published_at?:    string | null;
    created_at:       string;
    updated_at:       string;
  
    items?: CuratedListItem[];
  }
  
  export interface CuratedListItem {
    list_id:       string;
    media_id:      string;
    rank_position: number;
    note_es?:      string | null;
    note_en?:      string | null;
    media?: Media;
  }
  
  // ─────────────────────────────────────────────
  // UTILITY TYPES
  // ─────────────────────────────────────────────
  
  /** Picks the correct locale field at runtime */
  export type LocalizedField<T, F extends string> =
    F extends string
      ? T extends Record<`${F}_es`, infer V> & Record<`${F}_en`, infer V>
        ? V
        : never
      : never;
  
  /** Helper to get localized string field */
  export function getLocalized<T extends Record<string, unknown>>(
    obj: T,
    field: string,
    locale: SupportedLocale = DEFAULT_LOCALE
  ): string | null | undefined {
    const key = `${field}_${locale}` as keyof T;
    const fallback = `${field}_${DEFAULT_LOCALE}` as keyof T;
    return (obj[key] ?? obj[fallback]) as string | null | undefined;
  }
  
  /** TMDB image URL builder */
  export function tmdbImageUrl(
    path: string | null | undefined,
    size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
  ): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
  
  /** Supabase Database type (generated — matches schema) */
  export type Database = {
    public: {
      Tables: {
        genres:                 { Row: Genre; Insert: Omit<Genre, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Genre>; };
        media:                  { Row: Media; Insert: Omit<Media, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Media>; };
        media_genres:           { Row: { media_id: string; genre_id: number }; Insert: { media_id: string; genre_id: number }; Update: never; };
        people:                 { Row: Person; Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Person>; };
        media_credits:          { Row: MediaCredit; Insert: Omit<MediaCredit, 'id'>; Update: Partial<MediaCredit>; };
        media_videos:           { Row: MediaVideo; Insert: Omit<MediaVideo, 'id'>; Update: Partial<MediaVideo>; };
        media_ratings:          { Row: MediaRating; Insert: MediaRating; Update: Partial<MediaRating>; };
        platforms:              { Row: Platform; Insert: Omit<Platform, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Platform>; };
        media_watch_providers:  { Row: MediaWatchProvider; Insert: Omit<MediaWatchProvider, 'id'>; Update: Partial<MediaWatchProvider>; };
        authors:                { Row: Author; Insert: Omit<Author, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Author>; };
        article_categories:     { Row: ArticleCategory; Insert: Omit<ArticleCategory, 'id'>; Update: Partial<ArticleCategory>; };
        articles:               { Row: Article; Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Article>; };
        article_media_mentions: { Row: ArticleMediaMention; Insert: ArticleMediaMention; Update: Partial<ArticleMediaMention>; };
        article_faqs:           { Row: ArticleFAQ; Insert: Omit<ArticleFAQ, 'id'>; Update: Partial<ArticleFAQ>; };
        tags:                   { Row: Tag; Insert: Omit<Tag, 'id'>; Update: Partial<Tag>; };
        users:                  { Row: User; Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>; Update: Partial<User>; };
        user_reviews:           { Row: UserReview; Insert: Omit<UserReview, 'id' | 'created_at' | 'updated_at'>; Update: Partial<UserReview>; };
        user_watchlists:        { Row: UserWatchlist; Insert: Omit<UserWatchlist, 'id' | 'created_at' | 'updated_at'>; Update: Partial<UserWatchlist>; };
        user_watchlist_items:   { Row: UserWatchlistItem; Insert: UserWatchlistItem; Update: Partial<UserWatchlistItem>; };
        redirects:              { Row: Redirect; Insert: Omit<Redirect, 'id' | 'created_at'>; Update: Partial<Redirect>; };
        sitemap_index:          { Row: SitemapIndex; Insert: Omit<SitemapIndex, 'id'>; Update: Partial<SitemapIndex>; };
        seo_audit_log:          { Row: SeoAuditLog; Insert: Omit<SeoAuditLog, 'id'>; Update: never; };
        curated_lists:          { Row: CuratedList; Insert: Omit<CuratedList, 'id' | 'created_at' | 'updated_at'>; Update: Partial<CuratedList>; };
        curated_list_items:     { Row: CuratedListItem; Insert: CuratedListItem; Update: Partial<CuratedListItem>; };
      };
      Enums: {
        content_status:   ContentStatus;
        supported_locale: SupportedLocale;
        media_type:       MediaType;
        video_type:       VideoType;
        video_site:       VideoSite;
        person_role:      PersonRole;
        user_role:        UserRole;
        article_intent:   ArticleIntent;
        platform_type:    PlatformType;
        rating_source:    RatingSource;
        list_visibility:  ListVisibility;
        sitemap_priority: SitemapPriority;
      };
    };
  };