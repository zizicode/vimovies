import cron, { type ScheduledTask } from 'node-cron'
import { supabase } from '@vimovies/db'
import { MovieRepository, PersonRepository } from '@vimovies/repositories'
import { generateMediaSlug, generatePersonSlug, extractYear, shouldNoindex, normalizeTmdbVideoType } from '@vimovies/utils'
import { MediaType, ContentStatus, SitemapPriority, PersonRole, VideoSite, RatingSource, SupportedLocale, type PersonDetails, type MovieDetails, type Credits, type Cast, type Crew } from '@vimovies/types'

interface ExtendedMovieDetails extends MovieDetails {
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string; official: boolean; published_at: string; iso_639_1: string }> }
  'watch/providers'?: { results: Record<string, { link: string; flatrate?: Array<{ provider_id: number }>; rent?: Array<{ provider_id: number }>; buy?: Array<{ provider_id: number }> }> }
}

interface SyncJobOptions {
  schedule?: string
  limit?: number
  durationMs?: number
  maxMovies?: number
  startOnBoot?: boolean
  bootIntervalMs?: number
  bootExecutions?: number
  jobId?: string
  onProgress?: (jobId: string, progress: number, message: string, details?: any) => void
  onStatus?: (jobId: string, status: string) => void
  onError?: (jobId: string, error: string) => void
  // Configuración desde el dashboard
  delayBetweenMovies?: number
  minPopularity?: number
  minVoteAverage?: number
  minVoteCount?: number
  releaseYearStart?: number | null
  releaseYearEnd?: number | null
  includeAdult?: boolean
  originalLanguage?: string | null
  genres?: number[]
  syncGenres?: boolean
  syncCredits?: boolean
  syncVideos?: boolean
  syncWatchProviders?: boolean
  syncRatings?: boolean
  maxCast?: number
  maxCrew?: number
  crewJobs?: string[]
  videoSites?: string[]
  videoTypes?: string[]
  includeOfficialOnly?: boolean
  providerRegions?: string[]
  skipExisting?: boolean
  updateExisting?: boolean
  preserveEditorial?: boolean
  preserveSeo?: boolean
  defaultStatus?: 'draft' | 'published' | 'archived'
  defaultNoindex?: boolean
  defaultSitemapPriority?: 'high' | 'medium' | 'low' | 'minimal'
}

interface SyncResult {
  processed: number
  errors: number
  elapsedS: number
}

interface MovieSyncResult {
  tmdbId: number
  title: string
  success: boolean
  error?: string
}

const SUPPORTED_REGIONS = ['ES', 'MX', 'AR', 'CO', 'US']
const CREW_JOBS_TO_SYNC = ['Director', 'Screenplay', 'Story', 'Producer', 'Executive Producer', 'Original Music Composer', 'Director of Photography']

const JOB_ROLE_MAP: Record<string, PersonRole> = {
  'Director': PersonRole.Director,
  'Screenplay': PersonRole.Writer,
  'Story': PersonRole.Writer,
  'Producer': PersonRole.Producer,
  'Executive Producer': PersonRole.Producer,
  'Original Music Composer': PersonRole.Composer,
  'Director of Photography': PersonRole.Cinematographer
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(message: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

function logError(message: string): void {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ERROR: ${message}`)
}

function logSuccess(message: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] SUCCESS: ${message}`)
}

async function syncPerson(tmdbId: number): Promise<string | null> {
  try {
    const [esData, enData] = await Promise.allSettled([
      PersonRepository.getPersonById_Es(tmdbId),
      PersonRepository.getPersonById_En(tmdbId)
    ])

    const personEs = esData.status === 'fulfilled' && esData.value.success ? esData.value.data : null
    const personEn = enData.status === 'fulfilled' && enData.value.success ? enData.value.data : null

    if (!personEs && !personEn) {
      log(`Persona TMDB ${tmdbId} no encontrada en TMDB (se omite)`) 
      return null
    }

    const person: PersonDetails = (personEs || personEn)!
    let slug = generatePersonSlug(person.name)
    
    // Si el slug está vacío (caracteres especiales/chino), intentar con nombre en inglés
    if (!slug || slug.length === 0) {
      const englishName = personEn?.name || person.name
      slug = generatePersonSlug(englishName)
      log(`Slug vacío para persona ${tmdbId}, usando nombre en inglés: ${englishName}`)
    }
    
    // Validación final
    if (!slug || slug.length === 0) {
      logError(`Slug vacío para persona ${tmdbId} incluso con nombre en inglés: ${personEn?.name || person.name}`)
      return null
    }

    const personData = {
      tmdb_id: tmdbId,
      slug,
      name: person.name,
      also_known_as: person.also_known_as || null,
      birthdate: person.birthday || null,
      deathdate: person.deathday || null,
      birthplace: person.place_of_birth || null,
      biography_es: personEs?.biography || null,
      biography_en: personEn?.biography || null,
      gender: person.gender || null,
      profile_path: person.profile_path || null,
      homepage_url: person.homepage || null,
      imdb_id: person.imdb_id || null,
      tmdb_popularity: person.popularity || null,
      sitemap_priority: SitemapPriority.Low,
      tmdb_last_synced_at: new Date().toISOString()
    }

    // Usar upsert para manejar duplicados por slug o tmdb_id
    const { data: upserted, error: upsertError } = await supabase
      .from('people')
      .upsert(personData, {
        onConflict: 'tmdb_id',
        ignoreDuplicates: false
      })
      .select('id')
      .single()

    if (upsertError) {
      // Si falla por tmdb_id, intentar con slug
      const { data: bySlug, error: slugError } = await supabase
        .from('people')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (bySlug) {
        // Actualizar la persona existente
        const { data: updated, error: updateError } = await supabase
          .from('people')
          .update({ ...personData, id: bySlug.id })
          .eq('id', bySlug.id)
          .select('id')
          .single()
        
        if (updateError) {
          logError(`Error al actualizar persona ${tmdbId} por slug: ${updateError.message}`)
          return null
        }
        return updated?.id || null
      }
      
      logError(`Error al upsert persona ${tmdbId}: ${upsertError.message}`)
      return null
    }

    const personId = upserted?.id
    if (!personId) {
      logError(`Error al obtener ID de persona para TMDB ID ${tmdbId}`)
      return null
    }

    return personId
  } catch (error) {
    logError(`Error al sincronizar persona ${tmdbId}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

async function syncMediaGenres(mediaId: string, genres: Array<{ id: number; name: string }>): Promise<void> {
  await supabase.from('media_genres').delete().eq('media_id', mediaId)

  log(`Sincronizando ${genres.length} géneros para media ${mediaId}`)

  for (const genre of genres) {
    let genreData: { id: string } | null = null
    
    // Buscar género existente
    const { data: existing } = await supabase
      .from('genres')
      .select('id')
      .eq('tmdb_id', genre.id)
      .single()
    
    if (existing) {
      genreData = existing
      log(`Género existente: ${genre.name} (ID: ${genre.id})`)
    } else {
      // Crear género si no existe
      const { data: created, error: createError } = await supabase
        .from('genres')
        .insert({
          tmdb_id: genre.id,
          name: genre.name
        })
        .select('id')
        .single()
      
      if (createError) {
        logError(`Error al crear género ${genre.name}: ${createError.message}`)
      } else {
        log(`Género creado: ${genre.name} (ID: ${genre.id})`)
      }
      genreData = created
    }

    if (genreData) {
      await supabase.from('media_genres').insert({
        media_id: mediaId,
        genre_id: genreData.id
      })
    }
  }
}

async function syncMediaCredits(mediaId: string, credits: Credits, maxCast: number = 15, maxCrew: number = 15, crewJobs: string[] = CREW_JOBS_TO_SYNC): Promise<void> {
  await supabase.from('media_credits').delete().eq('media_id', mediaId)

  const actorsToSync = credits.cast?.slice(0, maxCast) || []
  const crewToSync = credits.crew?.filter((c) => crewJobs.includes(c.job)).slice(0, maxCrew) || []

  const uniquePeople = new Map<number, Cast | Crew>()

  for (const actor of actorsToSync) {
    uniquePeople.set(actor.id, actor)
  }

  for (const crew of crewToSync) {
    uniquePeople.set(crew.id, crew)
  }

  for (const [tmdbId, personData] of uniquePeople) {
    const personId = await syncPerson(tmdbId)

    if (!personId) continue

    const actor = actorsToSync.find((a) => a.id === tmdbId)
    const crew = crewToSync.find((c) => c.id === tmdbId)

    if (actor) {
      await supabase.from('media_credits').insert({
        media_id: mediaId,
        person_id: personId,
        role: PersonRole.Actor,
        character_name: actor.character || null,
        cast_order: actor.order || null,
        department: null,
        job_title: null
      })
    }

    if (crew) {
      const role = JOB_ROLE_MAP[crew.job] || PersonRole.Actor
      await supabase.from('media_credits').insert({
        media_id: mediaId,
        person_id: personId,
        role,
        character_name: null,
        cast_order: null,
        department: crew.department || null,
        job_title: crew.job || null
      })
    }
  }
}

async function syncMediaVideos(mediaId: string, videos: NonNullable<ExtendedMovieDetails['videos']>, includeOfficialOnly: boolean = false, videoSites: string[] = ['YouTube'], videoTypes: string[] = ['Trailer', 'Teaser', 'Clip', 'Featurette']): Promise<void> {
  await supabase.from('media_videos').delete().eq('media_id', mediaId)

  const validVideos = videos.results?.filter((v) =>
    videoSites.includes(v.site) &&
    videoTypes.includes(v.type) &&
    (!includeOfficialOnly || v.official === true)
  ) || []

  for (const video of validVideos) {
    const normalizedType = normalizeTmdbVideoType(video.type)
    if (!normalizedType) continue

    const locale = video.iso_639_1 === 'es' ? SupportedLocale.ES : SupportedLocale.EN
    const publishedDate = video.published_at ? video.published_at.split('T')[0] : null

    await supabase.from('media_videos').insert({
      media_id: mediaId,
      locale,
      video_type: normalizedType,
      video_site: VideoSite.YouTube,
      external_key: video.key,
      title: video.name || null,
      published_at: publishedDate,
      is_official: video.official || false
    })
  }
}

async function syncMediaWatchProviders(mediaId: string, providers: NonNullable<ExtendedMovieDetails['watch/providers']>, providerRegions: string[] = SUPPORTED_REGIONS): Promise<void> {
  await supabase.from('media_watch_providers').delete().eq('media_id', mediaId)

  for (const region of providerRegions) {
    const regionData = providers.results?.[region]
    if (!regionData) continue

    const allProviders = [
      ...(regionData.flatrate || []),
      ...(regionData.rent || []),
      ...(regionData.buy || [])
    ]

    for (const provider of allProviders) {
      let platformData: { id: string } | null = null
      
      // Buscar plataforma existente
      const { data: existing } = await supabase
        .from('platforms')
        .select('id')
        .eq('tmdb_provider_id', provider.provider_id)
        .single()
      
      if (existing) {
        platformData = existing
      } else {
        // Crear plataforma si no existe (usamos el provider_id como nombre temporal)
        const { data: created } = await supabase
          .from('platforms')
          .insert({
            tmdb_provider_id: provider.provider_id,
            name: `Provider ${provider.provider_id}`
          })
          .select('id')
          .single()
        platformData = created
      }

      if (!platformData) continue

      const isStreaming = regionData.flatrate?.some((p) => p.provider_id === provider.provider_id) || false
      const isRent = regionData.rent?.some((p) => p.provider_id === provider.provider_id) || false
      const isBuy = regionData.buy?.some((p) => p.provider_id === provider.provider_id) || false

      await supabase.from('media_watch_providers').insert({
        media_id: mediaId,
        platform_id: platformData.id,
        region_code: region,
        is_streaming: isStreaming,
        is_rent: isRent,
        is_buy: isBuy,
        rent_price_usd: null,
        buy_price_usd: null,
        watch_url: regionData.link || null,
        affiliate_url: null,
        tmdb_synced_at: new Date().toISOString(),
        verified_at: null
      })
    }
  }
}

async function syncMediaRating(mediaId: string, voteAverage: number, voteCount: number): Promise<void> {
  await supabase.from('media_ratings').upsert({
    media_id: mediaId,
    source: RatingSource.TMDB,
    score: voteAverage,
    vote_count: voteCount,
    raw_score: `${voteAverage}/10`,
    fetched_at: new Date().toISOString()
  }, {
    onConflict: 'media_id,source'
  })
}

function calculateSitemapPriority(popularity: number): SitemapPriority {
  if (popularity > 50) return SitemapPriority.High
  if (popularity > 20) return SitemapPriority.Medium
  if (popularity > 10) return SitemapPriority.Low
  return SitemapPriority.Minimal
}

async function syncMovie(
  tmdbId: number,
  options: {
    skipExisting?: boolean
    updateExisting?: boolean
    preserveEditorial?: boolean
    preserveSeo?: boolean
    defaultStatus?: 'draft' | 'published' | 'archived'
    defaultNoindex?: boolean
    defaultSitemapPriority?: 'high' | 'medium' | 'low' | 'minimal'
    syncGenres?: boolean
    syncCredits?: boolean
    syncVideos?: boolean
    syncWatchProviders?: boolean
    syncRatings?: boolean
    maxCast?: number
    maxCrew?: number
    crewJobs?: string[]
    videoSites?: string[]
    videoTypes?: string[]
    includeOfficialOnly?: boolean
    providerRegions?: string[]
  } = {},
  onProgress?: (step: number, total: number, stepName: string) => void
): Promise<MovieSyncResult> {
  const {
    skipExisting = false,
    updateExisting = true,
    preserveEditorial = true,
    preserveSeo = true,
    defaultStatus = 'draft',
    defaultNoindex = true,
    defaultSitemapPriority = 'medium',
    syncGenres = true,
    syncCredits = true,
    syncVideos = true,
    syncWatchProviders = true,
    syncRatings = true,
    maxCast = 15,
    maxCrew = 15,
    crewJobs = CREW_JOBS_TO_SYNC,
    videoSites = ['YouTube'],
    videoTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette'],
    includeOfficialOnly = false,
    providerRegions = SUPPORTED_REGIONS
  } = options

  const steps = [
    'datos básicos',
    'géneros',
    'rating',
    'créditos',
    'vídeos',
    'plataformas'
  ];
  let currentStep = 0;

  const updateProgress = (stepName: string) => {
    if (onProgress) {
      onProgress(currentStep + 1, steps.length, stepName);
    }
    currentStep++;
  };

  try {
    updateProgress('obteniendo datos de TMDB');
    const response = await MovieRepository.getById(tmdbId)

    if (!response.success || !response.data) {
      return {
        tmdbId,
        title: 'Unknown',
        success: false,
        error: response.error || 'Failed to fetch from TMDB'
      }
    }

    const movieEs: ExtendedMovieDetails | null = response.data.es || null
    const movieEn: ExtendedMovieDetails | null = response.data.en || null

    if (!movieEs && !movieEn) {
      return {
        tmdbId,
        title: 'Unknown',
        success: false,
        error: 'No data available'
      }
    }

    const movie: ExtendedMovieDetails = (movieEs || movieEn)!
    const year = extractYear(movie.release_date)
    let slug = generateMediaSlug(movie.original_title, year)
    
    // Si el slug está vacío (caracteres especiales/chino), intentar con título en inglés
    if (!slug || slug.length === 0) {
      const englishTitle = movieEn?.original_title || movie.original_title
      slug = generateMediaSlug(englishTitle, year)
      log(`Slug vacío para película ${tmdbId}, usando título en inglés: ${englishTitle}`)
    }
    
    const popularity = movie.popularity || 0

    let existing: {
      id: string;
      status: ContentStatus;
      editorial_review_es: string | null;
      editorial_review_en: string | null;
      editorial_rating: number | null;
      editorial_verdict_es: string | null;
      editorial_verdict_en: string | null;
      seo_title_es: string | null;
      seo_title_en: string | null;
      seo_description_es: string | null;
      seo_description_en: string | null;
      og_image_url: string | null;
      is_prerendered: boolean;
      noindex: boolean | null;
      sitemap_priority: string | null;
    } | null = null
    try {
      const result = await supabase
        .from('media')
        .select('id, status, editorial_review_es, editorial_review_en, editorial_rating, editorial_verdict_es, editorial_verdict_en, seo_title_es, seo_title_en, seo_description_es, seo_description_en, og_image_url, is_prerendered, noindex, sitemap_priority')
        .eq('tmdb_id', tmdbId)
        .single()
      existing = result.data
    } catch {
      existing = null
    }

    // Skip existing if configured
    if (existing && skipExisting) {
      return {
        tmdbId,
        title: movie!.original_title,
        success: true,
        error: 'Skipped (already exists)'
      }
    }

    const mediaData = {
      tmdb_id: tmdbId,
      imdb_id: movie!.imdb_id || null,
      media_type: MediaType.Movie,
      slug,
      original_title: movie!.original_title,
      original_language: movie!.original_language,
      release_date: movie!.release_date || null,
      runtime_minutes: movie!.runtime || null,
      tmdb_popularity: popularity,
      title_es: movieEs?.title || null,
      title_en: movieEn?.title || null,
      synopsis_es: movieEs?.overview || null,
      synopsis_en: movieEn?.overview || null,
      poster_path: movie!.poster_path || null,
      backdrop_path: movie!.backdrop_path || null,
      status: existing?.status || defaultStatus,
      noindex: existing?.noindex ?? defaultNoindex,
      sitemap_priority: existing?.sitemap_priority || defaultSitemapPriority,
      tmdb_last_synced_at: new Date().toISOString(),
      editorial_review_es: (existing && preserveEditorial) ? existing.editorial_review_es : null,
      editorial_review_en: (existing && preserveEditorial) ? existing.editorial_review_en : null,
      editorial_rating: (existing && preserveEditorial) ? existing.editorial_rating : null,
      editorial_verdict_es: (existing && preserveEditorial) ? existing.editorial_verdict_es : null,
      editorial_verdict_en: (existing && preserveEditorial) ? existing.editorial_verdict_en : null,
      seo_title_es: (existing && preserveSeo) ? existing.seo_title_es : null,
      seo_title_en: (existing && preserveSeo) ? existing.seo_title_en : null,
      seo_description_es: (existing && preserveSeo) ? existing.seo_description_es : null,
      seo_description_en: (existing && preserveSeo) ? existing.seo_description_en : null,
      og_image_url: existing?.og_image_url || null,
      is_prerendered: existing?.is_prerendered || false
    }

    let mediaId: string

    if (existing) {
      if (!updateExisting) {
        return {
          tmdbId,
          title: movie!.original_title,
          success: true,
          error: 'Skipped (update disabled)'
        }
      }

      const { data: updated } = await supabase
        .from('media')
        .update(mediaData)
        .eq('id', existing.id)
        .select('id')
        .single()

      mediaId = updated?.id || null
    } else {
      const { data: created } = await supabase
        .from('media')
        .insert(mediaData)
        .select('id')
        .single()

      mediaId = created?.id || null
    }

    if (!mediaId) {
      return {
        tmdbId,
        title: movie!.original_title,
        success: false,
        error: 'Failed to save media'
      }
    }

    updateProgress('sincronizando géneros');
    if (syncGenres) {
      await syncMediaGenres(mediaId, movie!.genres || [])
    }

    updateProgress('sincronizando rating');
    if (syncRatings) {
      await syncMediaRating(mediaId, movie!.vote_average || 0, movie!.vote_count || 0)
    }

    if (movieEs?.credits && syncCredits) {
      updateProgress('sincronizando créditos');
      await syncMediaCredits(mediaId, movieEs.credits, maxCast, maxCrew, crewJobs)
    }

    if (movieEs?.videos && syncVideos) {
      updateProgress('sincronizando vídeos');
      await syncMediaVideos(mediaId, movieEs.videos, includeOfficialOnly, videoSites, videoTypes)
    }

    if (movieEs?.['watch/providers'] && syncWatchProviders) {
      updateProgress('sincronizando plataformas');
      await syncMediaWatchProviders(mediaId, movieEs['watch/providers'], providerRegions)
    }

    return {
      tmdbId,
      title: movie!.original_title,
      success: true
    }
  } catch (error) {
    return {
      tmdbId,
      title: 'Unknown',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function runSyncCycle(maxMovies: number = 20): Promise<SyncResult> {
  const start = Date.now()
  let processed = 0
  let errors = 0

  log(`Iniciando ciclo de sincronización - máximo películas: ${maxMovies}`)

  const randomPage = Math.floor(Math.random() * 500) + 1
  const response = await MovieRepository.getPopular(randomPage)

  if (!response.success || !response.data) {
    logError(`Error al obtener películas populares: ${response.error}`)
    return { processed, errors, elapsedS: (Date.now() - start) / 1000 }
  }

  const movies = response.data.results?.slice(0, maxMovies) || []
  log(`Obtenidas ${movies.length} películas de TMDB página ${randomPage}`)

  for (const movie of movies) {
    const result = await syncMovie(movie.id)

    if (result.success) {
      log(`[${movie.id}] ${result.title} - sincronizada correctamente`)
      processed++
    } else {
      logError(`[${movie.id}] ${result.title} - ${result.error}`)
      errors++
    }

    await sleep(500)
  }

  const elapsed = (Date.now() - start) / 1000
  log(`Ciclo completado - procesadas: ${processed}, errores: ${errors}, tiempo: ${elapsed.toFixed(2)}s`)

  return { processed, errors, elapsedS: elapsed }
}

export interface JobState {
  isRunning: boolean
  isPaused: boolean
  isStopped: boolean
  executionCount: number
  totalProcessed: number
  totalErrors: number
  jobStartedAt: number
  currentMovieIndex: number
  totalMovies: number
}

export class SyncMoviesJob {
  private static task: ScheduledTask | null = null
  private static jobs = new Map<string, JobState>()
  private static onProgressCallbacks = new Map<string, (jobId: string, progress: number, message: string, details?: any) => void>()
  private static onStatusCallbacks = new Map<string, (jobId: string, status: string) => void>()
  private static onErrorCallbacks = new Map<string, (jobId: string, error: string) => void>()

  /**
   * Ejecutar un job específico con control por socket
   */
  static async execute(jobId: string, options: SyncJobOptions = {}): Promise<void> {
    const {
      maxMovies = 20,
      delayBetweenMovies = 500,
      minPopularity = 0,
      minVoteAverage = 0,
      minVoteCount = 0,
      releaseYearStart = null,
      releaseYearEnd = null,
      includeAdult = false,
      originalLanguage = null,
      genres = [],
      syncGenres = true,
      syncCredits = true,
      syncVideos = true,
      syncWatchProviders = true,
      syncRatings = true,
      maxCast = 15,
      maxCrew = 15,
      crewJobs = CREW_JOBS_TO_SYNC,
      videoSites = ['YouTube'],
      videoTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette'],
      includeOfficialOnly = false,
      providerRegions = ['ES', 'MX', 'AR', 'CO', 'US'],
      skipExisting = false,
      updateExisting = true,
      preserveEditorial = true,
      preserveSeo = true,
      defaultStatus = 'draft',
      defaultNoindex = true,
      defaultSitemapPriority = 'medium',
      onProgress,
      onStatus,
      onError
    } = options

    // Inicializar estado del job
    this.jobs.set(jobId, {
      isRunning: true,
      isPaused: false,
      isStopped: false,
      executionCount: 0,
      totalProcessed: 0,
      totalErrors: 0,
      jobStartedAt: Date.now(),
      currentMovieIndex: 0,
      totalMovies: maxMovies
    })

    // Registrar callbacks
    if (onProgress) this.onProgressCallbacks.set(jobId, onProgress)
    if (onStatus) this.onStatusCallbacks.set(jobId, onStatus)
    if (onError) this.onErrorCallbacks.set(jobId, onError)

    const emitStatus = (status: string) => {
      const callback = this.onStatusCallbacks.get(jobId)
      if (callback) callback(jobId, status)
    }

    const emitProgress = (progress: number, message: string, details?: any) => {
      const callback = this.onProgressCallbacks.get(jobId)
      if (callback) callback(jobId, progress, message, details)
    }

    const emitError = (error: string) => {
      const callback = this.onErrorCallbacks.get(jobId)
      if (callback) callback(jobId, error)
    }

    emitStatus('running')
    log(`[${jobId}] Job iniciado - maxMovies: ${maxMovies}`)

    try {
      const state = this.jobs.get(jobId)!
      const start = Date.now()

      const randomPage = Math.floor(Math.random() * 500) + 1
      const response = await MovieRepository.getPopular(randomPage)

      if (!response.success || !response.data) {
        emitError(`Error al obtener películas populares: ${response.error}`)
        emitStatus('failed')
        return
      }

      const movies = response.data.results?.slice(0, maxMovies) || []
      state.totalMovies = movies.length
      log(`[${jobId}] Obtenidas ${movies.length} películas de TMDB página ${randomPage}`)

      // Apply filters
      const filteredMovies = movies.filter(movie => {
        const popularity = movie.popularity || 0
        const voteAverage = movie.vote_average || 0
        const voteCount = movie.vote_count || 0
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

        if (minPopularity > 0 && popularity < minPopularity) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por popularidad (${popularity} < ${minPopularity})`)
          return false
        }
        if (minVoteAverage > 0 && voteAverage < minVoteAverage) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por vote_average (${voteAverage} < ${minVoteAverage})`)
          return false
        }
        if (minVoteCount > 0 && voteCount < minVoteCount) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por vote_count (${voteCount} < ${minVoteCount})`)
          return false
        }
        if (releaseYearStart && year && year < releaseYearStart) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por año (${year} < ${releaseYearStart})`)
          return false
        }
        if (releaseYearEnd && year && year > releaseYearEnd) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por año (${year} > ${releaseYearEnd})`)
          return false
        }
        if (!includeAdult && movie.adult) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por contenido adulto`)
          return false
        }
        if (originalLanguage && movie.original_language !== originalLanguage) {
          log(`[${jobId}] Filtro: ${movie.title} rechazada por idioma (${movie.original_language} != ${originalLanguage})`)
          return false
        }
        // Filter by genres if specified
        if (genres && genres.length > 0) {
          const movieGenreIds = movie.genre_ids || []
          const hasMatchingGenre = movieGenreIds.some(gid => genres.includes(gid))
          if (!hasMatchingGenre) {
            log(`[${jobId}] Filtro: ${movie.title} rechazada por géneros (no coincide con los seleccionados)`)
            return false
          }
        }
        return true
      })

      log(`[${jobId}] Películas después de filtros: ${filteredMovies.length} de ${movies.length}`)
      state.totalMovies = filteredMovies.length

      for (let i = 0; i < filteredMovies.length; i++) {
        const state = this.jobs.get(jobId)!
        
        // Verificar si el job fue detenido
        if (state.isStopped) {
          log(`[${jobId}] Job detenido manualmente`)
          emitStatus('stopped')
          break
        }

        // Verificar si el job está pausado
        while (state.isPaused && !state.isStopped) {
          await sleep(100)
        }

        if (state.isStopped) {
          emitStatus('stopped')
          break
        }

        state.currentMovieIndex = i
        const movie = filteredMovies[i]
        if (!movie) continue

        emitProgress(
          Math.round((i / filteredMovies.length) * 100),
          `Procesando: ${movie.title}`,
          {
            movieTitle: movie.title,
            currentStep: 'iniciando',
            stepIndex: 0,
            totalSteps: 6,
            processed: state.totalProcessed,
            errors: state.totalErrors,
            total: filteredMovies.length,
          }
        )

        const result = await syncMovie(
          movie.id,
          {
            skipExisting,
            updateExisting,
            preserveEditorial,
            preserveSeo,
            defaultStatus,
            defaultNoindex,
            defaultSitemapPriority,
            syncGenres,
            syncCredits,
            syncVideos,
            syncWatchProviders,
            syncRatings,
            maxCast,
            maxCrew,
            crewJobs,
            videoSites,
            videoTypes,
            includeOfficialOnly,
            providerRegions
          },
          (step, total, stepName) => {
            emitProgress(
              Math.round((i / filteredMovies.length) * 100),
              `Procesando: ${movie.title} — Paso ${step}/${total}: ${stepName}`,
              {
                movieTitle: movie.title,
              currentStep: stepName,
              stepIndex: step,
              totalSteps: total,
              processed: state.totalProcessed,
              errors: state.totalErrors,
              total: filteredMovies.length,
            }
          )
        })

        if (result.success) {
          log(`[${jobId}] [${movie.id}] ${result.title} - sincronizada correctamente`)
          state.totalProcessed++
        } else {
          logError(`[${jobId}] [${movie.id}] ${result.title} - ${result.error}`)
          state.totalErrors++
        }

        await sleep(delayBetweenMovies)
      }

      const finalState = this.jobs.get(jobId)!
      if (!finalState.isStopped) {
        const elapsed = (Date.now() - start) / 1000
        emitProgress(100, `Completado: ${finalState.totalProcessed} películas`)
        emitStatus('completed')
        log(`[${jobId}] Job completado - procesadas: ${finalState.totalProcessed}, errores: ${finalState.totalErrors}, tiempo: ${elapsed.toFixed(2)}s`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      emitError(errorMsg)
      emitStatus('failed')
      logError(`[${jobId}] Job falló: ${errorMsg}`)
    } finally {
      const state = this.jobs.get(jobId)
      if (state) {
        state.isRunning = false
      }
    }
  }

  /**
   * Pausar un job específico
   */
  static pause(jobId: string): boolean {
    const state = this.jobs.get(jobId)
    if (!state || !state.isRunning) return false
    
    state.isPaused = true
    log(`[${jobId}] Job pausado`)
    
    const callback = this.onStatusCallbacks.get(jobId)
    if (callback) callback(jobId, 'paused')
    
    return true
  }

  /**
   * Reanudar un job pausado
   */
  static resume(jobId: string): boolean {
    const state = this.jobs.get(jobId)
    if (!state || !state.isRunning) return false
    
    state.isPaused = false
    log(`[${jobId}] Job reanudado`)
    
    const callback = this.onStatusCallbacks.get(jobId)
    if (callback) callback(jobId, 'running')
    
    return true
  }

  /**
   * Detener un job específico
   */
  static stop(jobId: string): boolean {
    const state = this.jobs.get(jobId)
    if (!state) return false
    
    state.isStopped = true
    state.isPaused = false
    log(`[${jobId}] Job detenido`)
    
    const callback = this.onStatusCallbacks.get(jobId)
    if (callback) callback(jobId, 'stopped')
    
    return true
  }

  /**
   * Obtener estado de un job específico
   */
  static getJobStatus(jobId: string): JobState | null {
    return this.jobs.get(jobId) || null
  }

  /**
   * Iniciar job programado (modo cron - compatibilidad con versión anterior)
   */
  static start(options: SyncJobOptions = {}): void {
    const {
      schedule = '0 3 * * *',
      maxMovies = 20,
      jobId = 'cron-job'
    } = options

    log(`SyncMoviesJob configurado en modo cron - horario: ${schedule}, maxMovies: ${maxMovies}`)

    this.task = cron.schedule(schedule, async () => {
      await this.execute(jobId, { maxMovies })
    })
  }

  /**
   * Detener job programado (modo cron)
   */
  static stopCron(): void {
    if (this.task) {
      this.task.stop()
      this.task = null
      log('Job cron detenido manualmente')
    }
  }
}
