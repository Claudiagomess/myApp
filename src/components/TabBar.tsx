import type { ReactNode } from 'react'
import type { TabId } from '../types'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: 'today',
    label: 'Today',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
  {
    id: 'cycle',
    label: 'Cycle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 0 0 16" />
      </svg>
    ),
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'money',
    label: 'Money',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v10M9.5 9.2c.8-.9 4.7-1.1 4.7 1.5 0 3.2-6 1.4-6 4.2 0 1.8 2.3 2.4 4.6 1.6" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 16V8M10 16V5M15 16v-6M20 16V7" />
      </svg>
    ),
  },
]

export function TabBar({
  tab,
  onChange,
}: {
  tab: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${tab === t.id ? 'on' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  )
}
