// packages/utils/src/seo.utils.ts

import { SupportedLocale } from '@vimovies/types'
import { getLocalized } from './locale.utils'

const SITE_NAME = 'Vimovies'

type LocalizedField = {
  title_es?: string | null
  title_en?: string | null
  name_es?: string | null
  name_en?: string | null
}

export function buildMediaTitle(
  media: LocalizedField & {
    release_date?: string | null
  },
  locale: SupportedLocale = SupportedLocale.ES
): string {
  const title =
    getLocalized(media, 'title', locale) ??
    (locale === SupportedLocale.EN ? 'Movie' : 'Película')

  const year = media.release_date?.split('-')[0]
  const yearStr = year ? ` (${year})` : ''

  return locale === SupportedLocale.EN
    ? `${title}${yearStr} — Where to Watch & Review | ${SITE_NAME}`
    : `${title}${yearStr} — Dónde Ver y Reseña | ${SITE_NAME}`
}

export function buildGenreTitle(
  genre: LocalizedField,
  locale: SupportedLocale = SupportedLocale.ES
): string {
  const name =
    getLocalized(genre, 'name', locale) ??
    (locale === SupportedLocale.EN ? 'Genre' : 'Género')

  const year = new Date().getFullYear()

  return locale === SupportedLocale.EN
    ? `${name} Movies — The Best of ${year} | ${SITE_NAME}`
    : `Películas de ${name} — Las Mejores de ${year} | ${SITE_NAME}`
}

export function buildPersonTitle(
  name: string,
  locale: SupportedLocale = SupportedLocale.ES
): string {
  return locale === SupportedLocale.EN
    ? `${name} — Complete Filmography | ${SITE_NAME}`
    : `${name} — Filmografía Completa | ${SITE_NAME}`
}

export function buildPlatformTitle(
  platform: LocalizedField,
  locale: SupportedLocale = SupportedLocale.ES
): string {
  const name =
    getLocalized(platform, 'name', locale) ??
    (locale === SupportedLocale.EN
      ? 'Platform'
      : 'Plataforma')

  return locale === SupportedLocale.EN
    ? `What to Watch on ${name} — Full Catalog | ${SITE_NAME}`
    : `Qué Ver en ${name} — Catálogo Completo | ${SITE_NAME}`
}

export function truncateForMeta(
  text: string,
  maxLength = 160
): string {
  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength - 3)
  return `${truncated.slice(0, truncated.lastIndexOf(' '))}...`
}