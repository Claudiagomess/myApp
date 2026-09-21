import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { EmojiGrid, STEP_EMOJIS } from '../components/EmojiGrid'
import { Sheet } from '../components/Sheet'
import { WEEKDAYS } from '../dates'
import { useStepsById, useStore } from '../store'
import type { Weekday } from '../types'
import { dayIds } from '../week'

type DragState = {
  pointerId: number
  from: number
  to: number
  startY: number
  dy: number
  heights: number[]
}

function targetIndex(from: number, dy: number, heights: number[]): number {
  const mids: number[] = []
  let top = 0
  for (const h of heights) {
    mids.push(top + h / 2)
    top += h
  }
  const draggedMid = mids[from] + dy
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < mids.length; i++) {
    const dist = Math.abs(mids[i] - draggedMid)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

function rowShift(index: number, drag: DragState): number {
  const { from, to, dy, heights } = drag
  if (index === from) return dy
  if (from < to && index > from && index <= to) return -heights[from]
  if (from > to && index >= to && index < from) return heights[from]
  return 0
}

export function PlanScreen({ onBack }: { onBack: () => void }) {
  const {
    state,
    addStep,
    addStepToDays,
    removeStepFromDay,
    setDayNote,
    reorderDay,
    copyDay,
    removeStep,
    updateStep,
  } = useStore()
  const byId = useStepsById()
  const today = new Date().getDay() as Weekday
  const [day, setDay] = useState<Weekday>(today)
  const [addOpen, setAddOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTargets, setCopyTargets] = useState<Weekday[]>([])
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [newNote, setNewNote] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [applyDays, setApplyDays] = useState<Weekday[]>([day])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('✨')
  const [noteStepId, setNoteStepId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [drag, setDrag] = useState<DragState | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const dragging = drag !== null

  const items = state.week[day]
  const ids = dayIds(items)
  const unused = useMemo(
    () => state.steps.filter((s) => !ids.includes(s.id)),
    [state.steps, ids],
  )
  const label = WEEKDAYS.find((d) => d.id === day)?.full ?? ''
  const noteStep = noteStepId ? byId[noteStepId] : undefined

  function toggleDay(list: Weekday[], id: Weekday): Weekday[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  function submitAdd() {
    const name = newName.trim()
    if (!name) return
    const step = addStep(name, newEmoji)
    addStepToDays(step.id, applyDays.length ? applyDays : [day], newNote)
    setNewName('')
    setNewNote('')
    setAddOpen(false)
  }

  function addPicked() {
    for (const id of picked) addStepToDays(id, applyDays.length ? applyDays : [day], newNote)
    setPicked([])
    setNewNote('')
    setAddOpen(false)
  }

  function saveEdit() {
    if (!editId || !editName.trim()) return
    updateStep(editId, { name: editName.trim(), emoji: editEmoji })
    setEditId(null)
  }

  function saveNote() {
    if (!noteStepId) return
    setDayNote(day, noteStepId, noteDraft)
    setNoteStepId(null)
  }

  useEffect(() => {
    dragRef.current = null
    setDrag(null)
  }, [day])

  useEffect(() => {
    if (!dragging) return
    const overlay = document.querySelector('.plan-overlay')
    overlay?.classList.add('sorting')
    document.body.classList.add('sorting')

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current
      if (!current || event.pointerId !== current.pointerId) return
      const dy = event.clientY - current.startY
      const next = { ...current, dy, to: targetIndex(current.from, dy, current.heights) }
      dragRef.current = next
      setDrag(next)
    }

    const onUp = (event: PointerEvent) => {
      const current = dragRef.current
      if (!current || event.pointerId !== current.pointerId) return
      if (current.from !== current.to) reorderDay(day, current.from, current.to)
      dragRef.current = null
      setDrag(null)
    }

    const prevent = (event: TouchEvent) => event.preventDefault()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      overlay?.classList.remove('sorting')
      document.body.classList.remove('sorting')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('touchmove', prevent)
    }
  }, [dragging, day, reorderDay])

  function startDrag(index: number, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || items.length < 2) return
    const list = listRef.current
    if (!list) return
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-sort-row]'))
    const heights = rows.map((row) => row.getBoundingClientRect().height)
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* capture is optional */
    }
    const next: DragState = {
      pointerId: event.pointerId,
      from: index,
      to: index,
      startY: event.clientY,
      dy: 0,
      heights,
    }
    dragRef.current = next
    setDrag(next)
  }

  return (
    <section className="screen">
      <div className="row-between">
        <p className="kicker">Weekly template</p>
        <button className="pill" onClick={onBack}>
          Done
        </button>
      </div>
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

      {items.length === 0 ? (
        <div className="empty card">
          <h3>Empty {label}</h3>
          <p>Add steps for this day. You can reuse them across the week.</p>
        </div>
      ) : (
        <div className={`group ${drag ? 'sorting' : ''}`} ref={listRef}>
          {items.map((item, index) => {
            const step = byId[item.stepId]
            if (!step) return null
            const shift = drag ? rowShift(index, drag) : 0
            return (
              <div
                key={item.stepId}
                className={`group-row ${drag?.from === index ? 'dragging' : ''}`}
                data-sort-row
                style={shift ? { transform: `translateY(${shift}px)` } : undefined}
              >
                <span className="emoji">{step.emoji}</span>
                <button
                  className="grow"
                  style={{ textAlign: 'left' }}
                  onClick={() => {
                    if (drag) return
                    setNoteStepId(item.stepId)
                    setNoteDraft(item.note)
                  }}
                >
                  <div className="row-title">{step.name}</div>
                  <div className={`row-sub ${item.note ? '' : 'placeholder'}`}>
                    {item.note || 'Add a note for this day'}
                  </div>
                </button>
                <button
                  className="drag-handle"
                  type="button"
                  aria-label="Drag to reorder"
                  onPointerDown={(event) => startDrag(index, event)}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <circle cx="5" cy="3.5" r="1.15" />
                    <circle cx="11" cy="3.5" r="1.15" />
                    <circle cx="5" cy="8" r="1.15" />
                    <circle cx="11" cy="8" r="1.15" />
                    <circle cx="5" cy="12.5" r="1.15" />
                    <circle cx="11" cy="12.5" r="1.15" />
                  </svg>
                </button>
                <div className="tiny-btns">
                  <button onClick={() => removeStepFromDay(day, item.stepId)} aria-label="Remove">
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
          <label>Note for these days</label>
          <textarea
            value={newNote}
            placeholder="e.g. retinol + moisturizer"
            onChange={(e) => setNewNote(e.target.value)}
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

      <Sheet open={!!editId} title="Edit step" onClose={() => setEditId(null)}>
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

      <Sheet
        open={!!noteStepId}
        title={noteStep ? `${noteStep.emoji} ${noteStep.name}` : 'Note'}
        onClose={() => setNoteStepId(null)}
      >
        <p className="hint">Only for {label}. Other days keep their own notes.</p>
        <div className="field">
          <label>Note</label>
          <textarea
            value={noteDraft}
            placeholder="e.g. cleanser, vitamin C, moisturizer"
            onChange={(e) => setNoteDraft(e.target.value)}
          />
        </div>
        <button className="primary" onClick={saveNote}>
          Save note
        </button>
      </Sheet>

      <Sheet open={copyOpen} title={`Copy ${label}`} onClose={() => setCopyOpen(false)}>
        <p className="hint">Replace the selected days with this day’s steps and notes.</p>
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
