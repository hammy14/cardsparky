const ICONS = { compact: '▤', comfortable: '▥', spacious: '▦' }
const LABELS = { compact: 'Compact', comfortable: 'Comfortable', spacious: 'Spacious' }

export default function DensityToggle({ density, onChange }) {
  return (
    <div className="toggle-group" title="Row density">
      {['compact', 'comfortable', 'spacious'].map(d => (
        <button
          key={d}
          className={`toggle-btn ${density === d ? 'toggle-active' : ''}`}
          onClick={() => onChange(d)}
          title={LABELS[d]}
        >
          {ICONS[d]}
        </button>
      ))}
    </div>
  )
}
