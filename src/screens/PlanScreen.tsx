import { useMemo, useState } from 'react'
import { EmojiGrid, STEP_EMOJIS } from '../components/EmojiGrid'
import { Sheet } from '../components/Sheet'
import { WEEKDAYS } from '../dates'
import { useStepsById, useStore } from '../store'
import type { Weekday } from '../types'

export function PlanScreen() {
  const { state, addStep, addStepToDays, removeStepFromDay, moveStep, copyDay, removeStep, updateStep } =
    useStore()
  const byId = useStepsById()
  const today = new Date().getDay() as Weekday
  const [day, setDay] = useState<Weekday>(today)
  const [addOpen, setAddOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTargets, setCopyTargets] = useState<Weekday[]>([])
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [picked, setPicked] = useState<string[]>([])
  const [applyDays, setApplyDays] = useState<Weekday[]>([day])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('✨')

  const ids = state.week[day]
  const unused = useMemo(
    () => state.steps.filter((s) => !ids.includes(s.id)),
    [state.steps, ids],
  )
  const label = WEEKDAYS.find((d) => d.id === day)?.full ?? ''

  function toggleDay(list: Weekday[], id: Weekday): Weekday[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  function submitAdd() {
    const name = newName.trim()
    if (!name) return
    const step = addStep(name, newEmoji)
    addStepToDays(step.id, applyDays.length ? applyDays : [day])
    setNewName('')
    setAddOpen(false)
  }

  function addPicked() {
    for (const id of picked) addStepToDays(id, applyDays.length ? applyDays : [day])
    setPicked([])
    setAddOpen(false)
  }

  function saveEdit() {
    if (!editId || !editName.trim()) return
    updateStep(editId, { name: editName.trim(), emoji: editEmoji })
    setEditId(null)
  }

  return (
    <section className="screen">
      <p className="kicker">Weekly template</p>
      <h1 className="serif-title">Plan</h1>
      <div className="pill-row">
        {WEEKDAYS.map((d) => (
          <button
            key={d.id}
            className={`pill ${day === d.id ? 'on' : ''}`}
            onClick={() => {
              setDay(d.id)
              setApplyDays([d.id])
            }}
          >
            {d.short}
          </button>
        ))}
      </div>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <span className="muted">{label}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pill" onClick={() => setCopyOpen(true)}>
            Copy
          </button>
          <button className="pill" onClick={() => setLibraryOpen(true)}>
            Library
          </button>
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="empty card">
          <h3>Empty {label}</h3>
          <p>Add steps for this day. You can reuse them across the week.</p>
        </div>
      ) : (
        <div className="group">
          {ids.map((id, index) => {
            const step = byId[id]
            if (!step) return null
            return (
              <div key={id} className="group-row">
                <span className="emoji">{step.emoji}</span>
                <span className="grow row-title">{step.name}</span>
                <div className="tiny-btns">
                  <button onClick={() => moveStep(day, index, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button onClick={() => moveStep(day, index, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <button onClick={() => removeStepFromDay(day, id)} aria-label="Remove">
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="primary" style={{ marginTop: 16 }} onClick={() => setAddOpen(true)}>
        Add step
      </button>

      <Sheet open={addOpen} title="Add a step" onClose={() => setAddOpen(false)}>
        <p className="hint">Create a new one, or pick from your library. Apply it to any days.</p>
        <div className="field">
          <label>Name</label>
          <input
            value={newName}
            placeholder="e.g. Cold shower"
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Icon</label>
          <EmojiGrid value={newEmoji} options={STEP_EMOJIS} onChange={setNewEmoji} />
        </div>
        <div className="field">
          <label>Days</label>
          <div className="day-copy">
            {WEEKDAYS.map((d) => (
              <button
                key={d.id}
                className={`pill ${applyDays.includes(d.id) ? 'on' : ''}`}
                onClick={() => setApplyDays(toggleDay(applyDays, d.id))}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>
        <button className="primary" onClick={submitAdd}>
          Create and add
        </button>

        {unused.length > 0 && (
          <>
            <p className="section-label">From library</p>
            <div className="group">
              {unused.map((s) => (
                <button
                  key={s.id}
                  className="group-row"
                  onClick={() =>
                    setPicked((p) =>
                      p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id],
                    )
                  }
                >
                  <span className={`check ${picked.includes(s.id) ? 'on' : ''}`}>
                    {picked.includes(s.id) ? '✓' : ''}
                  </span>
                  <span className="emoji">{s.emoji}</span>
                  <span className="grow row-title">{s.name}</span>
                </button>
              ))}
            </div>
            <button className="primary" style={{ marginTop: 12 }} onClick={addPicked}>
              Add selected
            </button>
          </>
        )}
      </Sheet>

      <Sheet open={libraryOpen} title="Step library" onClose={() => setLibraryOpen(false)}>
        <p className="hint">Edit or delete steps. Deleting removes them from every day.</p>
        <div className="group">
          {state.steps.map((s) => (
            <div key={s.id} className="group-row">
              <span className="emoji">{s.emoji}</span>
              <span className="grow row-title">{s.name}</span>
              <div className="tiny-btns">
                <button
                  onClick={() => {
                    setEditId(s.id)
                    setEditName(s.name)
                    setEditEmoji(s.emoji)
                  }}
                >
                  ✎
                </button>
                <button className="danger" onClick={() => removeStep(s.id)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={!!editId}
        title="Edit step"
        onClose={() => setEditId(null)}
      >
        <div className="field">
          <label>Name</label>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} />
        </div>
        <div className="field">
          <label>Icon</label>
          <EmojiGrid value={editEmoji} options={STEP_EMOJIS} onChange={setEditEmoji} />
        </div>
        <button className="primary" onClick={saveEdit}>
          Save
        </button>
      </Sheet>

      <Sheet open={copyOpen} title={`Copy ${label}`} onClose={() => setCopyOpen(false)}>
        <p className="hint">Replace the selected days with this day’s steps.</p>
        <div className="day-copy">
          {WEEKDAYS.filter((d) => d.id !== day).map((d) => (
            <button
              key={d.id}
              className={`pill ${copyTargets.includes(d.id) ? 'on' : ''}`}
              onClick={() => setCopyTargets(toggleDay(copyTargets, d.id))}
            >
              {d.short}
            </button>
          ))}
        </div>
        <button
          className="primary"
          onClick={() => {
            copyDay(day, copyTargets)
            setCopyTargets([])
            setCopyOpen(false)
          }}
        >
          Copy to selected days
        </button>
      </Sheet>
    </section>
  )
}
