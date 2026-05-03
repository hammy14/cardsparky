import { useState, useEffect, useCallback } from 'react'
import { API } from '../../config/api'

const SELECT_STYLE = {
  padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)',
  borderRadius: 4, fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)'
}

function fnum(n) { return Number(n).toLocaleString() }

function EditableNumber({ rowId, initialValue, onSave }) {
  const [val, setVal] = useState(initialValue ?? 0)
  const [status, setStatus] = useState(null)

  async function handleBlur() {
    const parsed = parseInt(val) || 0
    setVal(parsed)
    setStatus('saving')
    try {
      await onSave(rowId, 'TotalCards', parsed)
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
           : 'var(--card)'

  return (
    <input type="number" min="0" value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={handleBlur}
      style={{ width: 80, textAlign: 'right', padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: '0.8rem', background: bg, color: 'var(--text)', transition: 'background 0.3s' }}
    />
  )
}

export default function CardListUpdate({ sport }) {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [summary, setSummary] = useState(null)
  const [page, setPage]       = useState(1)
  const [perpage, setPerpage] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [sortCol, setSortCol] = useState('SetName')
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState(new Set())
  const [bulkCardList, setBulkCardList] = useState('')
  const [jumpPage, setJumpPage] = useState('')
  const [filters, setFilters] = useState({ fsearch: '', fcards: '', fcardlist: '' })
  const [applied, setApplied] = useState({ fsearch: '', fcards: '', fcardlist: '' })

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, ...applied })
    fetch(`${API.BASE}/api/${sport.db}/cardlist/${sport.table}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setSummary(d.summary)
        setSelected(new Set())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table, page, perpage, applied])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveField(id, column, value) {
    const res = await fetch(`${API.BASE}/api/${sport.db}/cardlist/${sport.table}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setRows(r => r.map(row => row.id === id ? { ...row, [column]: value } : row))
    return data
  }

  async function applyBulk() {
    for (const id of selected) {
      if (bulkCardList !== '') await saveField(id, 'CardList', bulkCardList)
    }
    setSelected(new Set())
    setBulkCardList('')
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedRows = [...rows].sort((a, b) => {
    const av = isNaN(a[sortCol]) ? (a[sortCol] ?? '') : Number(a[sortCol])
    const bv = isNaN(b[sortCol]) ? (b[sortCol] ?? '') : Number(b[sortCol])
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
    const empty = { fsearch: '', fcards: '', fcardlist: '' }
    setFilters(empty); setApplied(empty); setPage(1)
  }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {/* KPI Summary */}
      {summary && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Sets',      value: fnum(summary.totalSets),      accent: 'var(--blue)' },
            { label: 'Card List = 1',   value: fnum(summary.totalCardList),   accent: 'var(--green)' },
            { label: 'Card List = 0',   value: fnum(summary.totalSets - summary.totalCardList), accent: 'var(--orange)' },
            { label: 'Total Cards',     value: fnum(summary.totalCards),      accent: 'var(--purple)' },
            { label: 'Has Checklist',   value: fnum(summary.hasChecklist),    accent: 'var(--blue)' },
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

      {/* Filters */}
      <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Search Set Name</label>
          <input className="opp-search" placeholder="Search..." value={filters.fsearch} onChange={e => setFilters(f => ({ ...f, fsearch: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleApply()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Cards</label>
          <select className="opp-filter" value={filters.fcards} onChange={e => setFilters(f => ({ ...f, fcards: e.target.value }))}>
            <option value="">All</option>
            <option value="0">0</option>
            <option value="gt0">&gt; 0</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Card List</label>
          <select className="opp-filter" value={filters.fcardlist} onChange={e => setFilters(f => ({ ...f, fcardlist: e.target.value }))}>
            <option value="">All</option>
            <option value="1">1</option>
            <option value="0">0</option>
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
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
          {total.toLocaleString()} records
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'rgba(2,113,235,0.06)', borderRadius: 'var(--radius)', border: '1px solid var(--blue)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--blue)' }}>{selected.size} selected</span>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Card List</label>
            <select className="opp-filter" value={bulkCardList} onChange={e => setBulkCardList(e.target.value)}>
              <option value="">— select —</option>
              <option value="1">1</option>
              <option value="0">0</option>
            </select>
          </div>
          <button className="btn-save" onClick={applyBulk} disabled={bulkCardList === ''}>Apply to Selected</button>
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
                  <SortTh col="SetName"    label="Set Name"    style={{ minWidth: 200, position: 'sticky', left: 32, background: 'var(--gray-50)', zIndex: 11 }} />
                  <SortTh col="CardList"   label="Card List" />
                  <SortTh col="TotalCards" label="Total Cards" />
                  <th style={{ textAlign: 'center' }}>Checklist</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr><td colSpan={5} className="opp-empty">No records match the current filters.</td></tr>
                )}
                {sortedRows.map(row => {
                  const isZero = !row.CardList || row.CardList == 0
                  return (
                    <tr key={row.id} style={{ background: isZero ? 'rgba(224,92,75,0.04)' : 'rgba(3,194,82,0.04)' }}>
                      <td style={{ position: 'sticky', left: 0, background: 'inherit', zIndex: 10 }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      <td style={{ position: 'sticky', left: 32, background: 'inherit', zIndex: 10, fontWeight: 500, fontSize: '0.85rem' }}>
                        {row.SetName}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge" style={{ background: row.CardList == 1 ? 'rgba(3,194,82,0.15)' : 'rgba(224,92,75,0.15)', color: row.CardList == 1 ? 'var(--green)' : 'var(--orange)', minWidth: 20, textAlign: 'center' }}>
                            {row.CardList}
                          </span>
                          <select
                            value={row.CardList}
                            onChange={e => saveField(row.id, 'CardList', e.target.value)}
                            style={SELECT_STYLE}
                          >
                            <option value="1">1</option>
                            <option value="0">0</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <EditableNumber rowId={row.id} initialValue={row.TotalCards} onSave={saveField} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {row.Checklist
                          ? <button className="btn-save" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                const w = Math.floor(window.innerWidth * 0.9)
                                const h = Math.floor(window.innerHeight * 0.9)
                                window.open(row.Checklist, 'CardListChecklist', `width=${w},height=${h},resizable=yes,scrollbars=yes`)
                              }}>
                              Checklist
                            </button>
                          : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
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
