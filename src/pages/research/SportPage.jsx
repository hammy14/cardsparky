import { useState } from 'react'
import Summary from './Summary'
import NumbersUpdate from './NumbersUpdate'
import CardTypeUpdate from './CardTypeUpdate'
import SetTypeUpdate from './SetTypeUpdate'
import MfgBrandUpdate from './MfgBrandUpdate'
import YearSummary from './YearSummary'
import CardListUpdate from './CardListUpdate'

const SUB_PAGES = [
  { key: 'summary',   label: 'Summary' },
  { key: 'numbers',   label: 'Numbers Update' },
  { key: 'card-type', label: 'Card Type Update' },
  { key: 'set-type',  label: 'Set Type Update' },
  { key: 'mfg-brand', label: 'Mfg Brand Update' },
  { key: 'year',      label: 'Year Summary' },
  { key: 'card-list', label: 'Card List Update' },
]

export default function SportPage({ sport }) {
  const [activePage, setActivePage] = useState('summary')

  return (
    <div className="page-content">
      <h2>{sport.icon} {sport.label}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Database: {sport.db} · Table: {sport.table}
      </p>
      <nav className="sub-tabs">
        {SUB_PAGES.map(p => (
          <button
            key={p.key}
            className={`sub-tab ${activePage === p.key ? 'sub-tab-active' : ''}`}
            onClick={() => setActivePage(p.key)}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: '1.5rem' }}>
        {activePage === 'summary'   && <Summary sport={sport} />}
        {activePage === 'numbers'   && <NumbersUpdate sport={sport} />}
        {activePage === 'card-type' && <CardTypeUpdate sport={sport} />}
        {activePage === 'set-type'  && <SetTypeUpdate sport={sport} />}
        {activePage === 'mfg-brand' && <MfgBrandUpdate sport={sport} />}
        {activePage === 'year'      && <YearSummary sport={sport} />}
        {activePage === 'card-list' && <CardListUpdate sport={sport} />}
        {activePage !== 'summary' && (
          <div className="opp-empty">
            {SUB_PAGES.find(p => p.key === activePage)?.label} — coming soon
          </div>
        )}
      </div>
    </div>
  )
}
