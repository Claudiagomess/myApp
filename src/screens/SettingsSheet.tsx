import { useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { useStore } from '../store'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL', 'CHF']

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state, setCurrency, exportJson, importJson, resetAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup saved.')
  }

  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <p className="hint">
        Everything lives on this device. Export a backup if you also use another phone or
        computer.
      </p>
      <div className="field">
        <label>Currency</label>
        <select value={state.settings.currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button className="primary" onClick={download}>
        Export backup
      </button>
      <button className="ghost" onClick={() => fileRef.current?.click()}>
        Import backup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            importJson(await file.text())
            setMsg('Backup restored.')
          } catch {
            setMsg('Could not read that file.')
          }
        }}
      />
      <button
        className="ghost danger"
        onClick={() => {
          if (confirm('Reset all routines and money data?')) {
            resetAll()
            setMsg('Reset complete.')
          }
        }}
      >
        Reset everything
      </button>
      {msg ? <p className="hint">{msg}</p> : null}
    </Sheet>
  )
}
