import { useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { lastPeriodStart, pillPhase } from '../cycle'
import {
  WEEKDAYS,
  formatMonthYear,
  formatShortDate,
  monthCells,
  shiftMonth,
  todayISO,
} from '../dates'
import { useStore } from '../store'

const PRESETS = [
  { label: '21 + 7', activeDays: 21, breakDays: 7 },
  { label: '24 + 4', activeDays: 24, breakDays: 4 },
  { label: '28', activeDays: 28, breakDays: 0 },
]

export function CycleScreen() {
  const {
    state,
    setPillConfig,
    startPack,
    togglePeriod,
    toggleSex,
    togglePillTaken,
  } = useStore()
  const today = todayISO()
  const [month, setMonth] = useState(today)
  const [picked, setPicked] = useState<string | null>(null)
  const [setup, setSetup] = useState(!state.pill.startDate)
  const [startDraft, setStartDraft] = useState(state.pill.startDate || today)

  const cells = useMemo(() => monthCells(month), [month])
  const todayPhase = pillPhase(state.pill, today)
  const pickedPhase = picked ? pillPhase(state.pill, picked) : null
  const periodStart = lastPeriodStart(state.periodDays, today)
  const takenToday = !!state.pillsTaken[today]

  return (
    <section className="screen">
      <div className="row-between">
        <p className="kicker">Body</p>
        <button className="icon-btn" onClick={() => setSetup(true)} aria-label="Pill settings">
          💊
        </button>
      </div>
      <h1 className="serif-title">Cycle</h1>

      {todayPhase.kind === 'unset' && (
        <button className="card cycle-status" onClick={() => setSetup(true)}>
          <strong>Set your pack</strong>
          <span className="muted">Log the day you started this blister to know when it ends.</span>
        </button>
      )}
      {todayPhase.kind === 'before' && (
        <div className="card cycle-status">
          <strong>Pack starts {formatShortDate(todayPhase.packStart)}</strong>
        </div>
      )}
      {todayPhase.kind === 'active' && (
        <button className="card cycle-status" onClick={() => togglePillTaken(today)}>
          <strong>{takenToday ? 'Pill taken' : 'Take your pill'}</strong>
          <span className="muted">
            Day {todayPhase.day} of {todayPhase.of}
            {' · '}pack ends {formatShortDate(todayPhase.packEnd)}
            {' · '}next {formatShortDate(todayPhase.nextStart)}
          </span>
        </button>
      )}
      {todayPhase.kind === 'break' && (
        <div className="card cycle-status">
          <strong>Break day {todayPhase.day} of {todayPhase.of}</strong>
          <span className="muted">Next pack {formatShortDate(todayPhase.nextStart)}</span>
        </div>
      )}

      {periodStart && (
        <p className="hint">Last period started {formatShortDate(periodStart)}</p>
      )}

      <div className="row-between" style={{ margin: '8px 0 10px' }}>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <span className="cycle-month">{formatMonthYear(month)}</span>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cycle-cal">
        {WEEKDAYS.map((d) => (
          <span key={d.id} className="cycle-dow">
            {d.short}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />
          const phase = pillPhase(state.pill, date)
          const period = !!state.periodDays[date]
          const sex = !!state.sexDays[date]
          const taken = !!state.pillsTaken[date]
          const isToday = date === today
          return (
            <button
              key={date}
              className={`cycle-day${isToday ? ' today' : ''}${period ? ' period' : ''}${phase.kind === 'break' ? ' break' : ''}`}
              onClick={() => setPicked(date)}
            >
              <span>{Number(date.slice(8))}</span>
              <span className="cycle-dots">
                {phase.kind === 'active' && <i className={`dot gold ${taken ? 'on' : ''}`} />}
                {sex && <i className="dot sex on" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="cycle-legend">
        <span>
          <i className="dot gold on" /> Pill
        </span>
        <span>
          <i className="swatch" style={{ background: 'rgba(224, 122, 122, 0.55)' }} /> Period
        </span>
        <span>
          <i className="dot sex on" /> Sex
        </span>
      </div>

      <Sheet
        open={!!picked}
        title={picked ? formatShortDate(picked) : 'Day'}
        onClose={() => setPicked(null)}
      >
        {picked && pickedPhase && (
          <>
            {pickedPhase.kind === 'active' && (
              <p className="hint">
                Pill day {pickedPhase.day}/{pickedPhase.of}. Pack ends{' '}
                {formatShortDate(pickedPhase.packEnd)}.
              </p>
            )}
            {pickedPhase.kind === 'break' && (
              <p className="hint">
                Break day {pickedPhase.day}/{pickedPhase.of}. Next pack{' '}
                {formatShortDate(pickedPhase.nextStart)}.
              </p>
            )}
            <div className="group">
              <button className="group-row" onClick={() => togglePeriod(picked)}>
                <span className={`check ${state.periodDays[picked] ? 'on' : ''}`}>
                  {state.periodDays[picked] ? '✓' : ''}
                </span>
                <span className="grow row-title">Period</span>
              </button>
              <button className="group-row" onClick={() => toggleSex(picked)}>
                <span className={`check ${state.sexDays[picked] ? 'on' : ''}`}>
                  {state.sexDays[picked] ? '✓' : ''}
                </span>
                <span className="grow row-title">Sex</span>
              </button>
              {(pickedPhase.kind === 'active' || state.pillsTaken[picked]) && (
                <button className="group-row" onClick={() => togglePillTaken(picked)}>
                  <span className={`check ${state.pillsTaken[picked] ? 'on' : ''}`}>
                    {state.pillsTaken[picked] ? '✓' : ''}
                  </span>
                  <span className="grow row-title">Took the pill</span>
                </button>
              )}
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={setup} title="Pill pack" onClose={() => setSetup(false)}>
        <p className="hint">
          Set the first day of this blister. The app then counts when it ends and when the next one
          starts.
        </p>
        <div className="field">
          <label>Started this pack on</label>
          <input type="date" value={startDraft} onChange={(e) => setStartDraft(e.target.value)} />
        </div>
        <div className="field">
          <label>Schedule</label>
          <div className="day-copy">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`pill ${state.pill.activeDays === p.activeDays && state.pill.breakDays === p.breakDays ? 'on' : ''}`}
                onClick={() => setPillConfig({ activeDays: p.activeDays, breakDays: p.breakDays })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Active days</label>
          <input
            inputMode="numeric"
            value={String(state.pill.activeDays)}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n > 0) setPillConfig({ activeDays: n })
            }}
          />
        </div>
        <div className="field">
          <label>Break days</label>
          <input
            inputMode="numeric"
            value={String(state.pill.breakDays)}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n >= 0) setPillConfig({ breakDays: n })
            }}
          />
        </div>
        <button
          className="primary"
          onClick={() => {
            startPack(startDraft || today)
            setSetup(false)
          }}
        >
          Save pack
        </button>
        <button
          className="ghost"
          onClick={() => {
            startPack(today)
            setStartDraft(today)
            setSetup(false)
          }}
        >
          I started a new pack today
        </button>
      </Sheet>
    </section>
  )
}
