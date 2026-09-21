import { useMemo, useState } from 'react'
import { Donut } from '../components/Donut'
import { lastNDates, monthKey, todayISO } from '../dates'
import { formatMoney } from '../format'
import { useCategoriesById, useStore } from '../store'
import {
  categorySpend,
  currentStreak,
  heatValues,
  lastMonths,
  monthTotals,
  rangeRate,
  stepRates,
} from '../stats'

function heatColor(pct: number): string {
  if (pct <= 0) return '#2a2a2e'
  if (pct < 0.34) return '#3d3424'
  if (pct < 0.67) return '#8a6a38'
  if (pct < 1) return '#c49a4d'
  return '#e8b86d'
}

export function StatsScreen() {
  const { state } = useStore()
  const cats = useCategoriesById()
  const [mode, setMode] = useState<'routine' | 'money'>('routine')
  const month = monthKey(todayISO())

  const routine = useMemo(() => {
    const week = lastNDates(7)
    const monthDates = lastNDates(30)
    return {
      streak: currentStreak(state),
      week: rangeRate(state, week),
      month: rangeRate(state, monthDates),
      heat: heatValues(state, 16),
      steps: stepRates(state, monthDates),
    }
  }, [state])

  const money = useMemo(() => {
    const months = lastMonths(6)
    const bars = months.map((key) => ({
      key,
      label: key.slice(5),
      ...monthTotals(state, key),
    }))
    const max = Math.max(1, ...bars.flatMap((b) => [b.income, b.expense]))
    return {
      bars,
      max,
      slices: categorySpend(state, month, cats),
      month: monthTotals(state, month),
    }
  }, [state, cats, month])

  return (
    <section className="screen">
      <p className="kicker">Patterns</p>
      <h1 className="serif-title">Stats</h1>
      <div className="seg">
        <button className={mode === 'routine' ? 'on' : ''} onClick={() => setMode('routine')}>
          Routine
        </button>
        <button className={mode === 'money' ? 'on' : ''} onClick={() => setMode('money')}>
          Money
        </button>
      </div>

      {mode === 'routine' ? (
        <>
          <div className="stats-grid">
            <div className="card stat">
              <span className="muted">Streak</span>
              <b>{routine.streak}d</b>
            </div>
            <div className="card stat">
              <span className="muted">This week</span>
              <b>{Math.round(routine.week * 100)}%</b>
            </div>
            <div className="card stat">
              <span className="muted">Last 30 days</span>
              <b>{Math.round(routine.month * 100)}%</b>
            </div>
            <div className="card stat">
              <span className="muted">Steps tracked</span>
              <b>{state.steps.length}</b>
            </div>
          </div>

          <p className="section-label">Last 16 weeks</p>
          <div className="card heat" title="Each square is a day">
            {routine.heat.map((pct, i) => (
              <i key={i} style={{ background: heatColor(pct) }} />
            ))}
          </div>

          <p className="section-label">By step · 30 days</p>
          {routine.steps.length === 0 ? (
            <div className="empty card">
              <h3>No history yet</h3>
              <p>Complete steps on Today and they will land here.</p>
            </div>
          ) : (
            <div className="group">
              {routine.steps.map((row) => (
                <div key={row.step.id} className="group-row">
                  <span className="emoji">{row.step.emoji}</span>
                  <span className="grow">
                    <div className="row-title">{row.step.name}</div>
                    <div className="row-sub">
                      {row.done}/{row.total} times
                    </div>
                  </span>
                  <b>{Math.round(row.pct * 100)}%</b>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat">
              <span className="muted">In this month</span>
              <b className="amount-pos">{formatMoney(money.month.income, state.settings.currency)}</b>
            </div>
            <div className="card stat">
              <span className="muted">Out this month</span>
              <b className="amount-neg">{formatMoney(money.month.expense, state.settings.currency)}</b>
            </div>
          </div>

          <p className="section-label">Last 6 months</p>
          <div className="card">
            <div className="bars">
              {money.bars.map((b) => (
                <div key={b.key} className="bar-col">
                  <div className="bar-pair">
                    <div
                      className="bar income"
                      style={{ height: `${(b.income / money.max) * 100}%` }}
                    />
                    <div
                      className="bar expense"
                      style={{ height: `${(b.expense / money.max) * 100}%` }}
                    />
                  </div>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
            <div className="legend">
              <span>
                <i className="swatch" style={{ background: 'var(--green)' }} />
                Income
              </span>
              <span>
                <i className="swatch" style={{ background: 'var(--red)' }} />
                Expenses
              </span>
            </div>
          </div>

          <p className="section-label">Spending this month</p>
          {money.slices.length === 0 ? (
            <div className="empty card">
              <h3>No expenses yet</h3>
              <p>Add a few on Money and the split will show here.</p>
            </div>
          ) : (
            <div className="card donut-wrap">
              <Donut slices={money.slices} />
              <div className="donut-legend">
                {money.slices.slice(0, 6).map((s) => (
                  <div key={s.name}>
                    <span>
                      {s.emoji} {s.name}
                    </span>
                    <span>{formatMoney(s.amount, state.settings.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
