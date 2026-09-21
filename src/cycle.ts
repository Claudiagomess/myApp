import type { PillConfig } from './types'
import { addDays, daysBetween } from './dates'

export type PillPhase =
  | { kind: 'unset' }
  | { kind: 'before'; packStart: string }
  | {
      kind: 'active'
      day: number
      of: number
      packStart: string
      packEnd: string
      nextStart: string
    }
  | {
      kind: 'break'
      day: number
      of: number
      packStart: string
      packEnd: string
      nextStart: string
    }

export function pillPhase(config: PillConfig, date: string): PillPhase {
  if (!config.startDate) return { kind: 'unset' }
  const active = Math.max(1, Math.round(config.activeDays))
  const brk = Math.max(0, Math.round(config.breakDays))
  const len = active + brk
  const diff = daysBetween(config.startDate, date)
  if (diff < 0) return { kind: 'before', packStart: config.startDate }
  const cycleIndex = Math.floor(diff / len)
  const pos = diff % len
  const packStart = addDays(config.startDate, cycleIndex * len)
  const packEnd = addDays(packStart, active - 1)
  const nextStart = addDays(packStart, len)
  if (pos < active) {
    return { kind: 'active', day: pos + 1, of: active, packStart, packEnd, nextStart }
  }
  return { kind: 'break', day: pos - active + 1, of: brk, packStart, packEnd, nextStart }
}

export function lastPeriodStart(periodDays: Record<string, true>, from: string): string | null {
  let date = from
  for (let i = 0; i < 400; i++) {
    if (periodDays[date]) {
      let start = date
      while (periodDays[addDays(start, -1)]) start = addDays(start, -1)
      return start
    }
    date = addDays(date, -1)
  }
  return null
}
