import { useState, useEffect, useCallback } from 'react'
import { API } from '../../config/api'

function fnum(n) { return Number(n).toLocaleString() }
function fcur(n) { return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) }

export default function YearSummary({ sport }) {
  const [rows, setRows]     = useState([])
  const [total, setTotal]   = useState(0)
  const [totals, setTotals] = useState(null)
  const [page, setPage]     = useState(1)
  const [perpage, setPerpage] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [sortCol, setSortCol] = useState('Year')
  const [sortDir, setSortDir] = useState('asc')
  const [fyear, setFyear]   = useState('')
  const [appliedYear, setAppliedYear] = useState('')
  const [jumpPage, setJumpPage] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, fyear: appliedYear })
    fetch(`${API.BASE}/api/${sport.db}/yearsummary/${sport.table}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setTotals(d.totals)
        setLastUpdated(new Date())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table, page, perpage, appliedYear])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedRows = [...rows].sort((a, b) => {
    const av = isNaN(a[sortCol]) ? (a[sortCol] ?? '') : Number(a[sortCol])
    const bv = isNaN(b[sortCol]) ? (b[sortCol] ?? '') : Number(b[sortCol])
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  function SortTh({ col, label, style = {} }) {
    return (
      <th className="sortable" style={style} onClick={() => handleSort(col)}>
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </th>
    )
  }

  // Color rows by decade
  function decadeColor(year) {
    const y = parseInt(year)
    if (!y) return {}
    const decade = Math.floor(y / 10) * 10
    const colors = {
      1950: 'rgba(13,148,136,0.06)', 1960: 'rgba(255,203,62,0.06)',
      1970: 'rgba(224,92,75,0.06)',  1980: 'rgba(3,194,82,0.06)',
      1990: 'rgba(2,113,235,0.06)',   2000: 'rgba(229,62,62,0.06)',
      2010: 'rgba(13,148,136,0.06)', 2020: 'rgba(255,203,62,0.06)',
    }
    return { background: colors[decade] ?? {} }
  }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {/* KPI totals */}
      {totals && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Years',  value: fnum(total),              accent: 'var(--blue)' },
            { label: 'Total Sets',   value: fnum(totals.SetTypeCount), accent: 'var(--purple)' },
            { label: 'Total Cards',  value: fnum(totals.TotalCards),   accent: 'var(--green)' },
            { label: 'Total Value',  value: fcur(totals.TotalValue),   accent: 'var(--orange)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-accent" style={{ background: k.accent }} />
              <div className="kpi-content">
                <span className="kpi-value">{k.value}</span>
                <span className="kpi-label">{k.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Filter Year</label>
          <input className="opp-search" placeholder="e.g. 1990" value={fyear} style={{ width: 100 }}
            onChange={e => setFyear(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setAppliedYear(fyear); setPage(1) } }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Per Page</label>
          <select className="opp-filter" value={perpage} onChange={e => { setPerpage(Number(e.target.value)); setPage(1) }}>
            {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button className="btn-save" onClick={() => { setAppliedYear(fyear); setPage(1) }}>Apply</button>
          <button className="btn-cancel" onClick={() => { setFyear(''); setAppliedYear(''); setPage(1) }}>Clear</button>
          <button className="icon-btn" onClick={fetchData} title="Refresh">🔄</button>
        </div>
        {lastUpdated && (
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="opp-section">
        <div className="opp-table-wrap" style={{ maxHeight: '65vh' }}>
          {loading ? <div className="opp-loading">⏳ Loading...</div> : (
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <SortTh col="Year"         label="Year"           style={{ minWidth: 80 }} />
                  <SortTh col="SetTypeCount" label="Set Count"      style={{ textAlign: 'right' }} />
                  <SortTh col="TotalCards"   label="Total Cards"    style={{ textAlign: 'right' }} />
                  <SortTh col="TotalValue"   label="Total Value"    style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr><td colSpan={4} className="opp-empty">No data found.</td></tr>
                )}
                {sortedRows.map((row, i) => (
                  <tr key={row.Year ?? i} style={decadeColor(row.Year)}>
                    <td style={{ fontWeight: 600 }}>{row.Year ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(row.SetTypeCount)}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(row.TotalCards)}</td>
                    <td style={{ textAlign: 'right' }}>{fcur(row.TotalValue)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Page subtotal */}
              {sortedRows.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                    <td>Page Total</td>
                    <td style={{ textAlign: 'right' }}>{fnum(sortedRows.reduce((a, r) => a + Number(r.SetTypeCount), 0))}</td>
                    <td style={{ textAlign: 'right' }}>{fnum(sortedRows.reduce((a, r) => a + Number(r.TotalCards), 0))}</td>
                    <td style={{ textAlign: 'right' }}>{fcur(sortedRows.reduce((a, r) => a + Number(r.TotalValue), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalpages > 1 && (
          <div className="opp-pagination">
            <button disabled={page === 1} onClick={() => setPage(1)}>First</button>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            {Array.from({ length: Math.min(5, totalpages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalpages - 4)) + i
              return (
                <button key={p} onClick={() => setPage(p)} style={p === page ? { background: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' } : {}}>
                  {p}
                </button>
              )
            })}
            <button disabled={page === totalpages} onClick={() => setPage(p => p + 1)}>Next</button>
            <button disabled={page === totalpages} onClick={() => setPage(totalpages)}>Last</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} of {totalpages}</span>
            <input
              type="number" min={1} max={totalpages} value={jumpPage}
              onChange={e => setJumpPage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { const p = Math.min(Math.max(1, parseInt(jumpPage)), totalpages); setPage(p); setJumpPage('') } }}
              placeholder="Go to..."
              style={{ width: 70, padding: '0.3rem 0.5rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
