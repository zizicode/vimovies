-- ============================================================
-- CINEPULSE — PostgreSQL DDL (Supabase compatible)
-- Run in order: ENUMs → Tables → Indexes → Functions → Triggers
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search on titles

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE content_status AS ENUM (
  'draft',
  'published',
  'archived',
  'scheduled'
);

CREATE TYPE supported_locale AS ENUM (
  'es',
  'en'
);

CREATE TYPE media_type AS ENUM (
  'movie',
  'series',
  'documentary',
  'short',
  'special'
);

CREATE TYPE video_type AS ENUM (
  'trailer',
  'teaser',
  'clip',
  'featurette',
  'behind_the_scenes',
  'bloopers'
);

CREATE TYPE video_site AS ENUM (
  'youtube',
  'vimeo'
);

CREATE TYPE person_role AS ENUM (
  'actor',
  'director',
  'writer',
  'producer',
  'composer',
  'cinematographer'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'editor',
  'viewer'
);

CREATE TYPE article_intent AS ENUM (
  'informational',
  'navigational',
  'transactional',
  'seasonal'
);

CREATE TYPE platform_type AS ENUM (
  'svod',  -- Subscription VOD (Netflix, Prime...)
  'tvod',  -- Transactional VOD (buy/rent)
  'avod',  -- Ad-supported (Pluto TV, Tubi...)
  'cable',
  'broadcast'
);

CREATE TYPE rating_source AS ENUM (
  'tmdb',
  'imdb',
  'rt_critics',
  'rt_audience',
  'cinepulse'
);

CREATE TYPE list_visibility AS ENUM (
  'public',
  'private',
  'unlisted'
);

CREATE TYPE sitemap_priority AS ENUM (
  'critical',   -- 1.0
  'high',       -- 0.9
  'medium',     -- 0.7-0.8
  'low',        -- 0.5
  'minimal'     -- 0.3
);

-- ─────────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- MODULE 1 — CATALOG
-- ─────────────────────────────────────────────

CREATE TABLE genres (
  id            SERIAL          PRIMARY KEY,
  tmdb_id       INT             UNIQUE NOT NULL,
  slug          VARCHAR(100)    UNIQUE NOT NULL,

  name_es       VARCHAR(100)    NOT NULL,
  name_en       VARCHAR(100)    NOT NULL,

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),

  description_es  TEXT,
  description_en  TEXT,
  cover_image_url VARCHAR(500),

  sitemap_priority  sitemap_priority  NOT NULL DEFAULT 'high',

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER genres_updated_at
  BEFORE UPDATE ON genres
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE media (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id       INT             UNIQUE NOT NULL,
  imdb_id       VARCHAR(20),
  media_type    media_type      NOT NULL DEFAULT 'movie',
  slug          VARCHAR(120)    UNIQUE NOT NULL,

  original_title    VARCHAR(300)  NOT NULL,
  original_language VARCHAR(10)   NOT NULL,
  release_date      DATE,
  runtime_minutes   INT           CHECK (runtime_minutes > 0),
  tmdb_popularity   DECIMAL(10,3),

  title_es      VARCHAR(300),
  title_en      VARCHAR(300),

  synopsis_es   TEXT,
  synopsis_en   TEXT,

  editorial_review_es   TEXT,
  editorial_review_en   TEXT,
  editorial_rating      DECIMAL(3,1) CHECK (editorial_rating >= 0 AND editorial_rating <= 10),
  editorial_verdict_es  VARCHAR(300),
  editorial_verdict_en  VARCHAR(300),

  poster_path   VARCHAR(200),
  backdrop_path VARCHAR(200),
  logo_path     VARCHAR(200),

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),
  og_image_url        VARCHAR(500),

  status            content_status    NOT NULL DEFAULT 'published',
  is_prerendered    BOOLEAN           NOT NULL DEFAULT false,
  sitemap_priority  sitemap_priority  NOT NULL DEFAULT 'medium',
  noindex           BOOLEAN           NOT NULL DEFAULT false,

  tmdb_last_synced_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX media_slug_idx        ON media (slug);
CREATE INDEX media_tmdb_idx        ON media (tmdb_id);
CREATE INDEX media_imdb_idx        ON media (imdb_id) WHERE imdb_id IS NOT NULL;
CREATE INDEX media_type_idx        ON media (media_type);
CREATE INDEX media_popularity_idx  ON media (tmdb_popularity DESC NULLS LAST);
CREATE INDEX media_status_idx      ON media (status);
CREATE INDEX media_listing_idx     ON media (media_type, status, tmdb_popularity DESC NULLS LAST);

-- Full-text search on titles
CREATE INDEX media_title_es_trgm ON media USING GIN (title_es gin_trgm_ops);
CREATE INDEX media_title_en_trgm ON media USING GIN (title_en gin_trgm_ops);

CREATE TRIGGER media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE media_genres (
  media_id  UUID  NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  genre_id  INT   NOT NULL REFERENCES genres (id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, genre_id)
);

CREATE INDEX media_genres_genre_idx ON media_genres (genre_id);

-- ──────────────────────────────────────────────

CREATE TABLE people (
  id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id   INT           UNIQUE NOT NULL,
  slug      VARCHAR(150)  UNIQUE NOT NULL,

  name            VARCHAR(200)  NOT NULL,
  also_known_as   TEXT[],
  birthdate       DATE,
  deathdate       DATE,
  birthplace      VARCHAR(200),
  biography_es    TEXT,
  biography_en    TEXT,
  gender          SMALLINT      CHECK (gender IN (0, 1, 2, 3)),

  profile_path    VARCHAR(200),
  homepage_url    VARCHAR(500),
  imdb_id         VARCHAR(20),

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),

  tmdb_popularity     DECIMAL(10,3),
  sitemap_priority    sitemap_priority  NOT NULL DEFAULT 'low',

  tmdb_last_synced_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX people_slug_idx  ON people (slug);
CREATE INDEX people_tmdb_idx  ON people (tmdb_id);
CREATE INDEX people_name_trgm ON people USING GIN (name gin_trgm_ops);

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE media_credits (
  id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id  UUID          NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  person_id UUID          NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  role      person_role   NOT NULL,

  character_name  VARCHAR(200),
  cast_order      SMALLINT,

  department  VARCHAR(100),
  job_title   VARCHAR(100)
);

CREATE INDEX credits_composite_idx ON media_credits (media_id, person_id, role);
CREATE INDEX credits_media_idx     ON media_credits (media_id);
CREATE INDEX credits_person_idx    ON media_credits (person_id);

-- ──────────────────────────────────────────────

CREATE TABLE media_videos (
  id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id  UUID            NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  locale    supported_locale NOT NULL DEFAULT 'es',

  video_type    video_type  NOT NULL,
  video_site    video_site  NOT NULL DEFAULT 'youtube',
  external_key  VARCHAR(50) NOT NULL,
  title         VARCHAR(300),
  published_at  DATE,
  is_official   BOOLEAN     NOT NULL DEFAULT true
);

CREATE INDEX videos_media_idx     ON media_videos (media_id);
CREATE INDEX videos_composite_idx ON media_videos (media_id, locale, video_type);

-- ──────────────────────────────────────────────

CREATE TABLE media_ratings (
  media_id    UUID            NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  source      rating_source   NOT NULL,
  score       DECIMAL(4,2)    NOT NULL CHECK (score >= 0 AND score <= 10),
  vote_count  INT,
  raw_score   VARCHAR(20),
  fetched_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  PRIMARY KEY (media_id, source)
);

CREATE INDEX ratings_media_idx ON media_ratings (media_id);

-- ─────────────────────────────────────────────
-- MODULE 2 — PLATFORMS & WHERE TO WATCH
-- ─────────────────────────────────────────────

CREATE TABLE platforms (
  id      SERIAL        PRIMARY KEY,
  slug    VARCHAR(80)   UNIQUE NOT NULL,

  name_es       VARCHAR(100)  NOT NULL,
  name_en       VARCHAR(100)  NOT NULL,
  description_es TEXT,
  description_en TEXT,

  logo_url      VARCHAR(500),
  website_url   VARCHAR(500),
  platform_type platform_type NOT NULL DEFAULT 'svod',

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),
  sitemap_priority    sitemap_priority NOT NULL DEFAULT 'medium',

  affiliate_url_es  VARCHAR(500),
  affiliate_url_en  VARCHAR(500),
  affiliate_id      VARCHAR(100),

  tmdb_provider_id  INT       UNIQUE,
  is_active         BOOLEAN   NOT NULL DEFAULT true,
  display_order     SMALLINT  NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE media_watch_providers (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  platform_id INT     NOT NULL REFERENCES platforms (id) ON DELETE CASCADE,

  region_code   VARCHAR(5)   NOT NULL,
  is_streaming  BOOLEAN      NOT NULL DEFAULT false,
  is_rent       BOOLEAN      NOT NULL DEFAULT false,
  is_buy        BOOLEAN      NOT NULL DEFAULT false,

  rent_price_usd  DECIMAL(6,2),
  buy_price_usd   DECIMAL(6,2),

  watch_url       VARCHAR(500),
  affiliate_url   VARCHAR(500),

  tmdb_synced_at  TIMESTAMPTZ,
  verified_at     TIMESTAMPTZ
);

CREATE INDEX watch_providers_composite_idx ON media_watch_providers (media_id, platform_id, region_code);
CREATE INDEX watch_media_idx               ON media_watch_providers (media_id);
CREATE INDEX watch_platform_idx            ON media_watch_providers (platform_id);
CREATE INDEX watch_region_idx              ON media_watch_providers (region_code);

-- ─────────────────────────────────────────────
-- MODULE 3 — EDITORIAL
-- ─────────────────────────────────────────────

CREATE TABLE authors (
  id      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug    VARCHAR(100)  UNIQUE NOT NULL,

  display_name    VARCHAR(150)  NOT NULL,
  email           VARCHAR(254)  UNIQUE NOT NULL,
  bio_es          TEXT,
  bio_en          TEXT,
  avatar_url      VARCHAR(500),
  twitter_handle  VARCHAR(50),
  website_url     VARCHAR(500),

  expertise_es  VARCHAR(300),
  expertise_en  VARCHAR(300),

  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE article_categories (
  id    SERIAL       PRIMARY KEY,
  slug  VARCHAR(80)  UNIQUE NOT NULL,

  name_es         VARCHAR(100)  NOT NULL,
  name_en         VARCHAR(100)  NOT NULL,
  description_es  TEXT,
  description_en  TEXT,

  genre_id            INT  REFERENCES genres (id) ON DELETE SET NULL,
  parent_category_id  INT  REFERENCES article_categories (id) ON DELETE SET NULL,
  display_order       SMALLINT NOT NULL DEFAULT 0
);

-- ──────────────────────────────────────────────

CREATE TABLE articles (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(200)    UNIQUE NOT NULL,
  author_id   UUID            NOT NULL REFERENCES authors (id),
  category_id INT             NOT NULL REFERENCES article_categories (id),

  title_es    VARCHAR(300)    NOT NULL,
  title_en    VARCHAR(300),

  excerpt_es  VARCHAR(500)    NOT NULL,
  excerpt_en  VARCHAR(500),

  content_es  TEXT            NOT NULL,
  content_en  TEXT,

  cover_image_url     VARCHAR(500),
  cover_image_alt_es  VARCHAR(300),
  cover_image_alt_en  VARCHAR(300),

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),
  og_image_url        VARCHAR(500),
  canonical_url_es    VARCHAR(500),
  canonical_url_en    VARCHAR(500),

  intent              article_intent    NOT NULL DEFAULT 'informational',
  primary_keyword_es  VARCHAR(200),
  primary_keyword_en  VARCHAR(200),
  secondary_keywords  TEXT[],

  status          content_status    NOT NULL DEFAULT 'draft',
  locale          supported_locale  NOT NULL DEFAULT 'es',
  has_en_version  BOOLEAN           NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,

  word_count_es         INT,
  word_count_en         INT,
  reading_time_minutes  SMALLINT,

  sitemap_priority  sitemap_priority  NOT NULL DEFAULT 'high',
  noindex           BOOLEAN           NOT NULL DEFAULT false,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX articles_slug_idx      ON articles (slug);
CREATE INDEX articles_author_idx    ON articles (author_id);
CREATE INDEX articles_category_idx  ON articles (category_id);
CREATE INDEX articles_status_idx    ON articles (status);
CREATE INDEX articles_intent_idx    ON articles (intent);
CREATE INDEX articles_published_idx ON articles (published_at DESC NULLS LAST);
CREATE INDEX articles_listing_idx   ON articles (status, published_at DESC NULLS LAST);
CREATE INDEX articles_title_es_trgm ON articles USING GIN (title_es gin_trgm_ops);

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE article_media_mentions (
  article_id    UUID         NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  media_id      UUID         NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  mention_type  VARCHAR(50)  NOT NULL DEFAULT 'supporting' CHECK (mention_type IN ('primary', 'supporting', 'mentioned')),
  display_order SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, media_id)
);

CREATE INDEX mentions_article_idx ON article_media_mentions (article_id);
CREATE INDEX mentions_media_idx   ON article_media_mentions (media_id);

-- ──────────────────────────────────────────────

CREATE TABLE article_faqs (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID  REFERENCES articles (id) ON DELETE CASCADE,
  media_id    UUID  REFERENCES media (id) ON DELETE CASCADE,

  question_es   TEXT      NOT NULL,
  question_en   TEXT,
  answer_es     TEXT      NOT NULL,
  answer_en     TEXT,
  display_order SMALLINT  NOT NULL DEFAULT 0,

  CONSTRAINT faq_must_have_parent CHECK (
    (article_id IS NOT NULL) OR (media_id IS NOT NULL)
  )
);

CREATE INDEX faqs_article_idx ON article_faqs (article_id) WHERE article_id IS NOT NULL;
CREATE INDEX faqs_media_idx   ON article_faqs (media_id) WHERE media_id IS NOT NULL;

-- ──────────────────────────────────────────────

CREATE TABLE tags (
  id      SERIAL        PRIMARY KEY,
  slug    VARCHAR(100)  UNIQUE NOT NULL,
  name_es VARCHAR(100)  NOT NULL,
  name_en VARCHAR(100)  NOT NULL
);

CREATE TABLE article_tags (
  article_id  UUID  NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  tag_id      INT   NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ─────────────────────────────────────────────
-- MODULE 4 — USERS & UGC
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(254)    UNIQUE NOT NULL,
  username      VARCHAR(50)     UNIQUE,
  display_name  VARCHAR(100),
  avatar_url    VARCHAR(500),
  role          user_role       NOT NULL DEFAULT 'viewer',
  locale_pref   supported_locale NOT NULL DEFAULT 'es',
  region_code   VARCHAR(5),

  email_verified_at TIMESTAMPTZ,
  last_sign_in_at   TIMESTAMPTZ,
  is_active         BOOLEAN     NOT NULL DEFAULT true,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX users_email_idx    ON users (email);
CREATE INDEX users_username_idx ON users (username) WHERE username IS NOT NULL;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE user_reviews (
  id        UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  media_id  UUID              NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  rating    SMALLINT          NOT NULL CHECK (rating >= 1 AND rating <= 10),
  body      TEXT,
  locale    supported_locale  NOT NULL DEFAULT 'es',
  is_visible BOOLEAN          NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);

CREATE INDEX reviews_media_idx ON user_reviews (media_id);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON user_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE user_watchlists (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name_es     VARCHAR(150)    NOT NULL,
  name_en     VARCHAR(150),
  description TEXT,
  visibility  list_visibility NOT NULL DEFAULT 'private',
  is_default  BOOLEAN         NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX watchlists_user_idx ON user_watchlists (user_id);

CREATE TRIGGER watchlists_updated_at
  BEFORE UPDATE ON user_watchlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE user_watchlist_items (
  watchlist_id  UUID  NOT NULL REFERENCES user_watchlists (id) ON DELETE CASCADE,
  media_id      UUID  NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  watched       BOOLEAN     NOT NULL DEFAULT false,
  watched_at    TIMESTAMPTZ,
  PRIMARY KEY (watchlist_id, media_id)
);

CREATE INDEX watchlist_items_list_idx ON user_watchlist_items (watchlist_id);

-- ─────────────────────────────────────────────
-- MODULE 5 — SEO INFRASTRUCTURE
-- ─────────────────────────────────────────────

CREATE TABLE redirects (
  id          SERIAL        PRIMARY KEY,
  from_path   VARCHAR(500)  UNIQUE NOT NULL,
  to_path     VARCHAR(500)  NOT NULL,
  status_code SMALLINT      NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
  reason      TEXT,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────

CREATE TABLE sitemap_index (
  id            SERIAL        PRIMARY KEY,
  section       VARCHAR(50)   UNIQUE NOT NULL,
  filename      VARCHAR(100)  NOT NULL,
  url_count     INT           NOT NULL DEFAULT 0,
  priority      sitemap_priority NOT NULL,
  last_generated_at TIMESTAMPTZ,
  last_submitted_at TIMESTAMPTZ
);

INSERT INTO sitemap_index (section, filename, priority) VALUES
  ('home',      'sitemap-home.xml',      'critical'),
  ('peliculas', 'sitemap-peliculas.xml', 'medium'),
  ('series',    'sitemap-series.xml',    'medium'),
  ('actores',   'sitemap-actores.xml',   'low'),
  ('generos',   'sitemap-generos.xml',   'high'),
  ('articulos', 'sitemap-articulos.xml', 'high'),
  ('plataformas','sitemap-plataformas.xml','medium');

-- ──────────────────────────────────────────────

CREATE TABLE seo_audit_log (
  id          BIGSERIAL       PRIMARY KEY,
  entity_type VARCHAR(50)     NOT NULL CHECK (entity_type IN ('media', 'article', 'genre', 'platform', 'person')),
  entity_id   VARCHAR(100)    NOT NULL,
  locale      supported_locale NOT NULL,
  checked_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

  has_title         BOOLEAN   NOT NULL DEFAULT false,
  has_description   BOOLEAN   NOT NULL DEFAULT false,
  has_h1            BOOLEAN   NOT NULL DEFAULT false,
  has_canonical     BOOLEAN   NOT NULL DEFAULT false,
  has_og_image      BOOLEAN   NOT NULL DEFAULT false,
  has_schema        BOOLEAN   NOT NULL DEFAULT false,
  has_faq           BOOLEAN   NOT NULL DEFAULT false,
  internal_link_count SMALLINT,

  lcp_score           DECIMAL(5,2),
  cls_score           DECIMAL(5,3),
  pagespeed_mobile    SMALLINT CHECK (pagespeed_mobile BETWEEN 0 AND 100),
  pagespeed_desktop   SMALLINT CHECK (pagespeed_desktop BETWEEN 0 AND 100),

  notes TEXT
);

CREATE INDEX audit_entity_idx ON seo_audit_log (entity_type, entity_id);
CREATE INDEX audit_date_idx   ON seo_audit_log (checked_at DESC);

-- ─────────────────────────────────────────────
-- MODULE 6 — RANKINGS & CURATED LISTS
-- ─────────────────────────────────────────────

CREATE TABLE curated_lists (
  id      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug    VARCHAR(150)  UNIQUE NOT NULL,

  title_es      VARCHAR(300)  NOT NULL,
  title_en      VARCHAR(300),
  description_es TEXT,
  description_en TEXT,

  seo_title_es        VARCHAR(80),
  seo_title_en        VARCHAR(80),
  seo_description_es  VARCHAR(200),
  seo_description_en  VARCHAR(200),
  cover_image_url     VARCHAR(500),

  list_type       VARCHAR(50)  NOT NULL CHECK (list_type IN ('ranking', 'collection', 'seasonal', 'thematic')),
  is_auto_updated BOOLEAN      NOT NULL DEFAULT false,
  status          content_status NOT NULL DEFAULT 'published',

  author_id  UUID  REFERENCES authors (id) ON DELETE SET NULL,
  genre_id   INT   REFERENCES genres (id) ON DELETE SET NULL,

  sitemap_priority  sitemap_priority NOT NULL DEFAULT 'medium',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX curated_lists_slug_idx ON curated_lists (slug);
CREATE INDEX curated_lists_genre_idx ON curated_lists (genre_id) WHERE genre_id IS NOT NULL;

CREATE TRIGGER curated_lists_updated_at
  BEFORE UPDATE ON curated_lists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────

CREATE TABLE curated_list_items (
  list_id       UUID      NOT NULL REFERENCES curated_lists (id) ON DELETE CASCADE,
  media_id      UUID      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  rank_position SMALLINT  NOT NULL,
  note_es       TEXT,
  note_en       TEXT,
  PRIMARY KEY (list_id, media_id)
);

CREATE INDEX list_items_rank_idx ON curated_list_items (list_id, rank_position);

-- ─────────────────────────────────────────────
-- SEED DATA — GENRES (TMDB standard IDs)
-- ─────────────────────────────────────────────

INSERT INTO genres (tmdb_id, slug, name_es, name_en, sitemap_priority) VALUES
  (28,    'accion',           'Acción',           'Action',         'high'),
  (12,    'aventura',         'Aventura',          'Adventure',      'high'),
  (16,    'animacion',        'Animación',         'Animation',      'high'),
  (35,    'comedia',          'Comedia',           'Comedy',         'high'),
  (80,    'crimen',           'Crimen',            'Crime',          'high'),
  (99,    'documental',       'Documental',        'Documentary',    'medium'),
  (18,    'drama',            'Drama',             'Drama',          'high'),
  (10751, 'familia',          'Familia',           'Family',         'medium'),
  (14,    'fantasia',         'Fantasía',          'Fantasy',        'high'),
  (36,    'historia',         'Historia',          'History',        'medium'),
  (27,    'terror',           'Terror',            'Horror',         'high'),
  (10402, 'musica',           'Música',            'Music',          'medium'),
  (9648,  'misterio',         'Misterio',          'Mystery',        'high'),
  (10749, 'romance',          'Romance',           'Romance',        'medium'),
  (878,   'ciencia-ficcion',  'Ciencia Ficción',   'Science Fiction','high'),
  (10770, 'television',       'Televisión',        'TV Movie',       'low'),
  (53,    'thriller',         'Thriller',          'Thriller',       'high'),
  (10752, 'guerra',           'Guerra',            'War',            'medium'),
  (37,    'western',          'Western',           'Western',        'medium');

-- ─────────────────────────────────────────────
-- SEED DATA — PLATFORMS
-- ─────────────────────────────────────────────

INSERT INTO platforms (slug, name_es, name_en, platform_type, tmdb_provider_id, display_order) VALUES
  ('netflix',       'Netflix',          'Netflix',          'svod', 8,    1),
  ('prime-video',   'Prime Video',      'Prime Video',      'svod', 119,  2),
  ('disney-plus',   'Disney+',          'Disney+',          'svod', 337,  3),
  ('hbo-max',       'Max',              'Max',              'svod', 384,  4),
  ('apple-tv-plus', 'Apple TV+',        'Apple TV+',        'svod', 350,  5),
  ('paramount',     'Paramount+',       'Paramount+',       'svod', 531,  6),
  ('star-plus',     'Star+',            'Star+',            'svod', 619,  7),
  ('mubi',          'MUBI',             'MUBI',             'svod', 11,   8),
  ('crunchyroll',   'Crunchyroll',      'Crunchyroll',      'svod', 283,  9),
  ('pluto-tv',      'Pluto TV',         'Pluto TV',         'avod', 300, 10);

-- ─────────────────────────────────────────────
-- SEED DATA — ARTICLE CATEGORIES
-- ─────────────────────────────────────────────

INSERT INTO article_categories (slug, name_es, name_en) VALUES
  ('mejores-peliculas',    'Mejores Películas',     'Best Movies'),
  ('donde-ver',            'Dónde Ver',             'Where to Watch'),
  ('novedades-streaming',  'Novedades en Streaming','Streaming News'),
  ('analisis',             'Análisis',              'Analysis'),
  ('listas',               'Listas',                'Lists'),
  ('curiosidades',         'Curiosidades',          'Fun Facts'),
  ('proximos-estrenos',    'Próximos Estrenos',     'Upcoming Releases');