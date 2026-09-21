import { formatShortDate } from '../dates'
import type { PillPhase } from '../cycle'

export function PillBanner({
  taken,
  phase,
  onToggle,
}: {
  taken: boolean
  phase: Extract<PillPhase, { kind: 'active' }>
  onToggle: () => void
}) {
  return (
    <button
      className={`card cycle-status ${taken ? 'taken' : 'due'}`}
      onClick={onToggle}
      aria-pressed={taken}
    >
      <span className={`cycle-check ${taken ? 'on' : ''}`}>{taken ? '✓' : ''}</span>
      <span className="grow">
        <strong>{taken ? 'Taken today' : 'Take your pill'}</strong>
        <span className="muted">
          Day {phase.day} of {phase.of} · pack ends {formatShortDate(phase.packEnd)}
        </span>
      </span>
    </button>
  )
}
