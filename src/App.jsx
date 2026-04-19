import { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import MainLayout from './components/MainLayout';
import CardSparkyLogo from './components/CardSparkyLogo';
import AnalysisPage from './pages/analysis/AnalysisPage';
import AllCardSummaryPage from './pages/mycards/AllCardSummary';
import IndividualCardsPage from './pages/mycards/IndividualCards';
import AddCardsPage from './pages/mycards/AddCards';
import ResearchPage from './pages/research/ResearchPage';
import SettingsPage from './pages/settings/SettingsPage';
import HomePage from './pages/HomePage';
import CardCollecting101Page from './pages/CardCollecting101Page';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth, ALL_TABS } from './context/AuthContext';

const MY_CARDS_SUBS = [
  { key: 'all-summary',      label: 'All Card Summary', component: AllCardSummaryPage },
  { key: 'add-cards',        label: 'Add Cards',        component: AddCardsPage },
  { key: 'individual-cards', label: 'Individual Cards', component: IndividualCardsPage },
];

function MyCardsSection() {
  const [activeSub, setActiveSub] = useState('all-summary');
  const ActivePage = MY_CARDS_SUBS.find(s => s.key === activeSub)?.component;
  const activeLabel = MY_CARDS_SUBS.find(s => s.key === activeSub)?.label;

  return (
    <>
      <nav className="sub-tabs" style={{ marginBottom: 'var(--sp-6)' }}>
        {MY_CARDS_SUBS.map(s => (
          <button key={s.key} className={`sub-tab ${activeSub === s.key ? 'sub-tab-active' : ''}`} onClick={() => setActiveSub(s.key)}>
            {s.label}
          </button>
        ))}
      </nav>
      {ActivePage && <ActivePage />}
    </>
  );
}

function AppContent() {
  const { currentUser, logout, roleTabs } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  if (!currentUser) return <LoginPage />;

  const allowedKeys = roleTabs[currentUser.role] ?? roleTabs.guest;
  const tabs = ALL_TABS.filter(t => allowedKeys.includes(t.key));

  if (!allowedKeys.includes(activeTab)) setActiveTab('home');

  const roleStyle = r => r === 'admin'
    ? { background: 'rgba(224,92,75,0.1)', color: 'var(--orange)' }
    : r === 'guest'
    ? { background: 'var(--gray-100)', color: 'var(--text-muted)' }
    : { background: 'rgba(27,42,107,0.1)', color: 'var(--blue)' };

  return (
    <MainLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      topbarLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CardSparkyLogo size={34} />
          <h2>CardSparky</h2>
        </div>
      }
      topbarRight={
        <>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentUser.name}
            <span className="badge" style={roleStyle(currentUser.role)}>{currentUser.role}</span>
          </span>
          <button onClick={() => setDark(d => !d)} title="Toggle theme">{dark ? '☀️' : '🌙'}</button>
          <button onClick={logout}>Sign Out</button>
        </>
      }
      footer={<span>CardSparky · {new Date().getFullYear()}</span>}
    >
      {activeTab === 'home'     && <div key="home"     className="page-transition"><HomePage onNavigateToSport={() => setActiveTab('research')} onNavigateToTab={setActiveTab} /></div>}
      {activeTab === 'learn101'  && <div key="learn101" className="page-transition"><CardCollecting101Page /></div>}
      {activeTab === 'research'  && <div key="research"  className="page-transition"><ResearchPage /></div>}
      {activeTab === 'mycards'   && <div key="mycards"   className="page-transition"><MyCardsSection /></div>}
      {activeTab === 'data'      && <div key="data"      className="page-transition"><AnalysisPage /></div>}
      {activeTab === 'settings'  && <div key="settings"  className="page-transition"><SettingsPage /></div>}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
