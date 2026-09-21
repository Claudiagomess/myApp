import type { AppState, Category, Step } from './types'
import { uid } from './format'
import { emptyWeek, planned, normalizeWeek } from './week'

const KEY = 'life-app-v1'

const STEP_SEEDS: Array<Pick<Step, 'name' | 'emoji'>> = [
  { name: 'Brushing teeth', emoji: '🪥' },
  { name: 'Skincare', emoji: '✨' },
  { name: 'Gym', emoji: '🏋️' },
  { name: 'Plyos workout', emoji: '💥' },
  { name: 'Calisthenics', emoji: '🤸' },
  { name: 'Running', emoji: '🏃' },
]

const CATEGORY_SEEDS: Array<Omit<Category, 'id'>> = [
  { name: 'Food', emoji: '🍽️', color: '#E8A87C', kind: 'expense' },
  { name: 'Transport', emoji: '🚗', color: '#7EB6D9', kind: 'expense' },
  { name: 'Housing', emoji: '🏠', color: '#C4A574', kind: 'expense' },
  { name: 'Health', emoji: '💊', color: '#E07A7A', kind: 'expense' },
  { name: 'Shopping', emoji: '🛍️', color: '#C9A0DC', kind: 'expense' },
  { name: 'Fun', emoji: '🎬', color: '#7DCEA0', kind: 'expense' },
  { name: 'Bills', emoji: '📄', color: '#8B8A86', kind: 'expense' },
  { name: 'Other', emoji: '📦', color: '#9AA0A6', kind: 'expense' },
  { name: 'Salary', emoji: '💼', color: '#7DCEA0', kind: 'income' },
  { name: 'Freelance', emoji: '💻', color: '#64D2FF', kind: 'income' },
  { name: 'Gift', emoji: '🎁', color: '#F5C16C', kind: 'income' },
  { name: 'Other income', emoji: '📈', color: '#A8D5A2', kind: 'income' },
]

export function defaultState(): AppState {
  const now = new Date().toISOString()
  const steps: Step[] = STEP_SEEDS.map((s) => ({
    id: uid(),
    name: s.name,
    emoji: s.emoji,
    createdAt: now,
  }))

  const byName = Object.fromEntries(steps.map((s) => [s.name, s.id]))
  const week = emptyWeek()
  week[1] = [planned(byName['Brushing teeth']), planned(byName['Gym']), planned(byName['Skincare'])]
  week[2] = [planned(byName['Brushing teeth']), planned(byName['Plyos workout']), planned(byName['Skincare'])]
  week[3] = [planned(byName['Brushing teeth']), planned(byName['Calisthenics']), planned(byName['Skincare'])]
  week[4] = [planned(byName['Brushing teeth']), planned(byName['Gym']), planned(byName['Skincare'])]
  week[5] = [planned(byName['Brushing teeth']), planned(byName['Running']), planned(byName['Skincare'])]
  week[6] = [planned(byName['Brushing teeth']), planned(byName['Gym']), planned(byName['Skincare'])]
  week[0] = [planned(byName['Brushing teeth']), planned(byName['Skincare'])]

  return {
    version: 1,
    steps,
    week,
    completions: {},
    categories: CATEGORY_SEEDS.map((c) => ({ ...c, id: uid() })),
    transactions: [],
    settings: { currency: 'EUR' },
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed?.version !== 1) return defaultState()
    return {
      ...defaultState(),
      ...parsed,
      week: normalizeWeek(parsed.week),
      completions: parsed.completions ?? {},
      settings: { currency: parsed.settings?.currency || 'EUR' },
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}
