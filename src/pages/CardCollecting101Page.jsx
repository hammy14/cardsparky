import { useState } from 'react'
import { PageHeader } from '../components/MainLayout'
import { GettingStarted, TypesOfCards, RookieCard, BrandsManufacturers, CardGrading, DetermineValue, StoringCards, WhereToBuy, ParallelsInserts } from './CardCollecting101Pages'

const TABS = [
  { key: 'getting-started', label: 'Getting Started',      component: GettingStarted },
  { key: 'types-of-cards',  label: 'Types of Cards',       component: TypesOfCards },
  { key: 'rookie-card',     label: 'Rookie Cards',         component: RookieCard },
  { key: 'brands',          label: 'Brands & Mfg',         component: BrandsManufacturers },
  { key: 'grading',         label: 'Card Grading',         component: CardGrading },
  { key: 'value',           label: 'Determine Value',      component: DetermineValue },
  { key: 'storing',         label: 'Storing Cards',        component: StoringCards },
  { key: 'where-to-buy',    label: 'Where to Buy',         component: WhereToBuy },
  { key: 'parallels',       label: 'Parallels vs Inserts', component: ParallelsInserts },
]

export default function CardCollecting101Page() {
  const [active, setActive] = useState('getting-started')
  const ActivePage = TABS.find(t => t.key === active)?.component

  return (
    <div>
      <PageHeader title="Card Collecting 101" subtitle="Everything you need to know to start and grow your collection" />
      <nav className="sub-tabs" style={{ marginBottom: 'var(--sp-6)' }}>
        {TABS.map(t => (
          <button key={t.key} className={`sub-tab ${active === t.key ? 'sub-tab-active' : ''}`} onClick={() => setActive(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      {ActivePage && <ActivePage />}
    </div>
  )
}
