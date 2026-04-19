import { useState } from 'react'
import { useAuth, ALL_TABS } from '../../context/AuthContext'

const ROLES = ['guest', 'user', 'admin']
const ROLE_LABELS = { guest: '👤 Guest', user: '🙋 User', admin: '🛡️ Admin' }
const ROLE_COLORS = {
  guest: 'var(--text-muted)',
  user:  'var(--blue)',
  admin: 'var(--orange)',
}

export default function TabVisibility() {
  const { roleTabs, setRoleTabs } = useAuth()
  const [local, setLocal] = useState(() => ({
    guest: [...(roleTabs.guest ?? [])],
    user:  [...(roleTabs.user  ?? [])],
    admin: [...(roleTabs.admin ?? [])],
  }))
  const [saved, setSaved] = useState(false)

  function toggle(role, tabKey) {
    setLocal(prev => {
      const current = prev[role]
      const next = current.includes(tabKey)
        ? current.filter(k => k !== tabKey)
        : [...current, tabKey]
      return { ...prev, [role]: next }
    })
    setSaved(false)
  }

  function isLocked(role, tabKey) {
    const tab = ALL_TABS.find(t => t.key === tabKey)
    return tab?.locked?.includes(role)
  }

  function handleSave() {
    setRoleTabs(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    const reset = {
      guest: ['home', 'learn101'],
      user:  ['home', 'learn101', 'research', 'mycards', 'data'],
      admin: ['home', 'learn101', 'research', 'mycards', 'data', 'settings'],
    }
    setLocal(reset)
    setRoleTabs(reset)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>👁️ Tab Visibility</h3>
        <span className="record-count">Controls which sidebar tabs each role can see</span>
      </div>

      <div style={{ padding: 'var(--sp-6)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-4)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 180 }}>
                Tab
              </th>
              {ROLES.map(role => (
                <th key={role} style={{ textAlign: 'center', padding: 'var(--sp-2) var(--sp-4)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: ROLE_COLORS[role], fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_TABS.map((tab, i) => (
              <tr key={tab.key} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--text-base)', fontWeight: 500 }}>
                  <span style={{ marginRight: 'var(--sp-2)' }}>{tab.icon}</span>
                  {tab.label}
                </td>
                {ROLES.map(role => {
                  const locked = isLocked(role, tab.key)
                  const checked = local[role].includes(tab.key)
                  return (
                    <td key={role} style={{ textAlign: 'center', padding: 'var(--sp-3) var(--sp-4)' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: locked ? 'not-allowed' : 'pointer' }} title={locked ? `Always visible for ${role}` : ''}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() => !locked && toggle(role, tab.key)}
                          style={{ width: 16, height: 16, accentColor: ROLE_COLORS[role], cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1 }}
                        />
                      </label>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ padding: '0 var(--sp-6) var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <span style={{ opacity: 0.4 }}>☑ Locked</span>
        <span>— Some tabs are always visible for certain roles and cannot be hidden</span>
      </div>

      <div style={{ padding: 'var(--sp-4) var(--sp-6)', borderTop: '1px solid var(--border)', display: 'flex', gap: 'var(--sp-3)' }}>
        <button className="btn-save" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
        <button className="btn-cancel" onClick={handleReset}>Reset to Defaults</button>
      </div>
    </div>
  )
}
