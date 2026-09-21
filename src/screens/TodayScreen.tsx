import { ProgressRing } from '../components/ProgressRing'
import { formatLongDate, greeting, todayISO, weekdayOf } from '../dates'
import { useStepsById, useStore } from '../store'

export function TodayScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { state, toggleComplete } = useStore()
  const byId = useStepsById()
  const date = todayISO()
  const ids = state.week[weekdayOf(date)]
  const done = new Set(state.completions[date] ?? [])
  const completed = ids.filter((id) => done.has(id)).length
  const pct = ids.length ? completed / ids.length : 0

  return (
    <section className="screen">
      <div className="row-between">
        <p className="kicker">{greeting()}</p>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
          ⚙️
        </button>
      </div>
      <h1 className="serif-title">Today</h1>
      <p className="hint" style={{ marginTop: -10 }}>
        {formatLongDate(date)}
      </p>

      <div className="card progress-wrap">
        <ProgressRing value={pct} />
        <div className="ring-label">
          <strong>
            {completed}/{ids.length || 0}
          </strong>
          {ids.length ? 'steps done' : 'nothing planned'}
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="empty card">
          <h3>No steps today</h3>
          <p>Open Plan and build this day of the week however you want.</p>
        </div>
      ) : (
        <div className="group">
          {ids.map((id) => {
            const step = byId[id]
            if (!step) return null
            const on = done.has(id)
            return (
              <button
                key={id}
                className="group-row"
                onClick={() => toggleComplete(date, id)}
              >
                <span className={`check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
                <span className="emoji">{step.emoji}</span>
                <span className={`grow row-title ${on ? 'done-text' : ''}`}>
                  {step.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
