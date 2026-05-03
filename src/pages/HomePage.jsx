import { useState, useEffect } from 'react'
import { useAuth, ROLE_HOME_SECTIONS } from '../context/AuthContext'
import { sports } from '../config/sports'
import CardSparkyLogo from '../components/CardSparkyLogo'
import { useAffiliateCards } from '../hooks/useAffiliateCards'
import { API } from '../config/api'

const ROTATION_KEY   = 'cs_rotation_settings'
const TIPS_KEY       = 'cs_tips'
const ANNOUNCEMENTS_KEY = 'cs_announcements'
const RECENT_KEY     = 'cs_recently_viewed'
const FAVS_KEY       = 'cs_favorites'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function RotatingTip() {
  const settings = { autoRotate: true, interval: 8, showOnHome: true, ...load(ROTATION_KEY, {}) }
  const tips = load(TIPS_KEY, [])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!settings.autoRotate || tips.length < 2) return
    const id = setInterval(() => setIndex(i => (i + 1) % tips.length), settings.interval * 1000)
    return () => clearInterval(id)
  }, [tips.length, settings.autoRotate, settings.interval])

  if (!settings.showOnHome || tips.length === 0) return null
  const tip = tips[index]

  return (
    <div className="home-card" style={{ marginBottom: '1.5rem' }}>
      <div className="home-card-header">
        <h3>💡 Tip of the Moment</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge" style={{ background: 'rgba(2,113,235,0.1)', color: 'var(--blue)' }}>{tip.category}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{index + 1} / {tips.length}</span>
          <button className="icon-btn" onClick={() => setIndex(i => (i - 1 + tips.length) % tips.length)}>‹</button>
          <button className="icon-btn" onClick={() => setIndex(i => (i + 1) % tips.length)}>›</button>
        </div>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{tip.title}</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.body}</p>
      </div>
    </div>
  )
}

function AnnouncementsSection() {
  const announcements = load(ANNOUNCEMENTS_KEY, [])
  if (!announcements.length) return null
  const sorted = [...announcements].sort((a, b) => (b.priority === 'Important') - (a.priority === 'Important'))
  return (
    <div className="home-card" style={{ marginBottom: '1.5rem' }}>
      <div className="home-card-header"><h3>📢 Announcements</h3></div>
      <div className="home-card-list">
        {sorted.map(a => (
          <div key={a.id} className="home-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <span className="home-list-title">{a.title}</span>
              {a.priority === 'Important' && <span className="badge" style={{ background: 'rgba(224,92,75,0.1)', color: 'var(--orange)' }}>Important</span>}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{a.date}</span>
            </div>
            <span className="home-list-sub">{a.body}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickAccessSection({ onNavigate }) {
  const favorites    = load(FAVS_KEY, [])
  const recentlyViewed = load(RECENT_KEY, [])

  if (!favorites.length && !recentlyViewed.length) return null

  function SportCard({ sportKey }) {
    const sport = sports[sportKey]
    if (!sport) return null
    return (
      <button
        onClick={() => onNavigate && onNavigate(sportKey)}
        className="home-card"
        style={{ padding: '0.75rem 1rem', cursor: 'pointer', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        <span style={{ fontSize: '1.5rem' }}>{sport.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sport.label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sport.db}</div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {favorites.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>⭐ Favorites</h3>
          <div className="home-grid" style={{ marginBottom: '1rem' }}>
            {favorites.map(key => <SportCard key={key} sportKey={key} />)}
          </div>
        </>
      )}
      {recentlyViewed.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>🕐 Recently Viewed</h3>
          <div className="home-grid">
            {recentlyViewed.map(key => <SportCard key={key} sportKey={key} />)}
          </div>
        </>
      )}
    </div>
  )
}

function StatsSection({ owner }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!owner) return
    fetch(`${API.MYCARDS}/summary?owner=${encodeURIComponent(owner)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        const totalCards = Number(d.totals?.TotalCards ?? 0)
        const totalValue = Number(d.totals?.TotalValue ?? 0)
        const totalCost  = Number(d.totals?.TotalCost ?? 0)
        const sports     = d.rows?.length ?? 0
        const topSport   = d.rows?.sort((a, b) => Number(b.TotalCards) - Number(a.TotalCards))[0]
        setStats({ totalCards, totalValue, totalCost, sports, topSport })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [owner])

  const fcur = n => '$' + Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
  const fnum = n => Number(n ?? 0).toLocaleString()

  if (loading) return (
    <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
      {[1,2,3,4].map(i => <div key={i} className="kpi-card" style={{ minHeight: 72 }} />)}
    </div>
  )

  if (!stats) return null

  const pl = stats.totalValue - stats.totalCost

  return (
    <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
      {[
        { label: 'My Cards',      value: fnum(stats.totalCards),  accent: 'var(--blue)' },
        { label: 'Est. Value',    value: fcur(stats.totalValue),  accent: 'var(--green)' },
        { label: 'Profit / Loss', value: (pl >= 0 ? '+' : '') + fcur(pl), accent: pl >= 0 ? 'var(--green)' : 'var(--red)' },
        { label: 'Sports',        value: fnum(stats.sports),      accent: 'var(--purple)' },
        { label: 'Top Sport',     value: stats.topSport?.Sport ?? '—', accent: 'var(--orange)' },
      ].map(k => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-accent" style={{ background: k.accent }} />
          <div className="kpi-content">
            <span className="kpi-value" style={{ fontSize: k.label === 'Top Sport' ? '1rem' : undefined }}>{k.value}</span>
            <span className="kpi-label">{k.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GettingStartedSection({ onNavigate }) {
  return (
    <div className="home-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
      <div style={{ background: 'var(--brand)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.35rem' }}>📚 New to Card Collecting?</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>Our Collecting 101 guide covers everything — from rookie cards to grading to where to buy.</p>
        </div>
        <button className="btn-save" onClick={() => onNavigate?.('learn101')} style={{ whiteSpace: 'nowrap' }}>Start Learning →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 0, borderTop: '1px solid var(--border)' }}>
        {[
          { icon: '🃏', label: 'Types of Cards' },
          { icon: '🌟', label: 'Rookie Cards' },
          { icon: '🔬', label: 'Card Grading' },
          { icon: '💰', label: 'Determine Value' },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WhySignUpSection() {
  return (
    <div className="home-card" style={{ marginBottom: '1.5rem' }}>
      <div className="home-card-header"><h3>🔓 Unlock More with an Account</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
        {[
          { icon: '🃏', title: 'My Cards',  desc: 'Track your entire collection, costs, and estimated value in one place.' },
          { icon: '🔍', title: 'Research',  desc: 'Dive deep into set data across every sport and card type.' },
          { icon: '📊', title: 'Analysis',  desc: 'See cross-sport breakdowns, pricing trends, and collection insights.' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{f.title}</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturedAffiliateSection() {
  const { cards } = useAffiliateCards()
  if (!cards.length) return null
  const featured = cards.slice(0, 4)
  return (
    <div className="home-card" style={{ marginBottom: '1.5rem' }}>
      <div className="home-card-header">
        <h3>🛒 Shop & Grade</h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Affiliate links</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
        {featured.map(c => (
          <a key={c.id} href={c.href} target="_blank" rel="noopener noreferrer sponsored"
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', textDecoration: 'none', color: 'inherit', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{c.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>{c.cta} →</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function HomePage({ onNavigateToSport, onNavigateToTab }) {
  const { currentUser } = useAuth()
  const role    = currentUser?.role ?? 'guest'
  const owner   = currentUser?.owner ?? currentUser?.name ?? ''
  const sections = ROLE_HOME_SECTIONS[role] ?? ROLE_HOME_SECTIONS.guest

  return (
    <>
      <div className="home-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <CardSparkyLogo size={48} onDark={true} />
          <div>
            <h2 className="home-greeting">Welcome{currentUser?.name ? `, ${currentUser.name}` : ''} 👋</h2>
            <p className="home-slogan">The Thrill of the Pull Starts Here. Your Collection. Your Legacy. Let's Build It.</p>
          </div>
        </div>
      </div>

      {sections.includes('kpis')          && <StatsSection owner={owner} />}
      {sections.includes('quickaccess')   && <QuickAccessSection onNavigate={onNavigateToSport} />}
      {sections.includes('announcements') && <AnnouncementsSection />}
      {sections.includes('tips')          && <RotatingTip />}
      {sections.includes('gettingstarted') && <GettingStartedSection onNavigate={onNavigateToTab} />}
      {sections.includes('whysignup')      && <WhySignUpSection />}
      {sections.includes('featuredaffiliate') && <FeaturedAffiliateSection />}
    </>
  )
}
