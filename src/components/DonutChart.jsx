function ring(cx, cy, r, pct, color, strokeWidth = 10) {
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={`${dash} ${circ}`}
      strokeDashoffset={circ / 4}  // start at top
      strokeLinecap="round"
      style={{ transition: 'stroke-dasharray 0.8s ease' }}
    />
  )
}

export default function DonutChart({ piPct, clPct, size = 180 }) {
  const cx = size / 2, cy = size / 2
  const outerR = size / 2 - 12
  const innerR = outerR - 14

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          {/* Track rings */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--gray-100)" strokeWidth={10} />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--gray-100)" strokeWidth={10} />
          {/* Data rings */}
          {ring(cx, cy, outerR, piPct, 'var(--blue)')}
          {ring(cx, cy, innerR, clPct, 'var(--purple)')}
        </svg>
        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {Math.round((piPct + clPct) / 2)}%
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>avg</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {[
          { label: 'PriceInfo', pct: piPct, color: 'var(--blue)' },
          { label: 'CardList',  pct: clPct, color: 'var(--purple)' },
        ].map(({ label, pct, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color, marginLeft: 'auto' }}>{pct}%</span>
            </div>
            <div style={{ width: 140, height: 4, background: 'var(--gray-100)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
