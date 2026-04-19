import { useState, useEffect, useCallback } from 'react'
import { SkeletonTable } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'

function formatDuration(seconds) {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString()
}

// Build a 52-week heatmap from rows
function buildHeatmap(rows) {
  const counts = {}
  rows.forEach(r => {
    if (!r.login_time) return
    const d = new Date(r.login_time)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    counts[key] = (counts[key] || 0) + 1
  })

  // build last 52 weeks (364 days)
  const today = new Date()
  today.setHours(0,0,0,0)
  const days = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    days.push({ date: key, count: counts[key] || 0, d })
  }
  return days
}

function heatColor(count, max) {
  if (count === 0) return 'var(--gray-100)'
  const intensity = Math.min(count / Math.max(max, 1), 1)
  if (intensity < 0.25) return 'rgba(1,84,130,0.2)'
  if (intensity < 0.5)  return 'rgba(1,84,130,0.45)'
  if (intensity < 0.75) return 'rgba(1,84,130,0.7)'
  return 'var(--brand)'
}

function HeatmapCalendar({ rows }) {
  const days = buildHeatmap(rows)
  const max = Math.max(...days.map(d => d.count), 1)

  // group into weeks (columns)
  const weeks = []
  let week = []
  // pad start so first day is correct weekday
  const firstDow = days[0].d.getDay()
  for (let i = 0; i < firstDow; i++) week.push(null)
  days.forEach(day => {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  })
  if (week.length) weeks.push(week)

  const DAYS = ['S','M','T','W','T','F','S']
  const months = []
  let lastMonth = -1
  weeks.forEach((w, wi) => {
    const first = w.find(Boolean)
    if (first && first.d.getMonth() !== lastMonth) {
      months.push({ wi, label: first.d.toLocaleString('default', { month: 'short' }) })
      lastMonth = first.d.getMonth()
    }
  })

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 'max-content' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 18 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '11px', width: 12, textAlign: 'right' }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        <div>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 4, height: 14 }}>
            {weeks.map((_, wi) => {
              const m = months.find(m => m.wi === wi)
              return <div key={wi} style={{ width: 11, fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m?.label ?? ''}</div>
            })}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di]
                  return (
                    <div
                      key={di}
                      title={day ? `${day.date}: ${day.count} login${day.count !== 1 ? 's' : ''}` : ''}
                      style={{
                        width: 11, height: 11, borderRadius: 2,
                        background: day ? heatColor(day.count, max) : 'transparent',
                        cursor: day?.count ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(i => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: heatColor(i * max, max) }} />
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  )
}

export default function LoginHistory() {
  const [rows, setRows]       = useState([])
  const [allRows, setAllRows] = useState([])  // for heatmap
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [perpage, setPerpage] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [jumpPage, setJumpPage] = useState('')
  const [filters, setFilters] = useState({ email: '', status: '' })
  const [applied, setApplied] = useState({ email: '', status: '' })

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, ...applied })
    // also fetch up to 500 for heatmap
    Promise.all([
      fetch(`http://localhost:3001/api/auth/loginhistory?${params}`).then(r => r.json()),
      fetch(`http://localhost:3001/api/auth/loginhistory?page=1&perpage=500`).then(r => r.json()),
    ])
      .then(([paged, all]) => {
        if (paged.error) throw new Error(paged.error)
        setRows(paged.rows)
        setTotal(paged.total)
        setAllRows(all.rows ?? [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, perpage, applied])

  useEffect(() => { fetchData() }, [fetchData])

  function handleApply() { setApplied({ ...filters }); setPage(1) }
  function handleClear() { setFilters({ email: '', status: '' }); setApplied({ email: '', status: '' }); setPage(1) }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {/* Heatmap */}
      <div className="opp-section" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-4)' }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 'var(--sp-4)' }}>
          Login Activity — Past Year
        </div>
        {loading
          ? <div style={{ height: 100, background: 'var(--gray-100)', borderRadius: 'var(--radius)', animation: 'shimmer 1.4s ease-in-out infinite', backgroundSize: '200% 100%' }} />
          : <HeatmapCalendar rows={allRows} />
        }
      </div>

      <div className="opp-section">
        <div className="opp-header">
          <h3>🔐 Login History</h3>
          <span className="record-count">{total.toLocaleString()} records</span>
        </div>

        <div className="opp-toolbar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</label>
            <input className="opp-search" placeholder="Filter by email..." value={filters.email} onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleApply()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
            <select className="opp-filter" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="Login">Login</option>
              <option value="Logout">Logout</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Per Page</label>
            <select className="opp-filter" value={perpage} onChange={e => { setPerpage(Number(e.target.value)); setPage(1) }}>
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button className="btn-save" onClick={handleApply}>Apply</button>
            <button className="btn-cancel" onClick={handleClear}>Clear</button>
            <button className="icon-btn" onClick={fetchData}>🔄</button>
          </div>
        </div>

        <div className="opp-table-wrap" style={{ maxHeight: '55vh' }}>
          {loading ? <SkeletonTable rows={8} cols={8} /> : rows.length === 0 ? (
            <EmptyState icon="🔐" title="No login records found" message="Try adjusting your filters." />
          ) : (
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Duration</th>
                  <th>IP Address</th>
                  <th style={{ minWidth: 200 }}>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.display_name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.email}</td>
                    <td>
                      <span className="badge" style={{
                        background: row.status === 'Login' ? 'rgba(3,194,82,0.15)' : 'rgba(229,62,62,0.1)',
                        color: row.status === 'Login' ? 'var(--green)' : 'var(--red)'
                      }}>{row.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(row.login_time)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(row.logout_time)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDuration(row.duration)}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{row.ip_address || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.user_agent}>
                      {row.user_agent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalpages > 1 && (
          <div className="opp-pagination">
            <button disabled={page === 1} onClick={() => setPage(1)}>First</button>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            {Array.from({ length: Math.min(5, totalpages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalpages - 4)) + i
              return <button key={p} onClick={() => setPage(p)} style={p === page ? { background: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' } : {}}>{p}</button>
            })}
            <button disabled={page === totalpages} onClick={() => setPage(p => p + 1)}>Next</button>
            <button disabled={page === totalpages} onClick={() => setPage(totalpages)}>Last</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} of {totalpages}</span>
            <input type="number" min={1} max={totalpages} value={jumpPage}
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
