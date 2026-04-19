import { useState } from 'react'

const KEY = 'cs_rotation_settings'
const DEFAULTS = { autoRotate: true, interval: 8, showOnHome: true }

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) } }
  catch { return DEFAULTS }
}

export default function RotationSettings() {
  const [settings, setSettings] = useState(load)

  function handleChange(key, value) {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    localStorage.setItem(KEY, JSON.stringify(updated))
  }

  return (
    <div className="opp-section">
      <div className="opp-header"><h3>🔄 Rotation Settings</h3></div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.autoRotate} onChange={e => handleChange('autoRotate', e.target.checked)} />
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Auto-rotate tips</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automatically cycle through tips on a timer</div>
          </div>
        </label>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem' }}>
            Rotation interval: <strong>{settings.interval} seconds</strong>
          </label>
          <input
            type="range" min={3} max={30} step={1}
            value={settings.interval}
            onChange={e => handleChange('interval', Number(e.target.value))}
            disabled={!settings.autoRotate}
            style={{ width: '100%', maxWidth: 300 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 300, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>3s</span><span>30s</span>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.showOnHome} onChange={e => handleChange('showOnHome', e.target.checked)} />
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Show tips on Home page</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display rotating tip card on the Home tab</div>
          </div>
        </label>

      </div>
    </div>
  )
}
