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
  OneOffStep,
  PillConfig,
  Step,
  Transaction,
  Weekday,
} from './types'
import { uid } from './format'
import { defaultState, hydrateState, loadState, saveState } from './storage'
import { hasStep, planned, withoutStep } from './week'

type Store = {
  state: AppState
  addStep: (name: string, emoji: string) => Step
  updateStep: (id: string, patch: Partial<Pick<Step, 'name' | 'emoji'>>) => void
  removeStep: (id: string) => void
  setDaySteps: (day: Weekday, ids: string[]) => void
  addStepToDays: (stepId: string, days: Weekday[], note?: string) => void
  removeStepFromDay: (day: Weekday, stepId: string) => void
  setDayNote: (day: Weekday, stepId: string, note: string) => void
  reorderDay: (day: Weekday, from: number, to: number) => void
  copyDay: (from: Weekday, to: Weekday[]) => void
  toggleComplete: (date: string, stepId: string) => void
  addOneOff: (date: string, name: string, emoji: string, note?: string) => void
  removeOneOff: (id: string) => void
  addCategory: (input: Omit<Category, 'id'>) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void
  addTransaction: (input: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void
  removeTransaction: (id: string) => void
  setCurrency: (currency: string) => void
  setPillConfig: (patch: Partial<PillConfig>) => void
  startPack: (date: string) => void
  togglePeriod: (date: string) => void
  toggleSex: (date: string) => void
  togglePillTaken: (date: string) => void
  exportJson: () => string
  importJson: (raw: string) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

function persist(next: AppState): AppState {
  saveState(next)
  return next
}

function toggleFlag(map: Record<string, true>, date: string): Record<string, true> {
  const next = { ...map }
  if (next[date]) delete next[date]
  else next[date] = true
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
          0: withoutStep(s.week[0], id),
          1: withoutStep(s.week[1], id),
          2: withoutStep(s.week[2], id),
          3: withoutStep(s.week[3], id),
          4: withoutStep(s.week[4], id),
          5: withoutStep(s.week[5], id),
          6: withoutStep(s.week[6], id),
        },
      }))
    },
    [patch],
  )

  const setDaySteps = useCallback(
    (day: Weekday, ids: string[]) => {
      patch((s) => ({
        ...s,
        week: { ...s.week, [day]: ids.map((id) => planned(id)) },
      }))
    },
    [patch],
  )

  const addStepToDays = useCallback(
    (stepId: string, days: Weekday[], note = '') => {
      const trimmed = note.trim()
      patch((s) => {
        const week = { ...s.week }
        for (const day of days) {
          if (!hasStep(week[day], stepId)) {
            week[day] = [...week[day], planned(stepId, trimmed)]
          }
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
        week: { ...s.week, [day]: withoutStep(s.week[day], stepId) },
      }))
    },
    [patch],
  )

  const setDayNote = useCallback(
    (day: Weekday, stepId: string, note: string) => {
      patch((s) => ({
        ...s,
        week: {
          ...s.week,
          [day]: s.week[day].map((item) =>
            item.stepId === stepId ? { ...item, note: note.trim() } : item,
          ),
        },
      }))
    },
    [patch],
  )

  const reorderDay = useCallback(
    (day: Weekday, from: number, to: number) => {
      patch((s) => {
        const list = [...s.week[day]]
        if (
          from === to ||
          from < 0 ||
          to < 0 ||
          from >= list.length ||
          to >= list.length
        ) {
          return s
        }
        const [item] = list.splice(from, 1)
        list.splice(to, 0, item)
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

  const addOneOff = useCallback(
    (date: string, name: string, emoji: string, note = '') => {
      const trimmed = name.trim()
      if (!trimmed) return
      const item: OneOffStep = {
        id: uid(),
        date,
        name: trimmed,
        emoji,
        note: note.trim(),
      }
      patch((s) => ({ ...s, oneOffs: [...(s.oneOffs ?? []), item] }))
    },
    [patch],
  )

  const removeOneOff = useCallback(
    (id: string) => {
      patch((s) => {
        const oneOffs = (s.oneOffs ?? []).filter((item) => item.id !== id)
        const completions = { ...s.completions }
        for (const date of Object.keys(completions)) {
          completions[date] = completions[date].filter((stepId) => stepId !== id)
        }
        return { ...s, oneOffs, completions }
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

  const setPillConfig = useCallback(
    (next: Partial<PillConfig>) => {
      patch((s) => ({ ...s, pill: { ...s.pill, ...next } }))
    },
    [patch],
  )

  const startPack = useCallback(
    (date: string) => {
      patch((s) => ({ ...s, pill: { ...s.pill, startDate: date } }))
    },
    [patch],
  )

  const togglePeriod = useCallback(
    (date: string) => {
      patch((s) => ({ ...s, periodDays: toggleFlag(s.periodDays, date) }))
    },
    [patch],
  )

  const toggleSex = useCallback(
    (date: string) => {
      patch((s) => ({ ...s, sexDays: toggleFlag(s.sexDays, date) }))
    },
    [patch],
  )

  const togglePillTaken = useCallback(
    (date: string) => {
      patch((s) => ({ ...s, pillsTaken: toggleFlag(s.pillsTaken, date) }))
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
      setState(persist(hydrateState(parsed)))
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
      setDayNote,
      reorderDay,
      copyDay,
      toggleComplete,
      addOneOff,
      removeOneOff,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setCurrency,
      setPillConfig,
      startPack,
      togglePeriod,
      toggleSex,
      togglePillTaken,
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
      setDayNote,
      reorderDay,
      copyDay,
      toggleComplete,
      addOneOff,
      removeOneOff,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setCurrency,
      setPillConfig,
      startPack,
      togglePeriod,
      toggleSex,
      togglePillTaken,
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
