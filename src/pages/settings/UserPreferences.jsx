import { useState } from 'react'

const KEY = 'cs_user_prefs'
const DEFAULTS = { defaultTab: 'home', defaultSport: '' }

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) } }
  catch { return DEFAULTS }
}

const TABS = [
  { value: 'home', label: 'Home' },
  { value: 'collecting101', label: 'Card Collecting 101' },
  { value: 'research', label: 'Research' },
  { value: 'mycards', label: 'My Cards' },
  { value: 'data', label: 'Data' },
]

export default function UserPreferences() {
  const [prefs, setPrefs] = useState(load)
  const [saved, setSaved] = useState(false)

  function handleChange(key, value) {
    setPrefs(p => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(KEY, JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="opp-section">
      <div className="opp-header"><h3>👤 User Preferences</h3></div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 400 }}>

        <div className="modal-field">
          <label>Default landing tab</label>
          <select className="opp-filter" style={{ width: '100%' }} value={prefs.defaultTab} onChange={e => handleChange('defaultTab', e.target.value)}>
            {TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="modal-field">
          <label>Default sport (Research tab)</label>
          <input
            className="opp-search"
            style={{ width: '100%' }}
            placeholder="e.g. baseball"
            value={prefs.defaultSport}
            onChange={e => handleChange('defaultSport', e.target.value)}
          />
        </div>

        <button className="btn-save" style={{ alignSelf: 'flex-start' }} onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
