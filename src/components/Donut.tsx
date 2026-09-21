function polar(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

export function Donut({
  slices,
}: {
  slices: Array<{ amount: number; color: string; name: string }>
}) {
  const total = slices.reduce((a, s) => a + s.amount, 0)
  if (!total) {
    return (
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="36" fill="none" stroke="#2a2a2e" strokeWidth="16" />
      </svg>
    )
  }
  if (slices.length === 1) {
    return (
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="36" fill="none" stroke={slices[0].color} strokeWidth="16" />
      </svg>
    )
  }
  let angle = 0
  const paths = slices.map((s) => {
    const sweep = Math.min((s.amount / total) * 360, 359.99)
    const start = angle
    const end = angle + sweep
    angle = end
    const large = sweep > 180 ? 1 : 0
    const [x1, y1] = polar(55, 55, 36, start)
    const [x2, y2] = polar(55, 55, 36, end)
    return (
      <path
        key={s.name + start}
        d={`M ${x1} ${y1} A 36 36 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={s.color}
        strokeWidth="16"
      />
    )
  })
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      {paths}
    </svg>
  )
}
