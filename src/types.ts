export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Step = {
  id: string
  name: string
  emoji: string
  createdAt: string
}

export type PlannedStep = {
  stepId: string
  note: string
}

export type OneOffStep = {
  id: string
  date: string
  name: string
  emoji: string
  note: string
}

export type WeekPlan = Record<Weekday, PlannedStep[]>

export type CategoryKind = 'expense' | 'income'

export type Category = {
  id: string
  name: string
  emoji: string
  color: string
  kind: CategoryKind
}

export type Transaction = {
  id: string
  kind: CategoryKind
  amount: number
  categoryId: string
  note: string
  date: string
  createdAt: string
}

export type RecurEvery = 'day' | 'week' | 'month'

export type Recurring = {
  id: string
  kind: CategoryKind
  amount: number
  categoryId: string
  note: string
  every: RecurEvery
  startDate: string
}

export type Settings = {
  currency: string
}

export type PillConfig = {
  startDate: string | null
  activeDays: number
  breakDays: number
}

export type AppState = {
  version: 1
  steps: Step[]
  week: WeekPlan
  completions: Record<string, string[]>
  oneOffs: OneOffStep[]
  categories: Category[]
  transactions: Transaction[]
  recurring: Recurring[]
  settings: Settings
  pill: PillConfig
  pillsTaken: Record<string, true>
  periodDays: Record<string, true>
  sexDays: Record<string, true>
}

export type TabId = 'today' | 'cycle' | 'money' | 'stats'
