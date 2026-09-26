import { addDays, addMonths, daysBetween, monthEnd, monthKey } from './dates'
import type { RecurEvery, Recurring } from './types'

export const REPEAT_OPTIONS: Array<{ id: RecurEvery | 'once'; label: string }> = [
  { id: 'once', label: 'Once' },
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
]

export function everyLabel(every: RecurEvery): string {
  if (every === 'day') return 'Every day'
  if (every === 'week') return 'Every week'
  return 'Every month'
}

export function occurrencesInMonth(rule: Recurring, month: string): string[] {
  const from = `${month}-01`
  const to = monthEnd(month)
  if (rule.startDate > to) return []

  if (rule.every === 'day') {
    const out: string[] = []
    let d = rule.startDate > from ? rule.startDate : from
    while (d <= to) {
      out.push(d)
      d = addDays(d, 1)
    }
    return out
  }

  if (rule.every === 'week') {
    const out: string[] = []
    let d = rule.startDate
    if (d < from) {
      const weeks = Math.ceil(daysBetween(d, from) / 7)
      d = addDays(d, weeks * 7)
    }
    while (d <= to) {
      if (d >= from) out.push(d)
      d = addDays(d, 7)
    }
    return out
  }

  const [sy, sm] = monthKey(rule.startDate).split('-').map(Number)
  const [ty, tm] = month.split('-').map(Number)
  const delta = (ty - sy) * 12 + (tm - sm)
  if (delta < 0) return []
  const d = addMonths(rule.startDate, delta)
  return monthKey(d) === month ? [d] : []
}

export function recurringAmountInMonth(rules: Recurring[], month: string): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const rule of rules) {
    const n = occurrencesInMonth(rule, month).length
    if (!n) continue
    if (rule.kind === 'income') income += rule.amount * n
    else expense += rule.amount * n
  }
  return { income, expense }
}
