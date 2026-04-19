import { useState } from 'react'
import { PageHeader, Breadcrumb } from '../../components/MainLayout'
import CrossSportAnalytics from './CrossSportAnalytics'
import CustomReports from './CustomReports'
import SetCompletionTracker from './SetCompletionTracker'

const TABS = [
  { key: 'crosssport', label: 'Cross-Sport Analytics', icon: '📊' },
  { key: 'pricetrack', label: 'Price Tracking',        icon: '📈' },
  { key: 'completion', label: 'Set Completion',        icon: '✅' },
  { key: 'custom',     label: 'Custom Reports',        icon: '🔧' },
]

export default function AnalysisPage() {
  const [active, setActive] = useState('crosssport')
  const activeTab = TABS.find(t => t.key === active)

  return (
    <div>
      <PageHeader
        title="Analysis"
        subtitle="Explore your card database across all sports"
      />
      <Breadcrumb crumbs={[
        { label: 'Analysis' },
        { label: activeTab.label },
      ]} />

      <nav className="sub-tabs" style={{ marginBottom: 'var(--sp-6)' }}>
        {TABS.map(t => (
          <button key={t.key} className={`sub-tab ${active === t.key ? 'sub-tab-active' : ''}`} onClick={() => setActive(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {active === 'crosssport' && <CrossSportAnalytics />}
      {active === 'pricetrack' && <ComingSoon title="Price Tracking" description="Track value changes over time for your IndCards collection." />}
      {active === 'completion' && <SetCompletionTracker />}
      {active === 'custom'     && <CustomReports />}
    </div>
  )
}

function ComingSoon({ title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>{description}</p>
      <span className="badge" style={{ background: 'rgba(255,203,62,0.2)', color: '#b45309', marginTop: '1rem', display: 'inline-block', padding: '0.4rem 1rem' }}>Coming Soon</span>
    </div>
  )
}
