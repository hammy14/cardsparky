import { useState } from 'react'

export default function MainLayout({ tabs, activeTab, onTabChange, topbarLeft, topbarRight, footer, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="layout">
      {/* Top bar */}
      <header className="layout-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
            {collapsed ? '▶' : '◀'}
          </button>
          <div className="layout-topbar-left">{topbarLeft}</div>
        </div>
        <div className="layout-topbar-right">{topbarRight}</div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        {tabs && (
          <nav className={`layout-sidebar ${collapsed ? 'layout-sidebar-collapsed' : ''}`}>
            {tabs.map(t => (
              <button
                key={t.key}
                className={`sidebar-item ${activeTab === t.key ? 'sidebar-item-active' : ''}`}
                onClick={() => onTabChange(t.key)}
                title={collapsed ? t.label : undefined}
              >
                <span className="sidebar-icon">{t.icon}</span>
                {!collapsed && <span className="sidebar-label">{t.label}</span>}
              </button>
            ))}
          </nav>
        )}

        {/* Main content */}
        <main className="layout-main">
          {children}
          {footer && (
            <footer className="layout-footer">
              <div className="layout-footer-text">{footer}</div>
            </footer>
          )}
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

export function Breadcrumb({ crumbs }) {
  return (
    <nav className="breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep">›</span>}
          {c.onClick
            ? <button className="breadcrumb-link" onClick={c.onClick}>{c.label}</button>
            : <span className="breadcrumb-current">{c.label}</span>
          }
        </span>
      ))}
    </nav>
  )
}
