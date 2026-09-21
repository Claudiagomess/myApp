import { useState } from 'react'
import { EmojiGrid, STEP_EMOJIS } from '../components/EmojiGrid'
import { PillBanner } from '../components/PillBanner'
import { ProgressRing } from '../components/ProgressRing'
import { Sheet } from '../components/Sheet'
import { pillPhase } from '../cycle'
import { formatLongDate, formatShortDate, greeting, todayISO, weekdayOf } from '../dates'
import { useStepsById, useStore } from '../store'

export function TodayScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { state, toggleComplete, togglePillTaken, addOneOff, removeOneOff } = useStore()
  const byId = useStepsById()
  const date = todayISO()
  const weekly = state.week[weekdayOf(date)]
  const extras = (state.oneOffs ?? []).filter((item) => item.date === date)
  const done = new Set(state.completions[date] ?? [])
  const weekItems = weekly
    .map((item) => {
      const step = byId[item.stepId]
      if (!step) return null
      return {
        id: item.stepId,
        name: step.name,
        emoji: step.emoji,
        note: item.note,
        oneOff: false,
      }
    })
    .filter((item) => item !== null)
  const extraItems = extras.map((item) => ({
    id: item.id,
    name: item.name,
    emoji: item.emoji,
    note: item.note,
    oneOff: true,
  }))
  const items = [...weekItems, ...extraItems]
  const completed = items.filter((item) => done.has(item.id)).length
  const pct = items.length ? completed / items.length : 0
  const phase = pillPhase(state.pill, date)
  const pillTaken = !!state.pillsTaken[date]
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [newNote, setNewNote] = useState('')

  function submitOneOff() {
    const name = newName.trim()
    if (!name) return
    addOneOff(date, name, newEmoji, newNote)
    setNewName('')
    setNewNote('')
    setNewEmoji('✨')
    setAddOpen(false)
  }

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

      {phase.kind === 'active' && (
        <PillBanner taken={pillTaken} phase={phase} onToggle={() => togglePillTaken(date)} />
      )}
      {phase.kind === 'break' && (
        <div className="card cycle-status">
          <strong>
            Break day {phase.day} of {phase.of}
          </strong>
          <span className="muted">Next pack {formatShortDate(phase.nextStart)}</span>
        </div>
      )}

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
          <p>Add something just for today, or open Settings → Weekly plan.</p>
        </div>
      ) : (
        <div className="group">
          {items.map((item) => {
            const on = done.has(item.id)
            return (
              <div key={item.id} className="group-row">
                <button className="today-step" onClick={() => toggleComplete(date, item.id)}>
                  <span className={`check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
                  <span className="emoji">{item.emoji}</span>
                  <span className="grow">
                    <span className={`row-title ${on ? 'done-text' : ''}`}>{item.name}</span>
                    {item.note ? (
                      <span className={`row-sub ${on ? 'done-text' : ''}`}>{item.note}</span>
                    ) : item.oneOff ? (
                      <span className="row-sub">Today only</span>
                    ) : null}
                  </span>
                </button>
                {item.oneOff ? (
                  <div className="tiny-btns">
                    <button onClick={() => removeOneOff(item.id)} aria-label="Remove">
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <button className="primary" style={{ marginTop: 16 }} onClick={() => setAddOpen(true)}>
        Add for today
      </button>

      <Sheet open={addOpen} title="Add for today" onClose={() => setAddOpen(false)}>
        <p className="hint">Only appears today. It won’t change your weekly plan.</p>
        <div className="field">
          <label>Name</label>
          <input
            value={newName}
            placeholder="e.g. Pharmacy"
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Note</label>
          <textarea
            value={newNote}
            placeholder="Optional"
            onChange={(e) => setNewNote(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Icon</label>
          <EmojiGrid value={newEmoji} options={STEP_EMOJIS} onChange={setNewEmoji} />
        </div>
        <button className="primary" onClick={submitOneOff}>
          Add to today
        </button>
      </Sheet>
    </section>
  )
}
