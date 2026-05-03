import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { SkeletonKpis, SkeletonTable, AnimatedKpiCard } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import { API } from '../../config/api'
import DensityToggle from '../../components/DensityToggle'
import useDensity from '../../hooks/useDensity'
import useColResize from '../../hooks/useColResize.jsx'

const SPORTS = ['Baseball','Basketball','Football','Soccer','Hockey','MMA','Wrestling','Racing','Formula 1','Boxing','Golf','Tennis','Pokemon','Magic','YuGiOh','Funko']
const ALLOWED_SORTS = ['Year','Card','Name','Number','Qty','Value','Cost']

function fcur(n) { return '$' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fnum(n) { return Number(n ?? 0).toLocaleString() }

function EditableCell({ rowId, column, initialValue, type = 'string', owner, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(initialValue ?? '')
  const [status, setStatus] = useState(null)

  async function handleBlur() {
    setEditing(false)
    if (String(val) === String(initialValue ?? '')) return
    setStatus('saving')
    try {
      await fetch(`${API.MYCARDS}/individual/${rowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column, value: val, owner })
      })
      setStatus('saved')
      onSaved(rowId, column, val)
      setTimeout(() => setStatus(null), 1000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  const bg = status === 'saving' ? 'rgba(2,113,235,0.08)'
           : status === 'error'  ? 'rgba(229,62,62,0.12)'
           : 'transparent'

  if (editing) {
    return (
      <input
        autoFocus
        type={type === 'float' || type === 'int' ? 'number' : 'text'}
        step={type === 'float' ? '0.01' : undefined}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') { setVal(initialValue ?? ''); setEditing(false) } }}
        style={{ width: '100%', minWidth: 60, padding: '0.15rem 0.3rem', border: '1px solid var(--blue)', borderRadius: 3, fontSize: '0.8rem', background: 'var(--card)', color: 'var(--text)' }}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ cursor: 'pointer', display: 'block', position: 'relative', padding: '0.15rem 0.3rem', borderRadius: 3, background: bg, transition: 'background 0.3s', borderBottom: '1px dashed var(--gray-200)' }}
    >
      {type === 'float' ? fcur(val) : (val || '—')}
      {status === 'saved' && <span className="save-indicator">✓</span>}
    </span>
  )
}

export default function IndividualCards() {
  const { currentUser } = useAuth()
  const owner = currentUser?.owner ?? currentUser?.name ?? ''

  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [stats, setStats]     = useState(null)
  const [page, setPage]       = useState(1)
  const [perpage, setPerpage] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [sortCol, setSortCol] = useState('Card')
  const [sortDir, setSortDir] = useState('desc')
  const [jumpPage, setJumpPage] = useState('')
  const [filters, setFilters] = useState({ sport: '', name: '' })
  const [applied, setApplied] = useState({ sport: '', name: '' })
  const [density, setDensity] = useDensity()
  const { resizeHandle, colStyle } = useColResize({ Name: 140, Card: 140, Year: 60, Number: 60, Type: 100, Qty: 60, Value: 90, Cost: 90 })

  const totalpages = Math.ceil(total / perpage)

  const fetchData = useCallback(() => {
    if (!applied.sport) return
    setLoading(true)
    const params = new URLSearchParams({ owner, page, perpage, sort: sortCol, dir: sortDir, sport: applied.sport, name: applied.name })
    fetch(`${API.MYCARDS}/individual?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotal(d.total)
        setStats(d.stats)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [owner, page, perpage, sortCol, sortDir, applied])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function handleApply() { setApplied({ ...filters }); setPage(1) }
  function handleClear() { setFilters({ sport: '', name: '' }); setApplied({ sport: '', name: '' }); setPage(1) }

  function handleSaved(id, column, value) {
    setRows(r => r.map(row => row.ID === id ? { ...row, [column]: value } : row))
  }

  function SortTh({ col, label, style = {} }) {
    return (
      <th className="sortable" style={style} onClick={() => handleSort(col)}>
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </th>
    )
  }

  if (!owner) return <div className="opp-empty">No user logged in.</div>
  if (error)  return <div className="opp-error">⚠️ {error}</div>

  return (
    <div>
      {/* Filters */}
      <div className="opp-toolbar" style={{ marginBottom: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sport</label>
          <select className="opp-filter" value={filters.sport} onChange={e => setFilters(f => ({ ...f, sport: e.target.value }))}>
            <option value="">Select a sport</option>
            <option value="All">All</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Player Name</label>
          <input className="opp-search" placeholder="e.g. Jordan" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleApply()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Per Page</label>
          <select className="opp-filter" value={perpage} onChange={e => { setPerpage(Number(e.target.value)); setPage(1) }}>
            {[25, 50, 100, 150, 200].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button className="btn-save" onClick={handleApply}>Apply</button>
          <button className="btn-cancel" onClick={handleClear}>Clear</button>
        </div>
        {total > 0 && <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>{total.toLocaleString()} cards</div>}
      </div>

      {!applied.sport && (
        <div className="opp-empty" style={{ background: 'rgba(2,113,235,0.06)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
          Please select a sport to view your cards.
        </div>
      )}

      {applied.sport && stats && (
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          {loading
            ? <SkeletonKpis count={6} />
            : <div className="kpi-grid">
                <AnimatedKpiCard label="Total Cards"  rawValue={stats.total}                          accent="var(--blue)" />
                <AnimatedKpiCard label="Rookie Cards" rawValue={stats.rookies}                        accent="var(--green)" />
                <AnimatedKpiCard label="Serial #"     rawValue={stats.serial}                        accent="var(--purple)" />
                <AnimatedKpiCard label="Total Value"  rawValue={stats.value_sum}                     accent="var(--green)"  isFloat />
                <AnimatedKpiCard label="Total Cost"   rawValue={stats.cost_sum}                      accent="var(--orange)" isFloat />
                <AnimatedKpiCard label="Profit/Loss"  rawValue={stats.value_sum - stats.cost_sum}    accent={(stats.value_sum - stats.cost_sum) >= 0 ? 'var(--green)' : 'var(--red)'} isFloat />
              </div>
          }
        </div>
      )}

      {applied.sport && (
        <div className="opp-section">
          <div className="opp-toolbar-sticky">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {total > 0 ? <>{total.toLocaleString()} cards</> : 'No cards'}
            </span>
            <div style={{ flex: 1 }} />
            <DensityToggle density={density} onChange={setDensity} />
          </div>
          <div className="opp-table-wrap" style={{ maxHeight: '65vh' }}>
            {loading ? <SkeletonTable rows={10} cols={10} /> : rows.length === 0 ? (
              <EmptyState icon="🃏" title="No cards found" message="Try adjusting your filters or search for a different player name." />
            ) : (
              <table className={`opp-table table-density-${density}`}>
                <thead className="sticky-header">
                  <tr>
                    <th data-col="Year"   style={{ ...colStyle('Year'),   minWidth: 60  }}><SortTh col="Year"   label="Year"  />{resizeHandle('Year')}</th>
                    <th data-col="Card"   style={{ ...colStyle('Card'),   minWidth: 140 }} className="frozen-col" ><SortTh col="Card"   label="Card"  />{resizeHandle('Card')}</th>
                    <th data-col="Name"   style={{ ...colStyle('Name'),   minWidth: 140 }}><SortTh col="Name"   label="Name"  />{resizeHandle('Name')}</th>
                    <th data-col="Number" style={{ ...colStyle('Number'), minWidth: 60  }}><SortTh col="Number" label="#"     />{resizeHandle('Number')}</th>
                    <th data-col="Type"   style={{ ...colStyle('Type'),   minWidth: 100 }}>Type{resizeHandle('Type')}</th>
                    <th style={{ textAlign: 'center', minWidth: 40 }}>RC</th>
                    <th style={{ textAlign: 'center', minWidth: 60 }}>Serial</th>
                    <th data-col="Qty"   style={{ ...colStyle('Qty'),   textAlign: 'right' }}><SortTh col="Qty"   label="Qty"   />{resizeHandle('Qty')}</th>
                    <th data-col="Value" style={{ ...colStyle('Value'), textAlign: 'right' }}><SortTh col="Value" label="Value" />{resizeHandle('Value')}</th>
                    <th data-col="Cost"  style={{ ...colStyle('Cost'),  textAlign: 'right' }}><SortTh col="Cost"  label="Cost"  />{resizeHandle('Cost')}</th>
                    <th style={{ width: 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const needsUpdate = !row.UngradedPrice || Number(row.UngradedPrice) === 0
                    return (
                      <tr key={row.ID} style={{ background: needsUpdate ? 'rgba(229,62,62,0.05)' : undefined }}>
                        <td data-col="Year"  ><EditableCell rowId={row.ID} column="Year"           initialValue={row.Year}           type="int"    owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Card"   className="frozen-col" style={{ background: needsUpdate ? 'rgba(229,62,62,0.05)' : 'var(--card)', fontWeight: 500 }}><EditableCell rowId={row.ID} column="Card" initialValue={row.Card} type="string" owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Name"  ><EditableCell rowId={row.ID} column="Name"           initialValue={row.Name}           type="string" owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Number"><EditableCell rowId={row.ID} column="Number"         initialValue={row.Number}         type="string" owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Type"  ><EditableCell rowId={row.ID} column="Type"           initialValue={row.Type}           type="string" owner={owner} onSaved={handleSaved} /></td>
                        <td style={{ textAlign: 'center' }}>
                          {row.RookieCard == 1 ? <span className="badge" style={{ background: 'rgba(3,194,82,0.15)', color: 'var(--green)' }}>RC</span> : ''}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {Number(row.SerielNumbered) > 0 ? <span className="badge" style={{ background: 'rgba(13,148,136,0.15)', color: 'var(--purple)' }}>{row.SerielNumbered}</span> : ''}
                        </td>
                        <td data-col="Qty"   style={{ textAlign: 'right' }}><EditableCell rowId={row.ID} column="Qty"           initialValue={row.Qty}           type="int"   owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Value" style={{ textAlign: 'right' }}><EditableCell rowId={row.ID} column="UngradedPrice" initialValue={row.UngradedPrice} type="float" owner={owner} onSaved={handleSaved} /></td>
                        <td data-col="Cost"  style={{ textAlign: 'right' }}><EditableCell rowId={row.ID} column="Cost"          initialValue={row.Cost}          type="float" owner={owner} onSaved={handleSaved} /></td>
                        <td>
                          <div className="row-hover-actions">
                            <button className="row-hover-btn">✏️ Edit</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
      )}
    </div>
  )
}
