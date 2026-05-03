import { useState, useEffect, useCallback } from 'react'
import { API } from '../../config/api'

const BADGE_STYLES = {
  'New':        { background: 'rgba(2,113,235,0.15)',  color: '#0271eb' },
  'Completed':  { background: 'rgba(3,194,82,0.15)',   color: 'var(--green)' },
  'Duplicate':  { background: 'rgba(229,62,62,0.15)',  color: 'var(--red)' },
  'Pass':       { background: 'rgba(3,194,82,0.15)',   color: 'var(--green)' },
  'Fail':       { background: 'rgba(229,62,62,0.15)',  color: 'var(--red)' },
  'PassPrice':  { background: 'rgba(255,203,62,0.2)',  color: '#b45309' },
  'PassPrice0': { background: 'rgba(255,203,62,0.2)',  color: '#b45309' },
}

function fnum(n) { return Number(n).toLocaleString() }
function fcur(n) { return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }) }
function pct(a, b) { return b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '0.0%' }
function pctNum(a, b) { return b > 0 ? (a / b) * 100 : 0 }

function StatusBadge({ value }) {
  const style = BADGE_STYLES[value] ?? { background: 'var(--gray-100)', color: 'var(--text-muted)' }
  return <span className="badge" style={style}>{value ?? '—'}</span>
}

function ProgressBar({ value, max }) {
  const pctVal = pctNum(value, max)
  const color = pctVal >= 75 ? 'var(--green)' : pctVal >= 40 ? 'var(--blue)' : 'var(--orange)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pctVal}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{pct(value, max)}</span>
    </div>
  )
}

function useSortable(rows) {
  const [sort, setSort] = useState({ col: null, dir: 'asc' })
  const toggle = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))
  const sorted = sort.col ? [...rows].sort((a, b) => {
    const av = isNaN(a[sort.col]) ? a[sort.col] : Number(a[sort.col])
    const bv = isNaN(b[sort.col]) ? b[sort.col] : Number(b[sort.col])
    return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  }) : rows
  return { sorted, sort, toggle }
}

function SortTh({ col, label, sort, toggle, align = 'right' }) {
  const active = sort.col === col
  return (
    <th className="sortable" style={{ textAlign: align }} onClick={() => toggle(col)}>
      {label} {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  )
}

function BucketTable({ title, rows }) {
  const [collapsed, setCollapsed] = useState(false)
  const { sorted, sort, toggle } = useSortable(rows ?? [])

  const totals = (rows ?? []).reduce((acc, r) => ({
    pi0: acc.pi0 + Number(r.pi0),
    pi1: acc.pi1 + Number(r.pi1),
    total: acc.total + Number(r.total),
  }), { pi0: 0, pi1: 0, total: 0 })

  return (
    <div className="opp-section">
      <div className="opp-header" style={{ cursor: 'pointer' }} onClick={() => setCollapsed(c => !c)}>
        <h3>{title}</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{collapsed ? '▶ Show' : '▼ Hide'}</span>
      </div>
      {!collapsed && (
        !rows?.length ? <div className="opp-empty">No data</div> : (
          <div className="opp-table-wrap">
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <SortTh col="label"  label="Status" sort={sort} toggle={toggle} align="left" />
                  <SortTh col="pi0"    label="PI0"    sort={sort} toggle={toggle} />
                  <SortTh col="pi1"    label="PI1"    sort={sort} toggle={toggle} />
                  <th style={{ minWidth: 120 }}>PI1%</th>
                  <SortTh col="total"  label="Total"  sort={sort} toggle={toggle} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i}>
                    <td><StatusBadge value={r.label} /></td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.pi0)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.pi1)}</td>
                    <td><ProgressBar value={Number(r.pi1)} max={Number(r.total)} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{fnum(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                  <td>Total</td>
                  <td style={{ textAlign: 'right' }}>{fnum(totals.pi0)}</td>
                  <td style={{ textAlign: 'right' }}>{fnum(totals.pi1)}</td>
                  <td><ProgressBar value={totals.pi1} max={totals.total} /></td>
                  <td style={{ textAlign: 'right' }}>{fnum(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function CategoryTable({ rows, totals }) {
  const [collapsed, setCollapsed] = useState(false)
  const { sorted, sort, toggle } = useSortable(rows ?? [])

  const valueThreshold = totals.TotalValue / (rows.length || 1)

  return (
    <div className="opp-section" style={{ marginBottom: '1.5rem' }}>
      <div className="opp-header" style={{ cursor: 'pointer' }} onClick={() => setCollapsed(c => !c)}>
        <h3>Category Aggregates</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{collapsed ? '▶ Show' : '▼ Hide'}</span>
      </div>
      {!collapsed && (
        <div className="opp-table-wrap">
          <table className="opp-table">
            <thead className="sticky-header">
              <tr>
                <SortTh col="Category"   label="Category"    sort={sort} toggle={toggle} align="left" />
                <SortTh col="PriceInfo"  label="Price Info"  sort={sort} toggle={toggle} />
                <SortTh col="TotalSets"  label="Total Sets"  sort={sort} toggle={toggle} />
                <SortTh col="CardList"   label="Card List"   sort={sort} toggle={toggle} />
                <SortTh col="TotalCards" label="Total Cards" sort={sort} toggle={toggle} />
                <SortTh col="TotalValue" label="Total Value" sort={sort} toggle={toggle} />
                <SortTh col="NoValue"    label="No Value"    sort={sort} toggle={toggle} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const highValue = Number(r.TotalValue) > valueThreshold
                return (
                  <tr key={i} className="opp-row-clickable" style={highValue ? { background: 'rgba(3,194,82,0.04)' } : {}}>
                    <td style={{ fontWeight: 500 }}>{r.Category}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.PriceInfo)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.TotalSets)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.CardList)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(r.TotalCards)}</td>
                    <td style={{ textAlign: 'right', color: highValue ? 'var(--green)' : 'var(--text)', fontWeight: highValue ? 600 : 400 }}>{fcur(r.TotalValue)}</td>
                    <td style={{ textAlign: 'right', color: Number(r.NoValue) > 0 ? 'var(--orange)' : 'var(--text)' }}>{fnum(r.NoValue)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                <td>Total</td>
                <td style={{ textAlign: 'right' }}>{fnum(totals.PriceInfo)}</td>
                <td style={{ textAlign: 'right' }}>{fnum(totals.TotalSets)}</td>
                <td style={{ textAlign: 'right' }}>{fnum(totals.CardList)}</td>
                <td style={{ textAlign: 'right' }}>{fnum(totals.TotalCards)}</td>
                <td style={{ textAlign: 'right' }}>{fcur(totals.TotalValue)}</td>
                <td style={{ textAlign: 'right' }}>{fnum(totals.NoValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Summary({ sport }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API.BASE}/api/${sport.db}/summary/${sport.table}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLastUpdated(new Date())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="opp-loading">⏳ Loading summary...</div>
  if (error)   return <div className="opp-error">⚠️ {error}</div>

  const catTotals = data.categories.reduce((acc, r) => ({
    PriceInfo:  acc.PriceInfo  + Number(r.PriceInfo),
    TotalSets:  acc.TotalSets  + Number(r.TotalSets),
    CardList:   acc.CardList   + Number(r.CardList),
    TotalCards: acc.TotalCards + Number(r.TotalCards),
    TotalValue: acc.TotalValue + Number(r.TotalValue),
    NoValue:    acc.NoValue    + Number(r.NoValue),
  }), { PriceInfo: 0, TotalSets: 0, CardList: 0, TotalCards: 0, TotalValue: 0, NoValue: 0 })

  const allSets   = data.bySetType.reduce((a, r) => a + Number(r.total), 0)
  const allPI1    = data.bySetType.reduce((a, r) => a + Number(r.pi1), 0)

  const kpis = [
    { label: 'Total Sets',   value: fnum(catTotals.TotalSets),  accent: 'var(--blue)' },
    { label: 'Total Cards',  value: fnum(catTotals.TotalCards), accent: 'var(--purple)' },
    { label: 'Total Value',  value: fcur(catTotals.TotalValue), accent: 'var(--green)' },
    { label: 'No Value',     value: fnum(catTotals.NoValue),    accent: 'var(--orange)' },
    { label: 'Price Info %', value: pct(allPI1, allSets),       accent: 'var(--yellow)' },
    { label: 'Card List',    value: fnum(catTotals.CardList),   accent: 'var(--blue)' },
  ]

  return (
    <div>
      {/* Header with refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        {lastUpdated && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button className="icon-btn" onClick={fetchData} title="Refresh">🔄 Refresh</button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-accent" style={{ background: k.accent }} />
            <div className="kpi-content">
              <span className="kpi-value">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Aggregates */}
      <CategoryTable rows={data.categories} totals={catTotals} />

      {/* Row 1: Buckets 1-3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <BucketTable title="Bucket 1: Set Type Status"  rows={data.bySetType} />
        <BucketTable title="Bucket 2: Card Type Status" rows={data.byCardType} />
        <BucketTable title="Bucket 3: Pass / Fail"      rows={data.byPassFail} />
      </div>

      {/* Row 2: Buckets 4-6 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <BucketTable title="Bucket 4: MFG Brand Status" rows={data.byMfgBrand} />
        <BucketTable title="Bucket 5: Card Type"        rows={data.byCardType2} />
        <BucketTable title="Bucket 6: Card List"        rows={data.byCardList} />
      </div>
    </div>
  )
}
