import type { Weekday } from './types'

export const WEEKDAYS: { id: Weekday; short: string; full: string }[] = [
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
  { id: 0, short: 'Sun', full: 'Sunday' },
]

export function todayISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function weekdayOf(iso: string): Weekday {
  return parseISO(iso).getDay() as Weekday
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function formatLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export function startOfMonth(iso: string): string {
  return `${monthKey(iso)}-01`
}

export function daysInMonth(iso: string): number {
  const d = parseISO(iso)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function shiftMonth(iso: string, delta: number): string {
  const d = parseISO(iso)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  return todayISO(d)
}

export function lastNDates(n: number, from = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(from, -(n - 1 - i)))
}
