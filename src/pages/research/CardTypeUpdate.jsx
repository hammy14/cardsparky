import { useState, useEffect, useCallback } from 'react'

const CARD_TYPES = ['Base', 'Parallel', 'Insert']
const STATUS_TYPES = ['New', 'Completed']

const CARDTYPE_STYLES = {
  'Parallel': { background: 'rgba(255,203,62,0.08)' },
  'Insert':   { background: 'rgba(2,113,235,0.06)' },
}

const CARDTYPE_BADGE = {
  'Base':     { background: 'var(--gray-100)',          color: 'var(--text-muted)' },
  'Parallel': { background: 'rgba(255,203,62,0.2)',     color: '#b45309' },
  'Insert':   { background: 'rgba(2,113,235,0.15)',     color: 'var(--blue)' },
}

const SELECT_STYLE = {
  padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)',
  borderRadius: 4, fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)'
}

function EditableText({ rowId, column, initialValue, onSave, onKeyDown }) {
  const [val, setVal] = useState(initialValue ?? '')
  const [status, setStatus] = useState(null)

  async function handleBlur() {
    if (val === (initialValue ?? '')) return
    setStatus('saving')
    try {
      await onSave(rowId, column, val)
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
    <input
      type="text" value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      style={{ width: '100%', minWidth: 120, padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: '0.8rem', background: bg, color: 'var(--text)', transition: 'background 0.3s' }}
    />
  )
}

function EditableNumber({ rowId, column, initialValue, onSave }) {
  const [val, setVal] = useState(initialValue ?? 0)
  const [status, setStatus] = useState(null)

  async function handleBlur() {
    const parsed = parseInt(val) || 0
    setVal(parsed)
    setStatus('saving')
    try {
      await onSave(rowId, column, parsed)
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
    <input
      type="number" min="0" value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={handleBlur}
      style={{ width: 70, textAlign: 'right', padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: '0.8rem', background: bg, color: 'var(--text)', transition: 'background 0.3s' }}
    />
  )
}

export default function CardTypeUpdate({ sport }) {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [typeCounts, setTypeCounts] = useState([])
  const [page, setPage]         = useState(1)
  const [perpage, setPerpage]   = useState(50)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [sortCol, setSortCol]   = useState('SetName')
  const [sortDir, setSortDir]   = useState('asc')
  const [selected, setSelected] = useState(new Set())
  const [bulkType, setBulkType] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [jumpPage, setJumpPage] = useState('')
  const [filters, setFilters]   = useState({ fsearch: '', fstatus: 'New', fcardtype: '' })
  const [applied, setApplied]   = useState({ fsearch: '', fstatus: 'New', fcardtype: '' })
  const [fadingOut, setFadingOut] = useState(new Set())

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, ...applied })
    fetch(`http://localhost:3001/api/${sport.db}/cardtype/${sport.table}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setTypeCounts(d.typeCounts ?? [])
        setSelected(new Set())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table, page, perpage, applied])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveField(id, column, value) {
    const res = await fetch(`http://localhost:3001/api/${sport.db}/cardtype/${sport.table}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setRows(r => r.map(row => row.id === id ? { ...row, [column]: value } : row))
    // Auto-remove when marked Completed and filter is New
    if (column === 'CardTypeStatus' && value === 'Completed' && applied.fstatus === 'New') {
      setFadingOut(s => new Set([...s, id]))
      setTimeout(() => {
        setRows(r => r.filter(row => row.id !== id))
        setFadingOut(s => { const n = new Set(s); n.delete(id); return n })
      }, 500)
    }
    return data
  }

  async function applyBulk() {
    for (const id of selected) {
      if (bulkType) await saveField(id, 'CardType', bulkType)
      if (bulkStatus) await saveField(id, 'CardTypeStatus', bulkStatus)
    }
    setSelected(new Set())
    setBulkType('')
    setBulkStatus('')
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
    const def = { fsearch: '', fstatus: 'New', fcardtype: '' }
    setFilters(def); setApplied(def); setPage(1)
  }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {/* Type Count Summary */}
      {typeCounts.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {typeCounts.map(tc => (
            <span key={tc.CardType} className="badge" style={{ ...CARDTYPE_BADGE[tc.CardType], fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {tc.CardType ?? '(Unset)'}: {Number(tc.cnt).toLocaleString()}
            </span>
          ))}
          <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
            Total: {total.toLocaleString()}
          </span>
        </div>
      )}

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
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Card Type</label>
          <select className="opp-filter" value={filters.fcardtype} onChange={e => setFilters(f => ({ ...f, fcardtype: e.target.value }))}>
            <option value="">All</option>
            {CARD_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
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
        <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'rgba(2,113,235,0.06)', borderRadius: 'var(--radius)', border: '1px solid var(--blue)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--blue)' }}>{selected.size} selected</span>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Card Type</label>
            <select className="opp-filter" value={bulkType} onChange={e => setBulkType(e.target.value)}>
              <option value="">— select —</option>
              {CARD_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Status</label>
            <select className="opp-filter" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              <option value="">— select —</option>
              {STATUS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button className="btn-save" onClick={applyBulk} disabled={!bulkType && !bulkStatus}>Apply to Selected</button>
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
                  <SortTh col="CardType" label="Card Type" />
                  <th style={{ minWidth: 160 }}>Parallel/Insert Variation</th>
                  <th style={{ minWidth: 140 }}>Insert Name</th>
                  <SortTh col="TotalCards" label="Total Cards" />
                  <SortTh col="CardTypeStatus" label="Status" />
                  <th style={{ textAlign: 'center' }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr><td colSpan={8} className="opp-empty">No records match the current filters.</td></tr>
                )}
                {sortedRows.map(row => (
                  <tr
                    key={row.id}
                    style={{
                      ...(CARDTYPE_STYLES[row.CardType] ?? {}),
                      opacity: fadingOut.has(row.id) ? 0 : 1,
                      transition: 'opacity 0.5s ease',
                    }}
                  >
                    <td style={{ position: 'sticky', left: 0, background: CARDTYPE_STYLES[row.CardType]?.background ?? 'var(--card)', zIndex: 10 }}>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td style={{ position: 'sticky', left: 32, background: CARDTYPE_STYLES[row.CardType]?.background ?? 'var(--card)', zIndex: 10, fontWeight: 500, fontSize: '0.85rem' }}>
                      {row.SetName}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="badge" style={{ ...CARDTYPE_BADGE[row.CardType], fontSize: '0.7rem' }}>{row.CardType}</span>
                        <select
                          value={row.CardType}
                          onChange={e => saveField(row.id, 'CardType', e.target.value)}
                          style={SELECT_STYLE}
                        >
                          {CARD_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>
                      <EditableText rowId={row.id} column="ParallelInsertVariation" initialValue={row.ParallelInsertVariation} onSave={saveField}
                        onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); e.target.closest('tr').querySelectorAll('input[type=text]')[1]?.focus() } }}
                      />
                    </td>
                    <td>
                      <EditableText rowId={row.id} column="InsertName" initialValue={row.InsertName} onSave={saveField} />
                    </td>
                    <td>
                      <EditableNumber rowId={row.id} column="TotalCards" initialValue={row.TotalCards} onSave={saveField} />
                    </td>
                    <td>
                      <select
                        value={row.CardTypeStatus}
                        onChange={e => saveField(row.id, 'CardTypeStatus', e.target.value)}
                        style={SELECT_STYLE}
                      >
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
