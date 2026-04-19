import { useState } from 'react'
import { sports } from '../../config/sports'

const DB_OVERRIDES_KEY = 'cs_db_overrides'

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(DB_OVERRIDES_KEY)) ?? {} }
  catch { return {} }
}

export default function DatabaseManager() {
  const [overrides, setOverrides] = useState(loadOverrides)
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting] = useState(null)

  function getDb(key) {
    return overrides[key] ?? sports[key].db
  }

  function startEdit(key) {
    setEditing(key)
    setEditValue(getDb(key))
  }

  function saveEdit(key) {
    const updated = { ...overrides, [key]: editValue.trim() || sports[key].db }
    setOverrides(updated)
    localStorage.setItem(DB_OVERRIDES_KEY, JSON.stringify(updated))
    setEditing(null)
  }

  function resetDb(key) {
    const updated = { ...overrides }
    delete updated[key]
    setOverrides(updated)
    localStorage.setItem(DB_OVERRIDES_KEY, JSON.stringify(updated))
    setEditing(null)
  }

  async function testConnection(key) {
    const db = getDb(key)
    setTesting(key)
    try {
      const res = await fetch(`http://localhost:3001/api/${db}/test`)
      const data = await res.json()
      setStatuses(s => ({ ...s, [key]: res.ok ? 'ok' : 'error' }))
      if (!res.ok) console.error(db, data.error)
    } catch (err) {
      setStatuses(s => ({ ...s, [key]: 'error' }))
      console.error(db, err.message)
    }
    setTesting(null)
  }

  async function testAll() {
    for (const key of Object.keys(sports)) {
      await testConnection(key)
    }
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>🗄️ Database Management</h3>
        <button className="btn-save" onClick={testAll}>Test All</button>
      </div>
      <div className="opp-table-wrap">
        <table className="opp-table">
          <thead>
            <tr>
              <th>Sport</th>
              <th>Database Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sports).map(([key, sport]) => {
              const status = statuses[key]
              const isEditing = editing === key
              const isOverridden = !!overrides[key]

              return (
                <tr key={key}>
                  <td>{sport.icon} {sport.label}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          className="cell-edit"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(key); if (e.key === 'Escape') setEditing(null) }}
                          autoFocus
                          style={{ maxWidth: 180 }}
                        />
                        <button className="btn-save" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => saveEdit(key)}>✓</button>
                        <button className="btn-cancel" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditing(null)}>✗</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{getDb(key)}</span>
                        {isOverridden && (
                          <span className="badge" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--purple)', fontSize: '0.7rem' }}>edited</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {!status && <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-muted)' }}>Not tested</span>}
                    {status === 'ok' && <span className="badge" style={{ background: 'rgba(3,194,82,0.1)', color: 'var(--green)' }}>✓ Connected</span>}
                    {status === 'error' && <span className="badge" style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--red)' }}>✗ Failed</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {!isEditing && <button className="icon-btn" onClick={() => startEdit(key)}>✏️</button>}
                      {isOverridden && !isEditing && <button className="icon-btn" title="Reset to default" onClick={() => resetDb(key)}>↩️</button>}
                      <button className="icon-btn" onClick={() => testConnection(key)} disabled={testing === key}>
                        {testing === key ? '...' : '🔌'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
