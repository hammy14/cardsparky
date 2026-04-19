import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const EMPTY = { name: '', email: '', password: '', role: 'user', owner: '' }
const ROLES = ['user', 'admin']

const roleStyle = r => r === 'admin'
  ? { background: 'rgba(224,92,75,0.1)', color: 'var(--orange)' }
  : { background: 'rgba(2,113,235,0.1)', color: 'var(--blue)' }

export default function UserManagement() {
  const { users, currentUser, loadUsers, addUser, updateUser, removeUser } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers().catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required')
    if (!editId && !form.password.trim()) return setError('Password is required')
    setSaving(true)
    try {
      if (editId) {
        await updateUser(editId, form)
        setEditId(null)
      } else {
        await addUser(form)
      }
      setForm(EMPTY)
      setError('')
    } catch {
      setError('Failed to save user')
    }
    setSaving(false)
  }

  function handleEdit(user) {
    setEditId(user.id)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, owner: user.owner ?? '' })
    setError('')
  }

  function handleCancel() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>👥 User Management</h3>
        <span className="record-count">{users.length} users</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input className="opp-search" placeholder="Display Name" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }} style={{ flex: 1, minWidth: 140 }} />
          <input className="opp-search" placeholder="Email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError('') }} style={{ flex: 2, minWidth: 180 }} />
          <input className="opp-search" placeholder="DB Owner name (e.g. Eric)" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} style={{ flex: 1, minWidth: 140 }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input className="opp-search" type="password" placeholder={editId ? 'New password (leave blank to keep)' : 'Password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ flex: 2, minWidth: 180 }} />
          <select className="opp-filter" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update User' : 'Add User'}</button>
          {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
        </div>
      </form>

      <div className="opp-table-wrap">
        <table className="opp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Owner</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={5} className="opp-empty">No users loaded.</td></tr>}
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  {user.name}
                  {currentUser?.id === user.id && <span className="badge" style={{ background: 'rgba(3,194,82,0.1)', color: 'var(--green)', marginLeft: '0.5rem' }}>You</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</td>
                <td style={{ fontSize: '0.85rem' }}>{user.owner || '—'}</td>
                <td><span className="badge" style={roleStyle(user.role)}>{user.role}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="icon-btn" onClick={() => handleEdit(user)}>✏️</button>
                    <button className="icon-btn" onClick={() => removeUser(user.id)} disabled={currentUser?.id === user.id} title={currentUser?.id === user.id ? "Can't delete yourself" : 'Delete'}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
