export function ProgressRing({
  value,
  size = 72,
}: {
  value: number
  size?: number
}) {
  const pct = Math.max(0, Math.min(1, value))
  const r = 28
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#2a2a2e" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#e8b86d"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        fill="#f4f1ea"
        fontSize="15"
        fontWeight="700"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}
