import { useMemo, useState } from 'react'
import { CATEGORY_EMOJIS, EmojiGrid } from '../components/EmojiGrid'
import { Sheet } from '../components/Sheet'
import { formatShortDate, monthKey, todayISO } from '../dates'
import { formatMoney } from '../format'
import { everyLabel, occurrencesInMonth, recurringAmountInMonth, REPEAT_OPTIONS } from '../recurrences'
import { categoryOptions, useCategoriesById, useStore } from '../store'
import type { CategoryKind, RecurEvery, Recurring, Transaction } from '../types'
import { monthTotals } from '../stats'

const emptyForm = {
  kind: 'expense' as CategoryKind,
  amount: '',
  categoryId: '',
  note: '',
  date: todayISO(),
  every: 'once' as RecurEvery | 'once',
}

export function MoneyScreen() {
  const {
    state,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addRecurring,
    updateRecurring,
    removeRecurring,
    addCategory,
  } = useStore()
  const cats = useCategoriesById()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editingRecurring, setEditingRecurring] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState<'all' | CategoryKind>('all')
  const [catOpen, setCatOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catEmoji, setCatEmoji] = useState('📦')
  const [catKind, setCatKind] = useState<CategoryKind>('expense')

  const month = monthKey(todayISO())
  const totals = monthTotals(state, month)
  const income = totals.income
  const expense = totals.expense
  const rules = state.recurring ?? []

  const visibleRules = useMemo(() => {
    const list = filter === 'all' ? rules : rules.filter((r) => r.kind === filter)
    return [...list].sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [rules, filter])

  const visible = useMemo(() => {
    const list =
      filter === 'all' ? state.transactions : state.transactions.filter((t) => t.kind === filter)
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [state.transactions, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of visible) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return [...map.entries()]
  }, [visible])

  function openNew() {
    const kind = filter === 'income' ? 'income' : 'expense'
    const options = categoryOptions(state.categories, kind)
    setEditing(null)
    setEditingRecurring(null)
    setForm({
      ...emptyForm,
      kind,
      date: todayISO(),
      categoryId: options[0]?.id ?? '',
    })
    setOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t.id)
    setEditingRecurring(null)
    setForm({
      kind: t.kind,
      amount: String(t.amount),
      categoryId: t.categoryId,
      note: t.note,
      date: t.date,
      every: 'once',
    })
    setOpen(true)
  }

  function openEditRecurring(rule: Recurring) {
    setEditing(null)
    setEditingRecurring(rule.id)
    setForm({
      kind: rule.kind,
      amount: String(rule.amount),
      categoryId: rule.categoryId,
      note: rule.note,
      date: rule.startDate,
      every: rule.every,
    })
    setOpen(true)
  }

  function saveTx() {
    const amount = Number(form.amount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0 || !form.categoryId) return
    if (editingRecurring) {
      if (form.every === 'once') return
      updateRecurring(editingRecurring, {
        kind: form.kind,
        amount,
        categoryId: form.categoryId,
        note: form.note.trim(),
        startDate: form.date,
        every: form.every,
      })
    } else if (editing) {
      updateTransaction(editing, {
        kind: form.kind,
        amount,
        categoryId: form.categoryId,
        note: form.note.trim(),
        date: form.date,
      })
    } else if (form.every === 'once') {
      addTransaction({
        kind: form.kind,
        amount,
        categoryId: form.categoryId,
        note: form.note.trim(),
        date: form.date,
      })
    } else {
      addRecurring({
        kind: form.kind,
        amount,
        categoryId: form.categoryId,
        note: form.note.trim(),
        every: form.every,
        startDate: form.date,
      })
    }
    setOpen(false)
  }

  const formCats = categoryOptions(state.categories, form.kind)
  const canChangeRepeat = !editing
  const sheetTitle = editingRecurring ? 'Edit repeating' : editing ? 'Edit movement' : 'New movement'

  return (
    <section className="screen">
      <p className="kicker">This month</p>
      <h1 className="serif-title">Money</h1>

      <div className="card money-hero">
        <div className="label">Net</div>
        <div className="sum">{formatMoney(income - expense, state.settings.currency)}</div>
        <div className="mini-stats">
          <div>
            <span>In</span>
            <b className="amount-pos">{formatMoney(income, state.settings.currency)}</b>
          </div>
          <div>
            <span>Out</span>
            <b className="amount-neg">{formatMoney(expense, state.settings.currency)}</b>
          </div>
        </div>
      </div>

      <div className="seg">
        {(['all', 'expense', 'income'] as const).map((id) => (
          <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
            {id === 'all' ? 'All' : id === 'expense' ? 'Expenses' : 'Income'}
          </button>
        ))}
      </div>

      {visibleRules.length > 0 && (
        <>
          <div className="section-label">Repeating</div>
          <div className="group" style={{ marginBottom: 14 }}>
            {visibleRules.map((rule) => {
              const cat = cats[rule.categoryId]
              const n = occurrencesInMonth(rule, month).length
              const monthHit = recurringAmountInMonth([rule], month)
              const monthAmount = rule.kind === 'income' ? monthHit.income : monthHit.expense
              return (
                <button key={rule.id} className="group-row" onClick={() => openEditRecurring(rule)}>
                  <span className="emoji">{cat?.emoji ?? '•'}</span>
                  <span className="grow">
                    <div className="row-title">{cat?.name ?? 'Uncategorized'}</div>
                    <div className="row-sub">
                      {everyLabel(rule.every)}
                      {n ? ` · ${n}× this month` : ''}
                      {rule.note ? ` · ${rule.note}` : ''}
                    </div>
                  </span>
                  <span className={`tx-amount ${rule.kind === 'income' ? 'amount-pos' : 'amount-neg'}`}>
                    {rule.kind === 'income' ? '+' : '−'}
                    {formatMoney(monthAmount || rule.amount, state.settings.currency)}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {grouped.length === 0 && visibleRules.length === 0 ? (
        <div className="empty card">
          <h3>No movements yet</h3>
          <p>Log a one-off, or set something to repeat every day or month.</p>
        </div>
      ) : (
        grouped.map(([date, rows]) => (
          <div key={date}>
            <div className="section-label">{formatShortDate(date)}</div>
            <div className="group" style={{ marginBottom: 10 }}>
              {rows.map((t) => {
                const cat = cats[t.categoryId]
                return (
                  <button key={t.id} className="group-row" onClick={() => openEdit(t)}>
                    <span className="emoji">{cat?.emoji ?? '•'}</span>
                    <span className="grow">
                      <div className="row-title">{cat?.name ?? 'Uncategorized'}</div>
                      {t.note ? <div className="row-sub">{t.note}</div> : null}
                    </span>
                    <span className={`tx-amount ${t.kind === 'income' ? 'amount-pos' : 'amount-neg'}`}>
                      {t.kind === 'income' ? '+' : '−'}
                      {formatMoney(t.amount, state.settings.currency)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={openNew} aria-label="Add transaction">
        +
      </button>

      <Sheet open={open} title={sheetTitle} onClose={() => setOpen(false)}>
        <div className="seg">
          {(['expense', 'income'] as const).map((id) => (
            <button
              key={id}
              className={form.kind === id ? 'on' : ''}
              onClick={() => {
                const options = categoryOptions(state.categories, id)
                setForm((f) => ({
                  ...f,
                  kind: id,
                  categoryId: options[0]?.id ?? '',
                }))
              }}
            >
              {id === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <div className="field">
          <label>Amount</label>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            {formCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        {canChangeRepeat || editingRecurring ? (
          <div className="field">
            <label>Repeat</label>
            <div className="pill-row">
              {REPEAT_OPTIONS.filter((opt) => (editingRecurring ? opt.id !== 'once' : true)).map(
                (opt) => (
                  <button
                    key={opt.id}
                    className={`pill ${form.every === opt.id ? 'on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, every: opt.id }))}
                  >
                    {opt.label}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}
        <div className="field">
          <label>{form.every === 'once' ? 'Date' : 'Starts'}</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Note</label>
          <input
            value={form.note}
            placeholder="optional"
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
        <button className="primary" onClick={saveTx}>
          Save
        </button>
        {editing && (
          <button
            className="ghost danger"
            onClick={() => {
              removeTransaction(editing)
              setOpen(false)
            }}
          >
            Delete
          </button>
        )}
        {editingRecurring && (
          <button
            className="ghost danger"
            onClick={() => {
              removeRecurring(editingRecurring)
              setOpen(false)
            }}
          >
            Stop repeating
          </button>
        )}
        <button className="ghost" onClick={() => setCatOpen(true)}>
          Manage categories
        </button>
      </Sheet>

      <Sheet open={catOpen} title="New category" onClose={() => setCatOpen(false)}>
        <div className="seg">
          {(['expense', 'income'] as const).map((id) => (
            <button key={id} className={catKind === id ? 'on' : ''} onClick={() => setCatKind(id)}>
              {id === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <div className="field">
          <label>Name</label>
          <input value={catName} onChange={(e) => setCatName(e.target.value)} />
        </div>
        <div className="field">
          <label>Icon</label>
          <EmojiGrid value={catEmoji} options={CATEGORY_EMOJIS} onChange={setCatEmoji} />
        </div>
        <button
          className="primary"
          onClick={() => {
            if (!catName.trim()) return
            addCategory({
              name: catName.trim(),
              emoji: catEmoji,
              color: catKind === 'income' ? '#7DCEA0' : '#E8A87C',
              kind: catKind,
            })
            setCatName('')
            setCatOpen(false)
          }}
        >
          Add category
        </button>
        <p className="section-label">Existing</p>
        <div className="group">
          {state.categories
            .filter((c) => c.kind === catKind)
            .map((c) => (
              <div key={c.id} className="group-row">
                <span className="emoji">{c.emoji}</span>
                <span className="grow row-title">{c.name}</span>
              </div>
            ))}
        </div>
      </Sheet>
    </section>
  )
}
