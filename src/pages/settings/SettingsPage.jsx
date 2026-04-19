import { useState } from 'react'
import ContentManager from './ContentManager'
import TabVisibility from './TabVisibility'
import UserPreferences from './UserPreferences'
import DatabaseManager from './DatabaseManager'
import UserManagement from './UserManagement'
import LoginHistory from './LoginHistory'
import LogoSettings from './LogoSettings'
import AffiliateManager from './AffiliateManager'
import ProjectTracker from './ProjectTracker'

const NAV = [
  { key: 'content',       label: 'Content Management', icon: '📝' },
  { key: 'affiliate',     label: 'Affiliate Cards',     icon: '🔗' },
  { key: 'projects',      label: 'Project Tracker',     icon: '📋' },
  { key: 'tabvisibility', label: 'Tab Visibility',      icon: '👁️' },
  { key: 'logo',          label: 'Logo',                icon: '🃏' },
  { key: 'preferences',   label: 'User Preferences',   icon: '👤' },
  { key: 'databases',     label: 'Database Management', icon: '🗄️' },
  { key: 'users',         label: 'User Management',     icon: '👥' },
  { key: 'loginhistory',  label: 'Login History',       icon: '🔐' },
]

export default function SettingsPage() {
  const [active, setActive] = useState('content')

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Settings</div>
        {NAV.map(n => (
          <button
            key={n.key}
            className={`admin-nav-btn ${active === n.key ? 'admin-nav-active' : ''}`}
            onClick={() => setActive(n.key)}
          >
            <span className="admin-nav-icon">{n.icon}</span>
            <span className="admin-nav-label">{n.label}</span>
          </button>
        ))}
      </aside>
      <div className="admin-body">
        {active === 'content'       && <ContentManager />}
        {active === 'affiliate'     && <AffiliateManager />}
        {active === 'projects'      && <ProjectTracker />}
        {active === 'tabvisibility' && <TabVisibility />}
        {active === 'logo'          && <LogoSettings />}
        {active === 'preferences'   && <UserPreferences />}
        {active === 'databases'     && <DatabaseManager />}
        {active === 'users'         && <UserManagement />}
        {active === 'loginhistory'  && <LoginHistory />}
      </div>
    </div>
  )
}
