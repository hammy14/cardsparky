import useCountUp from '../hooks/useCountUp'
import Sparkline from './Sparkline'

export function SkeletonKpis({ count = 4 }) {
  return (
    <div className="skeleton-kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-kpi" />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 8, cols = 4 }) {
  const widths = ['40%', '20%', '25%', '15%', '30%', '22%', '18%', '28%']
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton skeleton-cell"
              style={{ flex: j === 0 ? 2 : 1, opacity: 1 - i * 0.07, width: widths[(i + j) % widths.length] }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Animated KPI card — counts up when value changes
export function AnimatedKpiCard({ label, rawValue, prefix = '', suffix = '', accent, isFloat = false, sparkline }) {
  const counted = useCountUp(isFloat ? Math.round(rawValue) : rawValue)
  const display = prefix + (isFloat
    ? '$' + Number(rawValue).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : suffix ? `${counted}${suffix}` : counted.toLocaleString())
  return (
    <div className="kpi-card">
      <div className="kpi-accent" style={{ background: accent }} />
      <div className="kpi-content" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="kpi-value">{display}</span>
          {sparkline && <Sparkline values={sparkline} color={accent} />}
        </div>
        <span className="kpi-label">{label}</span>
      </div>
    </div>
  )
}
