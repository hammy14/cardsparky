import { useState } from 'react'
import { useLocalStore } from '../../hooks/useLocalStore'

const EMPTY = { title: '', body: '', priority: 'Normal' }

export default function AnnouncementsManager() {
  const { data: announcements, add, update, remove } = useLocalStore('cs_announcements', [])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    const date = new Date().toLocaleDateString()
    if (editId) { update(editId, form); setEditId(null) }
    else add({ ...form, date })
    setForm(EMPTY)
  }

  function handleEdit(a) {
    setEditId(a.id)
    setForm({ title: a.title, body: a.body, priority: a.priority })
  }

  function handleCancel() {
    setEditId(null)
    setForm(EMPTY)
  }

  const priorityStyle = p => p === 'Important'
    ? { background: 'rgba(224,92,75,0.1)', color: 'var(--orange)' }
    : { background: 'rgba(2,113,235,0.1)', color: 'var(--blue)' }

  return (
    <div className="opp-section">
      <div className="opp-header"><h3>📢 Announcements</h3></div>

      <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="opp-search"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ flex: 2, minWidth: 180 }}
          />
          <select className="opp-filter" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            <option>Normal</option>
            <option>Important</option>
          </select>
        </div>
        <textarea
          className="opp-search"
          placeholder="Announcement body..."
          rows={3}
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn-save">{editId ? 'Update' : 'Post Announcement'}</button>
          {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
        </div>
      </form>

      {announcements.length === 0 && <div className="opp-empty">No announcements yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        {[...announcements].sort((a, b) => (b.priority === 'Important') - (a.priority === 'Important')).map(a => (
          <div key={a.id} className="home-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</span>
                  <span className="badge" style={priorityStyle(a.priority)}>{a.priority}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.4rem' }}>{a.body}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem' }}>
                <button className="icon-btn" onClick={() => handleEdit(a)}>✏️</button>
                <button className="icon-btn" onClick={() => remove(a.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
