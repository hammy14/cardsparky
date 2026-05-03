import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API } from '../../config/api'

function fcur(n) { return '$' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fnum(n) { return Number(n ?? 0).toLocaleString() }
function fpct(n) { return Number(n ?? 0).toFixed(1) + '%' }

function exportCSV(rows, totalCards) {
  const headers = ['Sport', 'Total Cards', '%', 'Total Value', 'Total Cost', 'Profit/Loss', 'Avg Value', 'Avg Cost']
  const data = rows.map(r => {
    const pct    = totalCards > 0 ? (r.TotalCards / totalCards * 100).toFixed(1) : 0
    const avg    = r.TotalCards > 0 ? r.TotalValue / r.TotalCards : 0
    const avgCost = r.TotalCards > 0 ? r.TotalCost / r.TotalCards : 0
    const pl     = r.TotalValue - r.TotalCost
    return [r.Sport, r.TotalCards, pct + '%', fcur(r.TotalValue), fcur(r.TotalCost), fcur(pl), fcur(avg), fcur(avgCost)]
  })
  const csv = [headers, ...data].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'all_card_summary.csv'
  a.click()
}

export default function AllCardSummary() {
  const { currentUser } = useAuth()
  const owner = currentUser?.owner ?? currentUser?.name ?? ''

  const [rows, setRows]       = useState([])
  const [totals, setTotals]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [sortCol, setSortCol] = useState('Sport')
  const [sortDir, setSortDir] = useState('asc')

  const fetchData = useCallback(() => {
    if (!owner) return
    setLoading(true)
    fetch(`${API.MYCARDS}/summary?owner=${encodeURIComponent(owner)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setRows(d.rows)
        setTotals(d.totals)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [owner])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const totalCards = Number(totals?.TotalCards ?? 0)
  const totalValue = Number(totals?.TotalValue ?? 0)
  const totalCost  = Number(totals?.TotalCost ?? 0)
  const totalPL    = totalValue - totalCost
  const maxValue   = Math.max(...rows.map(r => Number(r.TotalValue ?? 0)), 0)

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

  if (!owner)        return <div className="opp-empty">No user logged in.</div>
  if (loading)       return <div className="opp-loading">⏳ Loading...</div>
  if (error)         return <div className="opp-error">⚠️ {error}</div>
  if (!rows.length)  return <div className="opp-empty">No card data found for {owner}.</div>

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Cards',   value: fnum(totalCards),  accent: 'var(--blue)' },
          { label: 'Total Value',   value: fcur(totalValue),  accent: 'var(--green)' },
          { label: 'Total Cost',    value: fcur(totalCost),   accent: 'var(--orange)' },
          { label: 'Profit / Loss', value: fcur(totalPL),     accent: totalPL >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Avg Value',     value: fcur(totalCards > 0 ? totalValue / totalCards : 0), accent: 'var(--purple)' },
          { label: 'Sports',        value: fnum(rows.length), accent: 'var(--blue)' },
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

      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn-save" onClick={() => exportCSV(rows, totalCards)}>⬇ Export CSV</button>
      </div>

      {/* Table */}
      <div className="opp-section">
        <div className="opp-table-wrap">
          <table className="opp-table">
            <thead className="sticky-header">
              <tr>
                <SortTh col="Sport"      label="Sport"           style={{ minWidth: 140 }} />
                <SortTh col="TotalCards" label="Total Cards"     style={{ textAlign: 'right' }} />
                <th style={{ minWidth: 140 }}>% of Collection</th>
                <SortTh col="TotalValue" label="Total Value"     style={{ textAlign: 'right' }} />
                <SortTh col="TotalCost"  label="Total Cost"      style={{ textAlign: 'right' }} />
                <th style={{ textAlign: 'right' }}>Profit / Loss</th>
                <th style={{ textAlign: 'right' }}>Avg Value</th>
                <th style={{ textAlign: 'right' }}>Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => {
                const pct      = totalCards > 0 ? (row.TotalCards / totalCards * 100) : 0
                const avgValue = row.TotalCards > 0 ? row.TotalValue / row.TotalCards : 0
                const avgCost  = row.TotalCards > 0 ? row.TotalCost  / row.TotalCards : 0
                const pl       = Number(row.TotalValue) - Number(row.TotalCost)
                const isTop    = Number(row.TotalValue) === maxValue

                return (
                  <tr key={i} style={{ background: isTop ? 'rgba(3,194,82,0.06)' : undefined }}>
                    <td style={{ fontWeight: 600 }}>
                      {isTop && <span style={{ marginRight: '0.4rem' }}>🏆</span>}
                      {row.Sport}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--blue)', fontWeight: 600 }}>{fnum(row.TotalCards)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36 }}>{fpct(pct)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{fcur(row.TotalValue)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fcur(row.TotalCost)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {pl >= 0 ? '+' : ''}{fcur(pl)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{fcur(avgValue)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fcur(avgCost)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: 'rgba(2,113,235,0.06)' }}>
                <td>Totals</td>
                <td style={{ textAlign: 'right', color: 'var(--blue)' }}>{fnum(totalCards)}</td>
                <td style={{ textAlign: 'right' }}>100%</td>
                <td style={{ textAlign: 'right', color: 'var(--green)' }}>{fcur(totalValue)}</td>
                <td style={{ textAlign: 'right' }}>{fcur(totalCost)}</td>
                <td style={{ textAlign: 'right', color: totalPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {totalPL >= 0 ? '+' : ''}{fcur(totalPL)}
                </td>
                <td style={{ textAlign: 'right' }}>{fcur(totalCards > 0 ? totalValue / totalCards : 0)}</td>
                <td style={{ textAlign: 'right' }}>{fcur(totalCards > 0 ? totalCost / totalCards : 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
