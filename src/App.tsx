import { useState } from 'react'
import { TabBar } from './components/TabBar'
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

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen onOpenSettings={() => setSettings(true)} />}
      {tab === 'plan' && <PlanScreen />}
      {tab === 'money' && <MoneyScreen />}
      {tab === 'stats' && <StatsScreen />}
      <TabBar tab={tab} onChange={setTab} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
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
