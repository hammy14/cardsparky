import { useState } from 'react';
import { useAffiliateCards } from '../../hooks/useAffiliateCards';

const PAGES = [
  { value: 'grading', label: 'Card Grading' },
  { value: 'storing', label: 'Storing Your Cards' },
];

const EMPTY = { id: null, page: 'grading', icon: '', title: '', description: '', cta: '', href: '', tag: '' };

export default function AffiliateManager() {
  const { allCards, upsert, remove } = useAffiliateCards();
  const [editing, setEditing] = useState(null);
  const [filterPage, setFilterPage] = useState('all');

  const visible = filterPage === 'all' ? allCards : allCards.filter(c => c.page === filterPage);

  function handleSave() {
    if (!editing.title || !editing.href) return;
    upsert(editing);
    setEditing(null);
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>🔗 Affiliate Cards</h3>
        <div className="opp-header-actions">
          <select className="opp-filter" value={filterPage} onChange={e => setFilterPage(e.target.value)}>
            <option value="all">All Pages</option>
            {PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="btn-save" onClick={() => setEditing({ ...EMPTY })}>+ Add Card</button>
        </div>
      </div>

      <table className="opp-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Title</th>
            <th>Page</th>
            <th>Tag</th>
            <th>URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(c => (
            <tr key={c.id}>
              <td>{c.icon}</td>
              <td>{c.title}</td>
              <td>{PAGES.find(p => p.value === c.page)?.label ?? c.page}</td>
              <td>{c.tag && <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{c.tag}</span>}</td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', fontSize: '0.8rem' }}>{c.href}</a>
              </td>
              <td>
                <div className="row-hover-actions" style={{ opacity: 1 }}>
                  <button className="row-hover-btn" onClick={() => setEditing({ ...c })}>Edit</button>
                  <button className="row-hover-btn danger" onClick={() => remove(c.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr><td colSpan={6} className="opp-empty">No affiliate cards yet.</td></tr>
          )}
        </tbody>
      </table>

      {editing && (
        <div className="panel-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="panel">
            <div className="panel-header">
              <h3>{editing.id ? 'Edit Affiliate Card' : 'Add Affiliate Card'}</h3>
              <button className="panel-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="modal-field">
                <label>Page</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.page} onChange={e => setEditing(p => ({ ...p, page: e.target.value }))}>
                  {PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {[
                { key: 'icon',        label: 'Icon (emoji)',   placeholder: '🛡️' },
                { key: 'title',       label: 'Title',          placeholder: 'Penny Sleeves' },
                { key: 'description', label: 'Description',    placeholder: 'Short description...' },
                { key: 'cta',         label: 'Button Text',    placeholder: 'Shop on Amazon' },
                { key: 'href',        label: 'Affiliate URL',  placeholder: 'https://...' },
                { key: 'tag',         label: 'Tag (optional)', placeholder: 'Amazon' },
              ].map(f => (
                <div className="modal-field" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    value={editing[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={!editing.title || !editing.href}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
