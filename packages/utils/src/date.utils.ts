// packages/utils/src/date.utils.ts

import { SupportedLocale } from '@vimovies/types'

export function formatRuntime(
  minutes?: number | null,
  locale: SupportedLocale = SupportedLocale.ES
): string | null {
  if (!minutes || minutes <= 0) return null

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  if (locale === SupportedLocale.EN) {
    return h
      ? `${h}h${m ? ` ${m}m` : ''}`
      : `${m}m`
  }

  return h
    ? `${h}h${m ? ` ${m}min` : ''}`
    : `${m}min`
}

export function getYear(
  dateStr?: string | null
): number | null {
  const year = Number(dateStr?.split('-')[0])
  return Number.isNaN(year) ? null : year
}

export function formatDate(
  dateStr?: string | null,
  locale: SupportedLocale = SupportedLocale.ES
): string | null {
  if (!dateStr) return null

  const date = new Date(dateStr)

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(
        locale === SupportedLocale.EN
          ? 'en-US'
          : 'es-ES',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      )
}

export function isoRuntime(
  minutes?: number | null
): string | null {
  if (!minutes || minutes <= 0) return null

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`
}