import { useState } from 'react'
import TipsManager from './TipsManager'
import RotationSettings from './RotationSettings'
import AnnouncementsManager from './AnnouncementsManager'

const TABS = [
  { key: 'announcements', label: '📢 Announcements' },
  { key: 'tips',          label: '💡 Tips' },
  { key: 'rotation',      label: '🔄 Rotation' },
]

export default function ContentManager() {
  const [active, setActive] = useState('announcements')
  return (
    <div>
      <nav className="sub-tabs" style={{ marginBottom: 'var(--sp-6)' }}>
        {TABS.map(t => (
          <button key={t.key} className={`sub-tab ${active === t.key ? 'sub-tab-active' : ''}`} onClick={() => setActive(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      {active === 'announcements' && <AnnouncementsManager />}
      {active === 'tips'          && <TipsManager />}
      {active === 'rotation'      && <RotationSettings />}
    </div>
  )
}
