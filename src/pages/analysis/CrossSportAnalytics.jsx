import { useState, useEffect, useCallback } from 'react'
import { SkeletonKpis, SkeletonTable, AnimatedKpiCard } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'

function fnum(n) { return Number(n ?? 0).toLocaleString() }
function fcur(n) { return '$' + Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) }

export default function CrossSportAnalytics() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [sortCol, setSortCol] = useState('totalSets')
  const [sortDir, setSortDir] = useState('desc')
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch('http://localhost:3001/api/analysis/crosssport')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLastUpdated(new Date())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sorted = [...data].sort((a, b) => {
    const av = isNaN(a[sortCol]) ? (a[sortCol] ?? '') : Number(a[sortCol])
    const bv = isNaN(b[sortCol]) ? (b[sortCol] ?? '') : Number(b[sortCol])
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const totals = data.reduce((acc, r) => ({
    totalSets:      acc.totalSets      + r.totalSets,
    totalCards:     acc.totalCards     + r.totalCards,
    totalValue:     acc.totalValue     + r.totalValue,
    cardListCount:  acc.cardListCount  + r.cardListCount,
  }), { totalSets: 0, totalCards: 0, totalValue: 0, cardListCount: 0 })

  const maxSets   = Math.max(...data.map(r => r.totalSets), 1)
  const maxCards  = Math.max(...data.map(r => r.totalCards), 1)
  const maxValue  = Math.max(...data.map(r => r.totalValue), 1)

  function SortTh({ col, label, style = {} }) {
    return (
      <th className="sortable" style={style} onClick={() => handleSort(col)}>
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </th>
    )
  }

  function Bar({ value, max, color = 'var(--blue)' }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 50, textAlign: 'right' }}>{fnum(value)}</span>
      </div>
    )
  }

  if (error)   return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {loading ? <SkeletonKpis count={5} /> : (
        <div className="kpi-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <AnimatedKpiCard label="Total Sports"  rawValue={data.length}          accent="var(--blue)"   sparkline={data.map(r => r.totalSets).slice(0,8)} />
          <AnimatedKpiCard label="Total Sets"    rawValue={totals.totalSets}      accent="var(--purple)" sparkline={[...data].sort((a,b)=>a.label.localeCompare(b.label)).map(r=>r.totalSets)} />
          <AnimatedKpiCard label="Total Cards"   rawValue={totals.totalCards}     accent="var(--green)"  sparkline={[...data].sort((a,b)=>a.label.localeCompare(b.label)).map(r=>r.totalCards)} />
          <AnimatedKpiCard label="Total Value"   rawValue={totals.totalValue}     accent="var(--orange)" sparkline={[...data].sort((a,b)=>a.label.localeCompare(b.label)).map(r=>r.totalValue)} isFloat />
          <AnimatedKpiCard label="Card Lists"    rawValue={totals.cardListCount}  accent="var(--blue)"   sparkline={[...data].sort((a,b)=>a.label.localeCompare(b.label)).map(r=>r.cardListCount)} />
        </div>
      )}

      {/* Toolbar */}
      <div className="opp-section" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="opp-toolbar-sticky">
          <div style={{ flex: 1 }} />
          {lastUpdated && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>}
          <button className="icon-btn" onClick={fetchData}>🔄 Refresh</button>
        </div>

        {/* Table */}
        <div className="opp-table-wrap" style={{ maxHeight: '70vh' }}>
          {loading ? <SkeletonTable rows={10} cols={5} /> : sorted.length === 0 ? (
            <EmptyState icon="🏅" title="No sport data found" message="No databases returned results. Check your server connection." />
          ) : (
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <th style={{ minWidth: 160 }}>Sport</th>
                  <SortTh col="totalSets"     label="Total Sets"     style={{ minWidth: 180 }} />
                  <SortTh col="totalCards"    label="Total Cards"    style={{ minWidth: 180 }} />
                  <SortTh col="totalValue"    label="Total Value"    style={{ textAlign: 'right' }} />
                  <SortTh col="cardListCount" label="Card Lists"     style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => (
                  <tr key={row.key} style={{ opacity: row.error ? 0.4 : 1 }}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ marginRight: '0.5rem' }}>{row.icon}</span>
                      {row.label}
                      {row.error && <span className="badge" style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--red)', marginLeft: '0.5rem', fontSize: '0.7rem' }}>Error</span>}
                    </td>
                    <td><Bar value={row.totalSets}  max={maxSets}  color="var(--blue)" /></td>
                    <td><Bar value={row.totalCards} max={maxCards} color="var(--green)" /></td>
                    <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 500 }}>{fcur(row.totalValue)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(row.cardListCount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                  <td>Totals</td>
                  <td><span style={{ fontSize: '0.85rem' }}>{fnum(totals.totalSets)}</span></td>
                  <td><span style={{ fontSize: '0.85rem' }}>{fnum(totals.totalCards)}</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--green)' }}>{fcur(totals.totalValue)}</td>
                  <td style={{ textAlign: 'right' }}>{fnum(totals.cardListCount)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
