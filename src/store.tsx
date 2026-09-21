import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  Category,
  CategoryKind,
  Step,
  Transaction,
  Weekday,
} from './types'
import { uid } from './format'
import { defaultState, loadState, saveState } from './storage'

type Store = {
  state: AppState
  addStep: (name: string, emoji: string) => Step
  updateStep: (id: string, patch: Partial<Pick<Step, 'name' | 'emoji'>>) => void
  removeStep: (id: string) => void
  setDaySteps: (day: Weekday, ids: string[]) => void
  addStepToDays: (stepId: string, days: Weekday[]) => void
  removeStepFromDay: (day: Weekday, stepId: string) => void
  moveStep: (day: Weekday, index: number, dir: -1 | 1) => void
  copyDay: (from: Weekday, to: Weekday[]) => void
  toggleComplete: (date: string, stepId: string) => void
  addCategory: (input: Omit<Category, 'id'>) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void
  addTransaction: (input: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void
  removeTransaction: (id: string) => void
  setCurrency: (currency: string) => void
  exportJson: () => string
  importJson: (raw: string) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

function persist(next: AppState): AppState {
  saveState(next)
  return next
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  const patch = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => persist(fn(prev)))
  }, [])

  const addStep = useCallback(
    (name: string, emoji: string) => {
      const step: Step = {
        id: uid(),
        name: name.trim(),
        emoji,
        createdAt: new Date().toISOString(),
      }
      patch((s) => ({ ...s, steps: [...s.steps, step] }))
      return step
    },
    [patch],
  )

  const updateStep = useCallback(
    (id: string, next: Partial<Pick<Step, 'name' | 'emoji'>>) => {
      patch((s) => ({
        ...s,
        steps: s.steps.map((st) => (st.id === id ? { ...st, ...next } : st)),
      }))
    },
    [patch],
  )

  const removeStep = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        steps: s.steps.filter((st) => st.id !== id),
        week: {
          0: s.week[0].filter((x) => x !== id),
          1: s.week[1].filter((x) => x !== id),
          2: s.week[2].filter((x) => x !== id),
          3: s.week[3].filter((x) => x !== id),
          4: s.week[4].filter((x) => x !== id),
          5: s.week[5].filter((x) => x !== id),
          6: s.week[6].filter((x) => x !== id),
        },
      }))
    },
    [patch],
  )

  const setDaySteps = useCallback(
    (day: Weekday, ids: string[]) => {
      patch((s) => ({ ...s, week: { ...s.week, [day]: ids } }))
    },
    [patch],
  )

  const addStepToDays = useCallback(
    (stepId: string, days: Weekday[]) => {
      patch((s) => {
        const week = { ...s.week }
        for (const day of days) {
          if (!week[day].includes(stepId)) week[day] = [...week[day], stepId]
        }
        return { ...s, week }
      })
    },
    [patch],
  )

  const removeStepFromDay = useCallback(
    (day: Weekday, stepId: string) => {
      patch((s) => ({
        ...s,
        week: { ...s.week, [day]: s.week[day].filter((id) => id !== stepId) },
      }))
    },
    [patch],
  )

  const moveStep = useCallback(
    (day: Weekday, index: number, dir: -1 | 1) => {
      patch((s) => {
        const list = [...s.week[day]]
        const next = index + dir
        if (next < 0 || next >= list.length) return s
        ;[list[index], list[next]] = [list[next], list[index]]
        return { ...s, week: { ...s.week, [day]: list } }
      })
    },
    [patch],
  )

  const copyDay = useCallback(
    (from: Weekday, to: Weekday[]) => {
      patch((s) => {
        const week = { ...s.week }
        for (const day of to) week[day] = [...s.week[from]]
        return { ...s, week }
      })
    },
    [patch],
  )

  const toggleComplete = useCallback(
    (date: string, stepId: string) => {
      patch((s) => {
        const current = s.completions[date] ?? []
        const done = current.includes(stepId)
        const next = done ? current.filter((id) => id !== stepId) : [...current, stepId]
        return { ...s, completions: { ...s.completions, [date]: next } }
      })
    },
    [patch],
  )

  const addCategory = useCallback(
    (input: Omit<Category, 'id'>) => {
      patch((s) => ({
        ...s,
        categories: [...s.categories, { ...input, id: uid() }],
      }))
    },
    [patch],
  )

  const updateCategory = useCallback(
    (id: string, next: Partial<Omit<Category, 'id'>>) => {
      patch((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...next } : c)),
      }))
    },
    [patch],
  )

  const removeCategory = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        transactions: s.transactions.filter((t) => t.categoryId !== id),
      }))
    },
    [patch],
  )

  const addTransaction = useCallback(
    (input: Omit<Transaction, 'id' | 'createdAt'>) => {
      const tx: Transaction = {
        ...input,
        id: uid(),
        createdAt: new Date().toISOString(),
      }
      patch((s) => ({ ...s, transactions: [tx, ...s.transactions] }))
    },
    [patch],
  )

  const updateTransaction = useCallback(
    (id: string, next: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      patch((s) => ({
        ...s,
        transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...next } : t)),
      }))
    },
    [patch],
  )

  const removeTransaction = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        transactions: s.transactions.filter((t) => t.id !== id),
      }))
    },
    [patch],
  )

  const setCurrency = useCallback(
    (currency: string) => {
      patch((s) => ({ ...s, settings: { ...s.settings, currency } }))
    },
    [patch],
  )

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state])

  const importJson = useCallback(
    (raw: string) => {
      const parsed = JSON.parse(raw) as AppState
      if (parsed?.version !== 1 || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid backup file')
      }
      setState(persist(parsed))
    },
    [],
  )

  const resetAll = useCallback(() => {
    setState(persist(defaultState()))
  }, [])

  const value = useMemo<Store>(
    () => ({
      state,
      addStep,
      updateStep,
      removeStep,
      setDaySteps,
      addStepToDays,
      removeStepFromDay,
      moveStep,
      copyDay,
      toggleComplete,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setCurrency,
      exportJson,
      importJson,
      resetAll,
    }),
    [
      state,
      addStep,
      updateStep,
      removeStep,
      setDaySteps,
      addStepToDays,
      removeStepFromDay,
      moveStep,
      copyDay,
      toggleComplete,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setCurrency,
      exportJson,
      importJson,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function useStepsById(): Record<string, Step> {
  const { state } = useStore()
  return useMemo(
    () => Object.fromEntries(state.steps.map((s) => [s.id, s])),
    [state.steps],
  )
}

export function useCategoriesById(): Record<string, Category> {
  const { state } = useStore()
  return useMemo(
    () => Object.fromEntries(state.categories.map((c) => [c.id, c])),
    [state.categories],
  )
}

export function categoryOptions(cats: Category[], kind: CategoryKind): Category[] {
  return cats.filter((c) => c.kind === kind)
}
