import CardSparkyLogo from '../../components/CardSparkyLogo'

const SIZES = [
  { label: 'Small (34px)',  size: 34,  desc: 'Topbar' },
  { label: 'Medium (52px)', size: 52,  desc: 'Login page' },
  { label: 'Large (96px)',  size: 96,  desc: 'Marketing / splash' },
  { label: 'XL (160px)',    size: 160, desc: 'Display' },
]

export default function LogoSettings() {
  return (
    <div>
      {/* Light background */}
      <div className="opp-section" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="opp-header"><h3>☀️ Light Background</h3></div>
        <div style={{ padding: 'var(--sp-8)', display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-8)', flexWrap: 'wrap', background: '#f8fafc' }}>
          {SIZES.map(({ label, size, desc }) => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <CardSparkyLogo size={size} onDark={false} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dark background */}
      <div className="opp-section" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="opp-header"><h3>🌙 Dark Background</h3></div>
        <div style={{ padding: 'var(--sp-8)', display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-8)', flexWrap: 'wrap', background: '#1b2a6b', borderRadius: '0 0 var(--radius) var(--radius)' }}>
          {SIZES.map(({ label, size, desc }) => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <CardSparkyLogo size={size} onDark={true} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.35)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wordmark */}
      <div className="opp-section">
        <div className="opp-header"><h3>🔤 Wordmark</h3></div>
        <div style={{ padding: 'var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {[{ bg: '#f8fafc', dark: false }, { bg: '#1b2a6b', dark: true }].map(({ bg, dark }) => (
            <div key={bg} style={{ padding: 'var(--sp-6)', background: bg, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
              <CardSparkyLogo size={48} onDark={dark} />
              <span style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: '1.8rem',
                letterSpacing: '-0.03em',
                color: dark ? 'white' : '#1b2a6b',
              }}>CardSparky</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
