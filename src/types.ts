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

export type Settings = {
  currency: string
}

export type AppState = {
  version: 1
  steps: Step[]
  week: WeekPlan
  completions: Record<string, string[]>
  categories: Category[]
  transactions: Transaction[]
  settings: Settings
}

export type TabId = 'today' | 'plan' | 'money' | 'stats'
