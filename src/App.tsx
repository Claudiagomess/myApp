import { useState } from 'react'
import { TabBar } from './components/TabBar'
import { CycleScreen } from './screens/CycleScreen'
import { MoneyScreen } from './screens/MoneyScreen'
import { PlanScreen } from './screens/PlanScreen'
import { SettingsSheet } from './screens/SettingsSheet'
import { StatsScreen } from './screens/StatsScreen'
import { TodayScreen } from './screens/TodayScreen'
import { StoreProvider } from './store'
import type { TabId } from './types'

function Shell() {
  const [tab, setTab] = useState<TabId>('today')
  const [settings, setSettings] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  return (
    <div className="shell">
      <div className="app">
        {tab === 'today' && <TodayScreen onOpenSettings={() => setSettings(true)} />}
        {tab === 'cycle' && <CycleScreen />}
        {tab === 'money' && <MoneyScreen />}
        {tab === 'stats' && <StatsScreen />}
        <TabBar tab={tab} onChange={setTab} />
        <SettingsSheet
          open={settings}
          onClose={() => setSettings(false)}
          onOpenPlan={() => setPlanOpen(true)}
        />
      </div>
      {planOpen && (
        <div className="plan-overlay">
          <PlanScreen onBack={() => setPlanOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
