import { useState } from 'react'
import { useLocalStore } from '../../hooks/useLocalStore'

const CATEGORIES = ['General', 'Grading', 'Storage', 'Buying', 'Selling', 'Investing']

const EMPTY = { title: '', body: '', category: 'General' }

export default function TipsManager() {
  const { data: tips, add, update, remove } = useLocalStore('cs_tips', [])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    if (editId) { update(editId, form); setEditId(null) }
    else add(form)
    setForm(EMPTY)
  }

  function handleEdit(tip) {
    setEditId(tip.id)
    setForm({ title: tip.title, body: tip.body, category: tip.category })
  }

  function handleCancel() {
    setEditId(null)
    setForm(EMPTY)
  }

  return (
    <div className="opp-section">
      <div className="opp-header"><h3>💡 Tips Management</h3></div>

      <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="opp-search"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ flex: 2, minWidth: 180 }}
          />
          <select className="opp-filter" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <textarea
          className="opp-search"
          placeholder="Tip body..."
          rows={3}
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn-save">{editId ? 'Update Tip' : 'Add Tip'}</button>
          {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
        </div>
      </form>

      {tips.length === 0 && <div className="opp-empty">No tips yet. Add one above.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        {tips.map(tip => (
          <div key={tip.id} className="home-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tip.title}</div>
                <span className="badge" style={{ background: 'rgba(2,113,235,0.1)', color: 'var(--blue)', marginTop: '0.25rem' }}>{tip.category}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="icon-btn" onClick={() => handleEdit(tip)}>✏️</button>
                <button className="icon-btn" onClick={() => remove(tip.id)}>🗑️</button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
