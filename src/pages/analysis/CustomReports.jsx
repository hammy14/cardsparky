import { useState } from 'react'
import { sports } from '../../config/sports'

const PRESET_QUERIES = [
  { label: 'Sets with no Price Info',    sql: 'SELECT SetName, Category, Year FROM `{table}` WHERE PriceInfo = 0 ORDER BY SetName LIMIT 100' },
  { label: 'Sets with no Card List',     sql: 'SELECT SetName, Category, Year FROM `{table}` WHERE CardList = 0 ORDER BY SetName LIMIT 100' },
  { label: 'Top 20 by Total Value',      sql: 'SELECT SetName, TotalValue, TotalCards FROM `{table}` ORDER BY TotalValue DESC LIMIT 20' },
  { label: 'Sets by Year',               sql: 'SELECT Year, COUNT(*) AS Sets, SUM(TotalCards) AS Cards FROM `{table}` GROUP BY Year ORDER BY Year DESC' },
  { label: 'Category Summary',           sql: 'SELECT Category, COUNT(*) AS Sets, SUM(TotalCards) AS Cards, SUM(TotalValue) AS Value FROM `{table}` GROUP BY Category ORDER BY Sets DESC' },
  { label: 'PassFail Summary',           sql: 'SELECT PassFail, COUNT(*) AS Sets FROM `{table}` GROUP BY PassFail ORDER BY Sets DESC' },
]

export default function CustomReports() {
  const [selectedSport, setSelectedSport] = useState('')
  const [sql, setSql]                     = useState('')
  const [results, setResults]             = useState(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  const sport = sports[selectedSport]

  function applyPreset(preset) {
    if (!sport) return
    setSql(preset.sql.replace('{table}', sport.table))
  }

  async function runQuery() {
    if (!selectedSport || !sql.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch(`http://localhost:3001/api/${sport.db}/query?sql=${encodeURIComponent(sql)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  function exportCSV() {
    if (!results?.length) return
    const headers = Object.keys(results[0])
    const csv = [headers, ...results.map(r => headers.map(h => `"${r[h] ?? ''}"`))].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `report_${selectedSport}_${Date.now()}.csv`
    a.click()
  }

  return (
    <div>
      <div className="opp-section" style={{ marginBottom: '1.5rem' }}>
        <div className="opp-header"><h3>🔧 Custom Reports</h3></div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Sport selector */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sport / Database</label>
              <select className="opp-filter" style={{ width: '100%' }} value={selectedSport} onChange={e => { setSelectedSport(e.target.value); setResults(null); setError(null) }}>
                <option value="">Select a sport...</option>
                {Object.entries(sports).map(([key, s]) => (
                  <option key={key} value={key}>{s.icon} {s.label} ({s.db})</option>
                ))}
              </select>
            </div>
            {selectedSport && (
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Preset Queries</label>
                <select className="opp-filter" style={{ width: '100%' }} onChange={e => applyPreset(PRESET_QUERIES[e.target.value])} defaultValue="">
                  <option value="">Select a preset...</option>
                  {PRESET_QUERIES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* SQL editor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              SQL Query {sport && <span style={{ fontWeight: 400 }}>— Database: <strong>{sport.db}</strong>, Table: <strong>{sport.table}</strong></span>}
            </label>
            <textarea
              className="opp-search"
              rows={4}
              value={sql}
              onChange={e => setSql(e.target.value)}
              placeholder={`SELECT * FROM \`${sport?.table ?? 'TableName'}\` LIMIT 10`}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-save" onClick={runQuery} disabled={!selectedSport || !sql.trim() || loading}>
              {loading ? '⏳ Running...' : '▶ Run Query'}
            </button>
            {results?.length > 0 && (
              <button className="btn-cancel" onClick={exportCSV}>⬇ Export CSV</button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {error && <div className="opp-error">⚠️ {error}</div>}
      {results && (
        <div className="opp-section">
          <div className="opp-header">
            <h3>Results</h3>
            <span className="record-count">{results.length} rows</span>
          </div>
          {results.length === 0 ? (
            <div className="opp-empty">No results returned.</div>
          ) : (
            <div className="opp-table-wrap" style={{ maxHeight: '60vh' }}>
              <table className="opp-table">
                <thead className="sticky-header">
                  <tr>
                    {Object.keys(results[0]).map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} className="opp-row-clickable">
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{val ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
