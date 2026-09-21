export const STEP_EMOJIS = [
  '🪥', '✨', '🏋️', '💥', '🤸', '🏃', '💧', '📖',
  '🧘', '🥗', '😴', '☀️', '🚿', '💊', '🧠', '🧹',
  '🎵', '✍️', '🧊', '🔥', '🧺', '🥤', '🍎', '🛏️',
]

export const CATEGORY_EMOJIS = [
  '🍽️', '🚗', '🏠', '💊', '🛍️', '🎬', '📄', '📦',
  '💼', '💻', '🎁', '📈', '☕', '✈️', '🎮', '🐕',
]

export function EmojiGrid({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (emoji: string) => void
}) {
  return (
    <div className="emoji-grid">
      {options.map((e) => (
        <button
          key={e}
          type="button"
          className={value === e ? 'on' : ''}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
