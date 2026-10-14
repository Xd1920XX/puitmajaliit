import { useMemo } from 'react'

// Pure-CSS confetti burst. 40 pieces, each with randomized color, delay,
// drift and rotation computed once on mount. GPU-friendly transforms.
const COLORS = ['#2e6347', '#ff9c00', '#fbecc7', '#1d4432', '#f0dca8', '#ffffff']

export default function Confetti({ count = 40 }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length]
      const left = Math.random() * 100
      const delay = Math.random() * 0.25
      const duration = 1.4 + Math.random() * 0.9
      const drift = (Math.random() - 0.5) * 60
      const rot = Math.random() * 540 - 270
      const size = 6 + Math.random() * 6
      return { color, left, delay, duration, drift, rot, size, i }
    })
  }, [count])

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: `${p.size}px`,
            height: `${p.size * 0.4}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
