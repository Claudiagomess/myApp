import { ProgressRing } from '../components/ProgressRing'
import { formatLongDate, greeting, todayISO, weekdayOf } from '../dates'
import { useStepsById, useStore } from '../store'

export function TodayScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { state, toggleComplete } = useStore()
  const byId = useStepsById()
  const date = todayISO()
  const items = state.week[weekdayOf(date)]
  const done = new Set(state.completions[date] ?? [])
  const completed = items.filter((item) => done.has(item.stepId)).length
  const pct = items.length ? completed / items.length : 0

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
            {completed}/{items.length || 0}
          </strong>
          {items.length ? 'steps done' : 'nothing planned'}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty card">
          <h3>No steps today</h3>
          <p>Open Plan and build this day of the week however you want.</p>
        </div>
      ) : (
        <div className="group">
          {items.map((item) => {
            const step = byId[item.stepId]
            if (!step) return null
            const on = done.has(item.stepId)
            return (
              <button
                key={item.stepId}
                className="group-row"
                onClick={() => toggleComplete(date, item.stepId)}
              >
                <span className={`check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
                <span className="emoji">{step.emoji}</span>
                <span className="grow">
                  <span className={`row-title ${on ? 'done-text' : ''}`}>{step.name}</span>
                  {item.note ? (
                    <span className={`row-sub ${on ? 'done-text' : ''}`}>{item.note}</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
