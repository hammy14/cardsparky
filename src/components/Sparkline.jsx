export default function Sparkline({ values = [], width = 80, height = 28, color = 'var(--blue)' }) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => [
    i * step,
    height - ((v - min) / range) * (height - 4) - 2
  ])

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${path} L${points[points.length - 1][0]},${height} L0,${height} Z`

  const last = values[values.length - 1]
  const first = values[0]
  const trend = last > first ? '↑' : last < first ? '↓' : '→'
  const trendColor = last > first ? 'var(--green)' : last < first ? 'var(--red)' : 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${color.replace(/[^a-z]/gi, '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: trendColor }}>{trend}</span>
    </div>
  )
}
