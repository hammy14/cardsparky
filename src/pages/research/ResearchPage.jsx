import { useState } from 'react'
import { sports, categories } from '../../config/sports'
import SportPage from './SportPage'
import { useUserPrefs } from '../../hooks/useUserPrefs'
import { PageHeader, Breadcrumb } from '../../components/MainLayout'

export default function ResearchPage() {
  const [selectedSport, setSelectedSport] = useState(null)
  const { recentlyViewed, favorites, addRecent, toggleFavorite } = useUserPrefs()

  function handleSelectSport(key) {
    addRecent(key)
    setSelectedSport(key)
  }

  if (selectedSport) {
    const sport = sports[selectedSport]
    return (
      <div>
        <Breadcrumb crumbs={[
          { label: 'Research', onClick: () => setSelectedSport(null) },
          { label: sport.label },
        ]} />
        <PageHeader
          title={`${sport.icon} ${sport.label}`}
          subtitle={sport.db}
          action={
            <button className="btn-save" onClick={() => setSelectedSport(null)}>← Back to Research</button>
          }
        />
        <SportPage sport={sport} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Research" subtitle="Browse and update card set data by sport" />

      {favorites.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>⭐ Favorites</h3>
          <div className="home-grid">
            {favorites.map(key => <SportCard key={key} sportKey={key} onSelect={handleSelectSport} onToggleFav={toggleFavorite} isFav={true} />)}
          </div>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>🕐 Recently Viewed</h3>
          <div className="home-grid">
            {recentlyViewed.map(key => <SportCard key={key} sportKey={key} onSelect={handleSelectSport} onToggleFav={toggleFavorite} isFav={favorites.includes(key)} />)}
          </div>
        </div>
      )}

      {Object.entries(categories).map(([category, keys]) => (
        <div key={category} style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>{category}</h3>
          <div className="home-grid">
            {keys.map(key => <SportCard key={key} sportKey={key} onSelect={handleSelectSport} onToggleFav={toggleFavorite} isFav={favorites.includes(key)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function SportCard({ sportKey, onSelect, onToggleFav, isFav }) {
  const sport = sports[sportKey]
  return (
    <div className="home-card" style={{ position: 'relative' }}>
      <button
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: isFav ? 1 : 0.3 }}
        onClick={e => { e.stopPropagation(); onToggleFav(sportKey) }}
        title={isFav ? 'Remove favorite' : 'Add to favorites'}
      >
        ⭐
      </button>
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%' }}
        onClick={() => onSelect(sportKey)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.8rem' }}>{sport.icon}</span>
          <span style={{ fontWeight: 600 }}>{sport.label}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{sport.db}</div>
      </button>
    </div>
  )
}
