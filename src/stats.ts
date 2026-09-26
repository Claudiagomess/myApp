import { addDays, lastNDates, monthKey, todayISO, weekdayOf } from './dates'
import { recurringAmountInMonth, occurrencesInMonth } from './recurrences'
import type { AppState, Category, Step } from './types'

export function dayCompletion(state: AppState, date: string): { done: number; total: number; pct: number } {
  const weekIds = state.week[weekdayOf(date)]
    .filter((item) => state.steps.some((s) => s.id === item.stepId))
    .map((item) => item.stepId)
  const extraIds = (state.oneOffs ?? [])
    .filter((item) => item.date === date)
    .map((item) => item.id)
  const ids = [...weekIds, ...extraIds]
  const doneSet = new Set(state.completions[date] ?? [])
  const done = ids.filter((id) => doneSet.has(id)).length
  return { done, total: ids.length, pct: ids.length ? done / ids.length : 0 }
}

export function currentStreak(state: AppState): number {
  let streak = 0
  let date = todayISO()
  for (let i = 0; i < 400; i++) {
    const { total, pct } = dayCompletion(state, date)
    if (total === 0) {
      date = addDays(date, -1)
      continue
    }
    if (pct < 1) {
      if (date === todayISO()) {
        date = addDays(date, -1)
        continue
      }
      break
    }
    streak += 1
    date = addDays(date, -1)
  }
  return streak
}

export function rangeRate(state: AppState, dates: string[]): number {
  let done = 0
  let total = 0
  for (const date of dates) {
    const d = dayCompletion(state, date)
    done += d.done
    total += d.total
  }
  return total ? done / total : 0
}

export function stepRates(state: AppState, dates: string[]): Array<{ step: Step; pct: number; done: number; total: number }> {
  return state.steps
    .map((step) => {
      let done = 0
      let total = 0
      for (const date of dates) {
        if (!state.week[weekdayOf(date)].some((item) => item.stepId === step.id)) continue
        total += 1
        if ((state.completions[date] ?? []).includes(step.id)) done += 1
      }
      return { step, pct: total ? done / total : 0, done, total }
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.pct - a.pct)
}

export function lastMonths(n: number): string[] {
  const now = todayISO()
  const [y, m] = monthKey(now).split('-').map(Number)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    out.push(`${d.getFullYear()}-${mm}`)
  }
  return out
}

export function monthTotals(state: AppState, key: string): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const t of state.transactions) {
    if (!t.date.startsWith(key)) continue
    if (t.kind === 'income') income += t.amount
    else expense += t.amount
  }
  const extra = recurringAmountInMonth(state.recurring ?? [], key)
  return { income: income + extra.income, expense: expense + extra.expense }
}

export function categorySpend(
  state: AppState,
  key: string,
  cats: Record<string, Category>,
): Array<{ name: string; emoji: string; color: string; amount: number }> {
  const map = new Map<string, number>()
  for (const t of state.transactions) {
    if (t.kind !== 'expense' || !t.date.startsWith(key)) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  for (const rule of state.recurring ?? []) {
    if (rule.kind !== 'expense') continue
    const n = occurrencesInMonth(rule, key).length
    if (!n) continue
    map.set(rule.categoryId, (map.get(rule.categoryId) ?? 0) + rule.amount * n)
  }
  return [...map.entries()]
    .map(([id, amount]) => ({
      name: cats[id]?.name ?? 'Other',
      emoji: cats[id]?.emoji ?? '📦',
      color: cats[id]?.color ?? '#9AA0A6',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function heatValues(state: AppState, weeks = 16): number[] {
  return lastNDates(weeks * 7).map((d) => dayCompletion(state, d).pct)
}
