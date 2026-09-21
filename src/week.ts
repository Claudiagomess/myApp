import type { PlannedStep, Weekday, WeekPlan } from './types'

export function emptyWeek(): WeekPlan {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
}

export function planned(stepId: string, note = ''): PlannedStep {
  return { stepId, note }
}

export function normalizeDay(entries: unknown): PlannedStep[] {
  if (!Array.isArray(entries)) return []
  const out: PlannedStep[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      out.push({ stepId: entry, note: '' })
      continue
    }
    if (entry && typeof entry === 'object' && 'stepId' in entry) {
      const item = entry as PlannedStep
      out.push({ stepId: String(item.stepId), note: String(item.note ?? '') })
    }
  }
  return out
}

export function normalizeWeek(week: unknown): WeekPlan {
  const base = emptyWeek()
  if (!week || typeof week !== 'object') return base
  const raw = week as Record<string, unknown>
  for (const key of ['0', '1', '2', '3', '4', '5', '6'] as const) {
    base[Number(key) as Weekday] = normalizeDay(raw[key])
  }
  return base
}

export function dayIds(list: PlannedStep[]): string[] {
  return list.map((item) => item.stepId)
}

export function hasStep(list: PlannedStep[], stepId: string): boolean {
  return list.some((item) => item.stepId === stepId)
}

export function withoutStep(list: PlannedStep[], stepId: string): PlannedStep[] {
  return list.filter((item) => item.stepId !== stepId)
}
