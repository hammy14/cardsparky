import { useState, useEffect, useCallback, useRef } from 'react'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable } from '../../components/Skeleton'
import DensityToggle from '../../components/DensityToggle'
import useDensity from '../../hooks/useDensity'
import useColResize from '../../hooks/useColResize.jsx'
import { API } from '../../config/api'

const PASSFAIL_OPTS = ['Pass', 'Fail', 'PassPrice', 'PassPrice0', 'Complete', 'Duplicate', 'Error']

const ROW_STYLES = {
  'PassPrice':  { background: 'rgba(3,194,82,0.06)' },
  'PassPrice0': { background: 'rgba(229,62,62,0.06)' },
  'Complete':   { background: 'rgba(2,113,235,0.06)' },
}

const SELECT_STYLE = {
  padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)',
  borderRadius: 4, fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)'
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="panel-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal">
        <div className="modal-header"><h3>⚠️ Confirm Delete</h3></div>
        <div className="modal-body"><p>{message}</p></div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-save" style={{ background: 'var(--red)' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function EditableNumber({ rowId, column, initialValue, onSave, onKeyDown, inputRef }) {
  const [val, setVal] = useState(initialValue ?? 0)
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'

  async function handleBlur() {
    const parsed = parseInt(val) || 0
    setVal(parsed)
    setStatus('saving')
    try {
      await onSave(rowId, column, parsed)
      setStatus('saved')
      setTimeout(() => setStatus(null), 1000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  const bg = status === 'saving' ? 'rgba(2,113,235,0.08)'
           : status === 'error'  ? 'rgba(229,62,62,0.12)'
           : 'var(--card)'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        style={{ width: 75, textAlign: 'right', padding: '0.25rem 0.4rem', border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: '0.8rem', background: bg, color: 'var(--text)', transition: 'background 0.3s' }}
      />
      {status === 'saved' && <span className="save-indicator">✓</span>}
    </div>
  )
}

export default function NumbersUpdate({ sport }) {
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [perpage, setPerpage]     = useState(100)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [filters, setFilters]     = useState({ fpriceinfo: '', fcards: '', fpassfail: '', fsearch: '' })
  const [applied, setApplied]     = useState({ fpriceinfo: '', fcards: '', fpassfail: '', fsearch: '' })
  const [sortCol, setSortCol]     = useState('SetName')
  const [sortDir, setSortDir]     = useState('asc')
  const [selected, setSelected]   = useState(new Set())
  const [bulkPF, setBulkPF]       = useState('')
  const [bulkPI, setBulkPI]       = useState('')
  const [confirm, setConfirm]     = useState(null)
  const [jumpPage, setJumpPage]   = useState('')
  const [unsaved, setUnsaved]     = useState(new Set())
  const [density, setDensity]     = useDensity()
  const { resizeHandle, colStyle } = useColResize({ SetName: 240, TotalValue: 100, TotalCards: 90, Memorabilia: 70, Rookie: 70, Autograph: 70, Serial: 70 })

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, perpage, ...applied })
    fetch(`${API.BASE}/api/${sport.db}/numbers/${sport.table}?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setSelected(new Set())
        setUnsaved(new Set())
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sport.db, sport.table, page, perpage, applied])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveField(id, column, value) {
    setUnsaved(s => new Set([...s, id]))
    const res = await fetch(`${API.BASE}/api/${sport.db}/numbers/${sport.table}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    if (data.deleted) {
      setRows(r => r.filter(row => row.id !== id))
    } else {
      setRows(r => r.map(row => row.id === id ? { ...row, [column]: value } : row))
    }
    setUnsaved(s => { const n = new Set(s); n.delete(id); return n })
    return data
  }

  function handlePassFailChange(id, value, setName) {
    if (value === 'Duplicate') {
      setConfirm({ id, setName })
    } else {
      saveField(id, 'PassFail', value)
      setRows(r => r.map(row => row.id === id ? { ...row, PassFail: value } : row))
    }
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

  async function applyBulk() {
    for (const id of selected) {
      if (bulkPF) await saveField(id, 'PassFail', bulkPF)
      if (bulkPI !== '') await saveField(id, 'PriceInfo', bulkPI)
    }
    setSelected(new Set())
    setBulkPF('')
    setBulkPI('')
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
    const empty = { fpriceinfo: '', fcards: '', fpassfail: '', fsearch: '' }
    setFilters(empty); setApplied(empty); setPage(1)
  }

  if (error) return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          message={`Delete "${confirm.setName}"? This cannot be undone.`}
          onConfirm={() => { saveField(confirm.id, 'PassFail', 'Duplicate'); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Filters */}
      <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Search Set Name</label>
          <input className="opp-search" placeholder="Search..." value={filters.fsearch} onChange={e => setFilters(f => ({ ...f, fsearch: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleApply()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Price Info</label>
          <select className="opp-filter" value={filters.fpriceinfo} onChange={e => setFilters(f => ({ ...f, fpriceinfo: e.target.value }))}>
            <option value="">All</option>
            <option value="1">1</option>
            <option value="0">0</option>
          </select>
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
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pass / Fail</label>
          <select className="opp-filter" value={filters.fpassfail} onChange={e => setFilters(f => ({ ...f, fpassfail: e.target.value }))}>
            <option value="">All</option>
            {PASSFAIL_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
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
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Pass/Fail</label>
            <select className="opp-filter" value={bulkPF} onChange={e => setBulkPF(e.target.value)}>
              <option value="">— select —</option>
              {PASSFAIL_OPTS.filter(o => o !== 'Duplicate').map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Set Price Info</label>
            <select className="opp-filter" value={bulkPI} onChange={e => setBulkPI(e.target.value)}>
              <option value="">— select —</option>
              <option value="1">1</option>
              <option value="0">0</option>
            </select>
          </div>
          <button className="btn-save" onClick={applyBulk} disabled={!bulkPF && bulkPI === ''}>Apply to Selected</button>
          <button className="btn-cancel" onClick={() => setSelected(new Set())}>Deselect All</button>
        </div>
      )}

      {/* Table */}
      <div className="opp-section">
        <div className="opp-toolbar-sticky">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{total.toLocaleString()} records</span>
          <div style={{ flex: 1 }} />
          <DensityToggle density={density} onChange={setDensity} />
        </div>
        <div className="opp-table-wrap" style={{ maxHeight: '65vh' }}>
          {loading ? <SkeletonTable rows={8} cols={11} /> : sortedRows.length === 0 ? (
            <EmptyState icon="🔍" title="No records found" message="Try adjusting your filters or clearing the search." />
          ) : (
            <table className={`opp-table table-density-${density}`}>
              <thead className="sticky-header">
                <tr>
                  <th style={{ width: 32, position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 11 }}>
                    <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} />
                  </th>
                  <th data-col="SetName" className="frozen-col sortable" style={{ ...colStyle('SetName'), minWidth: 200, left: 32, background: 'var(--gray-50)', zIndex: 11 }} onClick={() => handleSort('SetName')}>
                    Set Name {sortCol === 'SetName' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    {resizeHandle('SetName')}
                  </th>
                  <th data-col="PriceInfo">Price Info{resizeHandle('PriceInfo')}</th>
                  <th data-col="TotalValue"  className="sortable" style={colStyle('TotalValue')}  onClick={() => handleSort('TotalValue')}>Total Value {sortCol === 'TotalValue' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}{resizeHandle('TotalValue')}</th>
                  <th data-col="TotalCards"  className="sortable" style={colStyle('TotalCards')}  onClick={() => handleSort('TotalCards')}>Total Cards {sortCol === 'TotalCards' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}{resizeHandle('TotalCards')}</th>
                  <th data-col="Memorabilia" style={colStyle('Memorabilia')}>Mem{resizeHandle('Memorabilia')}</th>
                  <th data-col="Rookie"      style={colStyle('Rookie')}>Rookie{resizeHandle('Rookie')}</th>
                  <th data-col="Autograph"   style={colStyle('Autograph')}>Auto{resizeHandle('Autograph')}</th>
                  <th data-col="Serial"      style={colStyle('Serial')}>Serial{resizeHandle('Serial')}</th>
                  <SortTh col="PassFail" label="Pass/Fail" />
                  <th style={{ textAlign: 'center' }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, rowIdx) => (
                  <tr key={row.id} style={{ ...(ROW_STYLES[row.PassFail] ?? {}), outline: unsaved.has(row.id) ? '1px solid var(--blue)' : 'none' }}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--card)', zIndex: 10 }}>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td data-col="SetName" className="frozen-col" style={{ left: 32, background: ROW_STYLES[row.PassFail]?.background ?? 'var(--card)', fontWeight: 500, fontSize: '0.85rem' }}>
                      {unsaved.has(row.id) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block', marginRight: 6 }} />}
                      {row.SetName}
                    </td>
                    <td>
                      <select defaultValue={row.PriceInfo} onChange={e => saveField(row.id, 'PriceInfo', e.target.value)} style={SELECT_STYLE}>
                        <option value="1">1</option>
                        <option value="0">0</option>
                      </select>
                    </td>
                    <td>
                      <EditableNumber rowId={row.id} column="TotalValue" initialValue={row.TotalValue} onSave={saveField}
                        onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); document.querySelectorAll(`[data-row="${rowIdx}"]`)[1]?.focus() } }} />
                    </td>
                    <td>
                      <EditableNumber rowId={row.id} column="TotalCards" initialValue={row.TotalCards} onSave={saveField}
                        onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); document.querySelectorAll(`[data-row="${rowIdx}"]`)[2]?.focus() } }} />
                    </td>
                    <td><EditableNumber rowId={row.id} column="Memorabilia" initialValue={row.Memorabilia} onSave={saveField} /></td>
                    <td><EditableNumber rowId={row.id} column="Rookie"      initialValue={row.Rookie}      onSave={saveField} /></td>
                    <td><EditableNumber rowId={row.id} column="Autograph"   initialValue={row.Autograph}   onSave={saveField} /></td>
                    <td><EditableNumber rowId={row.id} column="Serial"      initialValue={row.Serial}      onSave={saveField} /></td>
                    <td>
                      <select defaultValue={row.PassFail} onChange={e => handlePassFailChange(row.id, e.target.value, row.SetName)} style={SELECT_STYLE}>
                        {PASSFAIL_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.Link
                        ? <button className="btn-save" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => window.open(row.Link, '_blank', 'width=1200,height=800')}>Open</button>
                        : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalpages}
            </span>
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
