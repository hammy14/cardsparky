import { useState, useEffect, useCallback } from 'react'
import { SkeletonKpis, SkeletonTable, AnimatedKpiCard } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import DonutChart from '../../components/DonutChart'

function fnum(n) { return Number(n ?? 0).toLocaleString() }

function pctColor(pct) {
  return pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)'
}

function PctPill({ pct }) {
  const color = pctColor(pct)
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
      {pct}%
    </span>
  )
}

function MiniBar({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <PctPill pct={pct} />
    </div>
  )
}

function rowHealth(piPct, clPct) {
  const avg = (piPct + clPct) / 2
  if (avg >= 80) return 'rgba(72,187,120,0.06)'
  if (avg >= 50) return 'rgba(224,92,75,0.06)'
  return 'rgba(229,62,62,0.06)'
}

export default function SetCompletionTracker() {
  const [combined, setCombined] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')
  const [sortCol, setSortCol]   = useState('piPct')
  const [sortDir, setSortDir]   = useState('desc')

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('http://localhost:3001/api/analysis/priceinfo').then(r => r.json()),
      fetch('http://localhost:3001/api/analysis/cardlist').then(r => r.json()),
    ])
      .then(([pi, cl]) => {
        if (pi.error) throw new Error(pi.error)
        if (cl.error) throw new Error(cl.error)
        const merged = pi.map(p => {
          const c = cl.find(x => x.key === p.key) ?? {}
          return { key: p.key, label: p.label, icon: p.icon, error: p.error,
            total: p.total, piPct: p.pct, clPct: c.pct ?? 0 }
        })
        setCombined(merged)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const filtered = combined.filter(r => r.label.toLowerCase().includes(search.toLowerCase()))

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const totals = combined.reduce((acc, r) => ({ total: acc.total + r.total }), { total: 0 })
  const overallPi = combined.length ? Math.round(combined.reduce((a, r) => a + r.piPct, 0) / combined.length) : 0
  const overallCl = combined.length ? Math.round(combined.reduce((a, r) => a + r.clPct, 0) / combined.length) : 0

  // Top 5 by PriceInfo for the chart
  const top5 = [...combined].sort((a, b) => b.piPct - a.piPct).slice(0, 5)
  const SortTh = ({ col, label, style = {} }) => (
    <th className="sortable" style={style} onClick={() => handleSort(col)}>
      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  )

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {loading ? <SkeletonKpis count={4} /> : (
        <div className="kpi-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <AnimatedKpiCard label="Total Sets"      rawValue={totals.total}    accent="var(--blue)" />
          <AnimatedKpiCard label="Avg PriceInfo %" rawValue={overallPi}       accent="var(--green)"  suffix="%" />
          <AnimatedKpiCard label="Avg CardList %"  rawValue={overallCl}       accent="var(--purple)" suffix="%" />
          <AnimatedKpiCard label="Sports Tracked"  rawValue={combined.length} accent="var(--orange)" />
        </div>
      )}

      {/* Donut chart */}
      {!loading && (
        <div className="opp-section" style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-md)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Overall Completion</div>
          <DonutChart piPct={overallPi} clPct={overallCl} />
        </div>
      )}

      {/* Combined table */}
      <div className="opp-section">
        <div className="opp-toolbar-sticky">
          <input
            className="opp-search"
            placeholder="Search sports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={fetchData}>🔄 Refresh</button>
        </div>
        <div className="opp-table-wrap" style={{ maxHeight: '65vh' }}>
          {loading ? <SkeletonTable rows={10} cols={4} /> : sorted.length === 0 ? (
            <EmptyState icon="🏅" title="No sports found" message={search ? `No results for "${search}"` : 'No data returned from databases.'} />
          ) : (
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <th style={{ minWidth: 160 }}>Sport</th>
                  <SortTh col="total" label="Total Sets" style={{ textAlign: 'right' }} />
                  <SortTh col="piPct" label="PriceInfo %" style={{ minWidth: 160 }} />
                  <SortTh col="clPct" label="CardList %"  style={{ minWidth: 160 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => (
                  <tr key={row.key} style={{ background: rowHealth(row.piPct, row.clPct), opacity: row.error ? 0.4 : 1 }}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ marginRight: '0.5rem' }}>{row.icon}</span>
                      {row.label}
                      {row.error && <span className="badge" style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--red)', marginLeft: '0.5rem', fontSize: '0.7rem' }}>Error</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{fnum(row.total)}</td>
                    <td><MiniBar pct={row.piPct} color="var(--blue)" /></td>
                    <td><MiniBar pct={row.clPct} color="var(--purple)" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                  <td>Totals / Avg</td>
                  <td style={{ textAlign: 'right' }}>{fnum(totals.total)}</td>
                  <td><MiniBar pct={overallPi} color="var(--blue)" /></td>
                  <td><MiniBar pct={overallCl} color="var(--purple)" /></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
