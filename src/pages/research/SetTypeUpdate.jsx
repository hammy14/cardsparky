import { useState, useEffect, useCallback, useRef } from 'react'
import { API } from '../../config/api'

const STATUS_TYPES = ['New', 'Completed']

const SELECT_STYLE = {
  padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)',
  borderRadius: 4, fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)'
}

// Generate a consistent color from a string
function strColor(str) {
  if (!str) return { background: 'var(--gray-100)', color: 'var(--text-muted)' }
  const colors = [
    { background: 'rgba(2,113,235,0.1)',   color: 'var(--blue)' },
    { background: 'rgba(3,194,82,0.1)',    color: 'var(--green)' },
    { background: 'rgba(13,148,136,0.15)',color: 'var(--purple)' },
    { background: 'rgba(255,203,62,0.2)',  color: '#b45309' },
    { background: 'rgba(224,92,75,0.15)', color: 'var(--orange)' },
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function rowBg(str) {
  if (!str) return {}
  const colors = [
    'rgba(2,113,235,0.04)', 'rgba(3,194,82,0.04)',
    'rgba(13,148,136,0.05)', 'rgba(255,203,62,0.05)', 'rgba(224,92,75,0.04)',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return { background: colors[Math.abs(hash) % colors.length] }
}

// Check if value is suspiciously similar to existing values (simple Levenshtein)
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function isDuplicate(val, existing) {
  if (!val || !existing.length) return false
  const v = val.toLowerCase().trim()
  return existing.some(e => {
    const ev = (e || '').toLowerCase().trim()
    return ev !== v && levenshtein(v, ev) <= 2 && ev.length > 2
  })
}

function AutocompleteInput({ value, options, onChange, onSave, onKeyDown, placeholder, isDup }) {
  const [val, setVal] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const ref = useRef()

  const filtered = options.filter(o => o && o.toLowerCase().includes(val.toLowerCase()) && o !== val).slice(0, 8)
  const showDup = isDup && isDuplicate(val, options)

  async function handleBlur() {
    setTimeout(() => setOpen(false), 150)
    if (val === (value ?? '')) return
    setStatus('saving')
    try {
      await onSave(val)
      setStatus('saved')
      setTimeout(() => setStatus(null), 800)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  const bg = status === 'saving' ? 'rgba(2,113,235,0.1)'
           : status === 'saved'  ? 'rgba(3,194,82,0.15)'
           : status === 'error'  ? 'rgba(229,62,62,0.15)'
           : showDup             ? 'rgba(224,92,75,0.1)'
           : 'var(--card)'

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <input
        type="text" value={val}
        placeholder={placeholder}
        onChange={e => { setVal(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        style={{ width: '100%', minWidth: 130, padding: '0.25rem 0.4rem', border: `1px solid ${showDup ? 'var(--orange)' : 'var(--gray-200)'}`, borderRadius: 4, fontSize: '0.8rem', background: bg, color: 'var(--text)', transition: 'background 0.3s' }}
      />
      {showDup && <span title="Possible duplicate" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--orange)' }}>⚠️</span>}
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: 180, overflowY: 'auto' }}>
          {filtered.map(o => (
            <button key={o} onMouseDown={() => { setVal(o); onChange(o); setOpen(false); onSave(o) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.4rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text)' }}
              onMouseEnter={e => e.target.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SetTypeUpdate({ sport }) {
  const [rows, setRows]                   = useState([])
  const [total, setTotal]                 = useState(0)
  const [setTypeCounts, setSetTypeCounts] = useState([])
  const [categoryCounts, setCategoryCounts] = useState([])
  const [distinctSetTypes, setDistinctSetTypes]   = useState([])
  const [distinctCategories, setDistinctCategories] = useState([])
  const [showAllCats, setShowAllCats]     = useState(false)
  const [page, setPage]                   = useState(1)
  const [perpage, setPerpage]             = useState(50)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [sortCol, setSortCol]             = useState('SetName')
  const [sortDir, setSortDir]             = useState('asc')
  const [selected, setSelected]           = useState(new Set())
  const [bulkStatus, setBulkStatus]       = useState('')
  const [bulkSetType, setBulkSetType]     = useState('')
  const [bulkCategory, setBulkCategory]   = useState('')
  const [jumpPage, setJumpPage]           = useState('')
  const [fadingOut, setFadingOut]         = useState(new Set())
  const [filters, setFilters]             = useState({ fsearch: '', fstatus: 'New', fsettype: '', fcategory: '' })
  const [applied, setApplied]             = useState({ fsearch: '', fstatus: 'New', fsettype: '', fcategory: '' })

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, ...applied })
    fetch(`${API.BASE}/api/${sport.db}/settype/${sport.table}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setSetTypeCounts(d.setTypeCounts ?? [])
        setCategoryCounts(d.categoryCounts ?? [])
        setDistinctSetTypes(d.distinctSetTypes?.map(r => r.SetType).filter(Boolean) ?? [])
        setDistinctCategories(d.distinctCategories?.map(r => r.Category).filter(Boolean) ?? [])
        setSelected(new Set())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table, page, perpage, applied])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveField(id, column, value) {
    const res = await fetch(`${API.BASE}/api/${sport.db}/settype/${sport.table}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setRows(r => r.map(row => row.id === id ? { ...row, [column]: value } : row))
    if (column === 'SetTypeStatus' && value === 'Completed' && applied.fstatus === 'New') {
      setFadingOut(s => new Set([...s, id]))
      setTimeout(() => {
        setRows(r => r.filter(row => row.id !== id))
        setFadingOut(s => { const n = new Set(s); n.delete(id); return n })
      }, 500)
    }
    // Update distinct lists if new value
    if (column === 'SetType' && value && !distinctSetTypes.includes(value))
      setDistinctSetTypes(d => [...d, value].sort())
    if (column === 'Category' && value && !distinctCategories.includes(value))
      setDistinctCategories(d => [...d, value].sort())
    return data
  }

  async function applyBulk() {
    for (const id of selected) {
      if (bulkStatus)   await saveField(id, 'SetTypeStatus', bulkStatus)
      if (bulkSetType)  await saveField(id, 'SetType', bulkSetType)
      if (bulkCategory) await saveField(id, 'Category', bulkCategory)
    }
    setSelected(new Set())
    setBulkStatus(''); setBulkSetType(''); setBulkCategory('')
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedRows = [...rows].sort((a, b) => {
    const av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(s => s.size === rows.length ? new Set() : new Set(rows.map(r => r.id)))
  }

  function SortTh({ col, label, style = {} }) {
    return (
      <th className="sortable" style={style} onClick={() => handleSort(col)}>
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </th>
    )
  }

  function handleApply() { setApplied({ ...filters }); setPage(1) }
  function handleClear() {
    const def = { fsearch: '', fstatus: 'New', fsettype: '', fcategory: '' }
    setFilters(def); setApplied(def); setPage(1)
  }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  const visibleCats = showAllCats ? categoryCounts : categoryCounts.slice(0, 5)

  return (
    <div>
      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
        {setTypeCounts.map(tc => (
          <span key={tc.SetType} className="badge" style={{ ...strColor(tc.SetType), fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
            {tc.SetType || '(Unset)'}: {Number(tc.cnt).toLocaleString()}
          </span>
        ))}
        <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
          Total: {total.toLocaleString()}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {visibleCats.map(cc => (
          <span key={cc.Category} className="badge" style={{ background: 'rgba(2,113,235,0.08)', color: 'var(--blue)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
            {cc.Category || '(Unset)'}: {Number(cc.cnt).toLocaleString()}
          </span>
        ))}
        {categoryCounts.length > 5 && (
          <button onClick={() => setShowAllCats(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.75rem', cursor: 'pointer' }}>
            {showAllCats ? 'Show less ▲' : `+${categoryCounts.length - 5} more ▼`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Search Set Name</label>
          <input className="opp-search" placeholder="Search..." value={filters.fsearch} onChange={e => setFilters(f => ({ ...f, fsearch: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleApply()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
          <select className="opp-filter" value={filters.fstatus} onChange={e => setFilters(f => ({ ...f, fstatus: e.target.value }))}>
            <option value="">All</option>
            {STATUS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Type</label>
          <select className="opp-filter" value={filters.fsettype} onChange={e => setFilters(f => ({ ...f, fsettype: e.target.value }))}>
            <option value="">All</option>
            {distinctSetTypes.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
          <select className="opp-filter" value={filters.fcategory} onChange={e => setFilters(f => ({ ...f, fcategory: e.target.value }))}>
            <option value="">All</option>
            {distinctCategories.map(o => <option key={o} value={o}>{o}</option>)}
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
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'rgba(2,113,235,0.06)', borderRadius: 'var(--radius)', border: '1px solid var(--blue)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--blue)' }}>{selected.size} selected</span>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Type</label>
            <select className="opp-filter" value={bulkSetType} onChange={e => setBulkSetType(e.target.value)}>
              <option value="">— select —</option>
              {distinctSetTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
            <select className="opp-filter" value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}>
              <option value="">— select —</option>
              {distinctCategories.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
            <select className="opp-filter" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              <option value="">— select —</option>
              {STATUS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button className="btn-save" onClick={applyBulk} disabled={!bulkStatus && !bulkSetType && !bulkCategory}>Apply to Selected</button>
          <button className="btn-cancel" onClick={() => setSelected(new Set())}>Deselect All</button>
        </div>
      )}

      {/* Table */}
      <div className="opp-section">
        <div className="opp-table-wrap" style={{ maxHeight: '65vh' }}>
          {loading ? <div className="opp-loading">⏳ Loading...</div> : (
            <table className="opp-table">
              <thead className="sticky-header">
                <tr>
                  <th style={{ width: 32, position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 11 }}>
                    <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} />
                  </th>
                  <SortTh col="SetName" label="Set Name" style={{ minWidth: 200, position: 'sticky', left: 32, background: 'var(--gray-50)', zIndex: 11 }} />
                  <SortTh col="SetType"       label="Set Type"  style={{ minWidth: 160 }} />
                  <SortTh col="Category"      label="Category"  style={{ minWidth: 160 }} />
                  <SortTh col="SetTypeStatus" label="Status" />
                  <th style={{ textAlign: 'center' }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr><td colSpan={6} className="opp-empty">No records match the current filters.</td></tr>
                )}
                {sortedRows.map(row => (
                  <tr key={row.id} style={{ ...rowBg(row.SetType), opacity: fadingOut.has(row.id) ? 0 : 1, transition: 'opacity 0.5s ease' }}>
                    <td style={{ position: 'sticky', left: 0, background: 'inherit', zIndex: 10 }}>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td style={{ position: 'sticky', left: 32, background: 'inherit', zIndex: 10, fontWeight: 500, fontSize: '0.85rem' }}>
                      {row.SetName}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {row.SetType && <span className="badge" style={{ ...strColor(row.SetType), fontSize: '0.7rem', flexShrink: 0 }}>{row.SetType}</span>}
                        <AutocompleteInput
                          value={row.SetType}
                          options={distinctSetTypes}
                          onChange={() => {}}
                          onSave={val => saveField(row.id, 'SetType', val)}
                          isDup={true}
                          placeholder="Set type..."
                          onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); e.target.closest('tr').querySelectorAll('input[type=text]')[1]?.focus() } }}
                        />
                      </div>
                    </td>
                    <td>
                      <AutocompleteInput
                        value={row.Category}
                        options={distinctCategories}
                        onChange={() => {}}
                        onSave={val => saveField(row.id, 'Category', val)}
                        isDup={true}
                        placeholder="Category..."
                      />
                    </td>
                    <td>
                      <select value={row.SetTypeStatus} onChange={e => saveField(row.id, 'SetTypeStatus', e.target.value)} style={SELECT_STYLE}>
                        {STATUS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.Link
                        ? <button className="btn-save" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => window.open(row.Link, '_blank', 'width=1020,height=720,resizable,scrollbars')}>Link</button>
                        : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
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
