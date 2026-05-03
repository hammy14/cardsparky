import { useState, useEffect, useCallback } from 'react'
import { API } from '../../config/api'

const PT_API = API.PT

const SHIRT_COLORS = { XS: 'var(--green)', S: 'var(--blue)', M: 'var(--yellow)', L: 'var(--orange)', XL: 'var(--red)' }
const TYPE_ICONS   = { Enhancement: '🚀', Bug: '🐛', 'Change Request': '🔄' }
const STATUS_COLORS = {
  Active: 'var(--green)', 'In Progress': 'var(--blue)', 'On Hold': 'var(--yellow)', Completed: 'var(--blue)', Cancelled: 'var(--red)',
  Idea: 'var(--purple)', Backlog: 'var(--gray-400)', 'In Review': 'var(--yellow)', Done: 'var(--green)',
  Planning: 'var(--gray-400)', Released: 'var(--green)',
}
const PRIORITY_COLORS = { Low: 'var(--green)', Medium: 'var(--blue)', High: 'var(--orange)', Critical: 'var(--red)' }

function ShirtBadge({ size }) {
  return <span className="badge" style={{ background: `${SHIRT_COLORS[size]}22`, color: SHIRT_COLORS[size] }}>{size}</span>
}
function StatusBadge({ status }) {
  return <span className="badge" style={{ background: `${STATUS_COLORS[status]}22`, color: STATUS_COLORS[status] }}>{status}</span>
}
function PriorityBadge({ priority }) {
  return <span className="badge" style={{ background: `${PRIORITY_COLORS[priority]}22`, color: PRIORITY_COLORS[priority] }}>{priority}</span>
}

const TASK_STATUSES = ['Idea','Backlog','In Progress','In Review','Done']
const EMPTY_PROJECT = { id: null, name: '', description: '', status: 'Active' }
const EMPTY_RELEASE = { id: null, project_id: '', version: '', name: '', description: '', release_date: '', status: 'Planning' }
const EMPTY_TASK = { id: null, project_id: '', release_id: '', title: '', description: '', type: 'Enhancement', status: 'Idea', priority: 'Medium', shirt_size: 'S', assignee: 'Eric', est_hours: '', actual_hours: '' }

function useApi(url) {
  const [data, setData] = useState([])
  const load = useCallback(async () => {
    try { const r = await fetch(url); setData(await r.json()) } catch {}
  }, [url])
  useEffect(() => { load() }, [load])
  return [data, load]
}

// ── Project Panel ─────────────────────────────────────────────────────────────
function ProjectPanel({ project: initialProject, onClose, onRefresh }) {
  const [project, setProject] = useState(initialProject)
  const [editingField, setEditingField] = useState(null)
  const [tasks, setTasks] = useState([])
  const [releases, setReleases] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [addingTask, setAddingTask] = useState(false)
  const newTask = { ...EMPTY_TASK, project_id: project.id }

  async function saveProjectField(field, value) {
    const updated = { ...project, [field]: value }
    setProject(updated)
    setEditingField(null)
    await fetch(`${PT_API}/projects/${project.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated)
    })
    onRefresh()
  }

  const loadTasks = useCallback(async () => {
    try {
      const [tr, rr] = await Promise.all([
        fetch(`${PT_API}/tasks?project_id=${project.id}`).then(r => r.json()),
        fetch(`${PT_API}/releases?project_id=${project.id}`).then(r => r.json()),
      ])
      setTasks(Array.isArray(tr) ? tr : [])
      setReleases(Array.isArray(rr) ? rr : [])
    } catch {}
  }, [project.id])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function updateTaskField(task, field, value) {
    await fetch(`${PT_API}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, [field]: value }),
    })
    loadTasks(); onRefresh()
  }

  async function saveTask(t) {
    if (!t.title) return
    const method = t.id ? 'PUT' : 'POST'
    const url = t.id ? `${PT_API}/tasks/${t.id}` : `${PT_API}/tasks`
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
    setEditingTask(null); setAddingTask(false); loadTasks(); onRefresh()
  }

  async function delTask(id) {
    await fetch(`${PT_API}/tasks/${id}`, { method: 'DELETE' })
    loadTasks(); onRefresh()
  }

  const done = tasks.filter(t => t.status === 'Done').length
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const taskForm = editingTask || (addingTask ? newTask : null)

  return (
    <div className="panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 520 }}>
        <div className="panel-header">
          <h3>📁 {project.name}</h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 90, flexShrink: 0 }}>Name</span>
              {editingField === 'name' ? (
                <input autoFocus defaultValue={project.name} onBlur={e => saveProjectField('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && saveProjectField('name', e.target.value)}
                  style={{ flex: 1, padding: '0.25rem 0.5rem', border: '1px solid var(--blue)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)' }} />
              ) : (
                <span className="cell-editable" style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }} onClick={() => setEditingField('name')}>{project.name}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 90, flexShrink: 0, paddingTop: 2 }}>Description</span>
              {editingField === 'description' ? (
                <textarea autoFocus defaultValue={project.description} rows={2} onBlur={e => saveProjectField('description', e.target.value)}
                  style={{ flex: 1, padding: '0.25rem 0.5rem', border: '1px solid var(--blue)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }} />
              ) : (
                <span className="cell-editable" style={{ flex: 1, fontSize: '0.85rem', color: project.description ? 'var(--text)' : 'var(--text-muted)' }} onClick={() => setEditingField('description')}>{project.description || 'Click to add description...'}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 90, flexShrink: 0 }}>Status</span>
              <select value={project.status} onChange={e => saveProjectField('status', e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid var(--gray-200)', borderRadius: 6, background: `${STATUS_COLORS[project.status]}22`, color: STATUS_COLORS[project.status], fontWeight: 600, cursor: 'pointer' }}>
                {['Active','In Progress','On Hold','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
              <ShirtBadge size={project.shirt_size} />
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Total',       value: tasks.length,                                          color: 'var(--blue)' },
              { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length,  color: 'var(--yellow)' },
              { label: 'In Review',   value: tasks.filter(t => t.status === 'In Review').length,    color: 'var(--orange)' },
              { label: 'Done',        value: done,                                                   color: 'var(--green)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <span>Progress</span><span>{pct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Task form (add/edit) */}
          {taskForm && (
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input placeholder="Task title *" value={taskForm.title}
                onChange={e => editingTask ? setEditingTask(t => ({ ...t, title: e.target.value })) : setAddingTask(t => ({ ...newTask, ...t, title: e.target.value }))}
                style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { key: 'type',       opts: ['Enhancement','Bug','Change Request'] },
                  { key: 'status',     opts: ['Backlog','In Progress','In Review','Done'] },
                  { key: 'priority',   opts: ['Low','Medium','High','Critical'] },
                  { key: 'shirt_size', opts: ['XS','S','M','L','XL'] },
                ].map(f => (
                  <select key={f.key} className="opp-filter" style={{ width: '100%' }}
                    value={taskForm[f.key]}
                    onChange={e => editingTask ? setEditingTask(t => ({ ...t, [f.key]: e.target.value })) : setAddingTask(t => ({ ...newTask, ...t, [f.key]: e.target.value }))}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>
              <input placeholder="Assignee" value={taskForm.assignee}
                onChange={e => editingTask ? setEditingTask(t => ({ ...t, assignee: e.target.value })) : setAddingTask(t => ({ ...newTask, ...t, assignee: e.target.value }))}
                style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input type="number" step="0.5" min="0" placeholder="Est. Hours" value={taskForm.est_hours ?? ''}
                  onChange={e => editingTask ? setEditingTask(t => ({ ...t, est_hours: e.target.value })) : setAddingTask(t => ({ ...newTask, ...t, est_hours: e.target.value }))}
                  style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)' }}
                />
                <input type="number" step="0.5" min="0" placeholder="Actual Hours" value={taskForm.actual_hours ?? ''}
                  onChange={e => editingTask ? setEditingTask(t => ({ ...t, actual_hours: e.target.value })) : setAddingTask(t => ({ ...newTask, ...t, actual_hours: e.target.value }))}
                  style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.85rem', background: 'var(--card)', color: 'var(--text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn-cancel" onClick={() => { setEditingTask(null); setAddingTask(false) }}>Cancel</button>
                <button className="btn-save" onClick={() => saveTask(taskForm)} disabled={!taskForm.title}>Save</button>
              </div>
            </div>
          )}

          {/* Tasks list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks</span>
            {!addingTask && !editingTask && <button className="btn-save" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setAddingTask(newTask)}>+ Add Task</button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {tasks.map(t => (
              <div key={t.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>{TYPE_ICONS[t.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.35rem' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select value={t.status} onChange={e => updateTaskField(t, 'status', e.target.value)}
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.35rem', border: '1px solid var(--gray-200)', borderRadius: 6, background: `${STATUS_COLORS[t.status]}22`, color: STATUS_COLORS[t.status], fontWeight: 600, cursor: 'pointer' }}>
                        {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <PriorityBadge priority={t.priority} />
                      <ShirtBadge size={t.shirt_size} />
                      {t.assignee && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👤 {t.assignee}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button className="row-hover-btn" style={{ fontSize: '0.7rem' }} onClick={() => { setAddingTask(false); setEditingTask({ ...t, release_id: t.release_id ?? '' }) }}>Edit</button>
                    <button className="row-hover-btn danger" style={{ fontSize: '0.7rem' }} onClick={() => delTask(t.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            {!tasks.length && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No tasks yet. Add one above.</div>}
          </div>

          {/* Releases */}
          {releases.length > 0 && (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.25rem 0 0.5rem' }}>Releases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {releases.map(r => (
                  <div key={r.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--brand)' }}>{r.version}</span>
                      {r.name && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{r.name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <StatusBadge status={r.status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Number(r.done_count ?? 0)}/{Number(r.task_count ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────
function Projects({ onReload }) {
  const [projects, reload] = useApi(`${PT_API}/projects`)
  const [releases] = useApi(`${PT_API}/releases`)
  const [editing, setEditing] = useState(null)
  const [panelProject, setPanelProject] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  function reloadAll() { reload(); onReload?.() }

  const STATUS_ORDER = ['Active','In Progress','On Hold','Completed','Cancelled']

  const visible = projects
    .filter(p => !filterStatus || p.status === filterStatus)
    .sort((a, b) => {
      const aComp = a.status === 'Completed' || a.status === 'Cancelled'
      const bComp = b.status === 'Completed' || b.status === 'Cancelled'
      if (aComp !== bComp) return aComp ? 1 : -1
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    })

  async function save() {
    if (!editing.name) return
    const method = editing.id ? 'PUT' : 'POST'
    const url = editing.id ? `${PT_API}/projects/${editing.id}` : `${PT_API}/projects`
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    reload(); setEditing(null)
    if (panelProject?.id === editing.id) setPanelProject(p => ({ ...p, ...editing }))
  }

  async function del(id) {
    if (!confirm('Delete project and all its tasks/releases?')) return
    await fetch(`${PT_API}/projects/${id}`, { method: 'DELETE' })
    reload(); if (panelProject?.id === id) setPanelProject(null)
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>📁 Projects</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="opp-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['Active','In Progress','On Hold','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-save" onClick={() => setEditing({ ...EMPTY_PROJECT })}>+ New Project</button>
        </div>
      </div>
      <table className="opp-table">
        <thead><tr><th>Name</th><th>Status</th><th>Size</th><th>Tasks</th><th>Latest Release</th><th>Actions</th></tr></thead>
        <tbody>
          {visible.map(p => {
            const latestRelease = releases.filter(r => r.project_id === p.id).sort((a, b) => b.id - a.id)[0]
            return (
            <tr key={p.id} className={`opp-row-clickable ${panelProject?.id === p.id ? 'row-focused' : ''}`} onClick={() => setPanelProject(p)}>
              <td className="opp-name">{p.name}</td>
              <td><StatusBadge status={p.status} /></td>
              <td><ShirtBadge size={p.shirt_size} /></td>
              <td>{Number(p.done_count ?? 0)}/{Number(p.task_count ?? 0)}</td>
              <td>
                {latestRelease
                  ? <span style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--brand)', fontWeight: 600 }}>{latestRelease.version}</span> <StatusBadge status={latestRelease.status} /></span>
                  : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
              </td>
              <td onClick={e => e.stopPropagation()}>
                <div className="row-hover-actions" style={{ opacity: 1 }}>
                  <button className="row-hover-btn" onClick={() => setEditing({ ...p })}>Edit</button>
                  <button className="row-hover-btn danger" onClick={() => del(p.id)}>Delete</button>
                </div>
              </td>
            </tr>
            )
          })}
          {!visible.length && <tr><td colSpan={6} className="opp-empty">No projects found.</td></tr>}
        </tbody>
      </table>

      {panelProject && (
        <ProjectPanel
          project={panelProject}
          onClose={() => setPanelProject(null)}
          onRefresh={reloadAll}
        />
      )}

      {editing && (
        <div className="panel-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ width: 600, padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>{editing.id ? 'Edit Project' : 'New Project'}</h3>
              <button className="panel-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              <div className="modal-field">
                <label>Project Name *</label>
                <input value={editing.name} placeholder="e.g. Affiliate Marketing Phase 2" onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>Description</label>
                <textarea rows={3} value={editing.description} placeholder="What is this project about?" onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.9rem', background: 'var(--card)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div className="modal-field">
                <label>Status</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.status} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}>
                  {['Active','In Progress','On Hold','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save" onClick={save} disabled={!editing.name}>Save Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function Tasks({ projects }) {
  const [tasks, reload] = useApi(`${PT_API}/tasks`)
  const [releases, reloadReleases] = useApi(`${PT_API}/releases`)
  const [editing, setEditing] = useState(null)
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => { reloadReleases() }, [reloadReleases])

  const visible = tasks.filter(t =>
    (!filterProject || String(t.project_id) === filterProject) &&
    (!filterStatus  || t.status === filterStatus) &&
    (!filterType    || t.type === filterType)
  )

  async function save() {
    if (!editing.title || !editing.project_id) return
    const method = editing.id ? 'PUT' : 'POST'
    const url = editing.id ? `${PT_API}/tasks/${editing.id}` : `${PT_API}/tasks`
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    reload(); setEditing(null)
  }

  async function del(id) {
    await fetch(`${PT_API}/tasks/${id}`, { method: 'DELETE' }); reload()
  }

  const projectRelease = releases.filter(r => !editing?.project_id || String(r.project_id) === String(editing?.project_id))

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>✅ Tasks</h3>
        <button className="btn-save" onClick={() => setEditing({ ...EMPTY_TASK })}>+ New Task</button>
      </div>
      <div className="opp-toolbar">
        <select className="opp-filter" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="opp-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="opp-filter" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {['Enhancement','Bug','Change Request'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <table className="opp-table">
        <thead><tr><th>Type</th><th>Title</th><th>Project</th><th>Status</th><th>Priority</th><th>Size</th><th>Assignee</th><th>Est Hrs</th><th>Actual Hrs</th><th>Actions</th></tr></thead>
        <tbody>
          {visible.map(t => (
            <tr key={t.id}>
              <td title={t.type}>{TYPE_ICONS[t.type]}</td>
              <td>{t.title}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{projects.find(p => p.id === t.project_id)?.name ?? '—'}</td>
              <td><StatusBadge status={t.status} /></td>
              <td><PriorityBadge priority={t.priority} /></td>
              <td><ShirtBadge size={t.shirt_size} /></td>
              <td style={{ fontSize: '0.8rem' }}>{t.assignee || '—'}</td>
              <td style={{ fontSize: '0.8rem' }}>{t.est_hours ?? '—'}</td>
              <td style={{ fontSize: '0.8rem' }}>{t.actual_hours ?? '—'}</td>
              <td>
                <div className="row-hover-actions" style={{ opacity: 1 }}>
                  <button className="row-hover-btn" onClick={() => setEditing({ ...t, release_id: t.release_id ?? '' })}>Edit</button>
                  <button className="row-hover-btn danger" onClick={() => del(t.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!visible.length && <tr><td colSpan={10} className="opp-empty">No tasks found.</td></tr>}
        </tbody>
      </table>

      {editing && (
        <div className="panel-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="panel">
            <div className="panel-header">
              <h3>{editing.id ? 'Edit Task' : 'New Task'}</h3>
              <button className="panel-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="modal-field">
                <label>Project *</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.project_id} onChange={e => setEditing(p => ({ ...p, project_id: e.target.value, release_id: '' }))}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Title *</label>
                <input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>Description</label>
                <input value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
              </div>
              {[
                { key: 'type',       label: 'Type',      opts: ['Enhancement','Bug','Change Request'] },
                { key: 'status',     label: 'Status',    opts: TASK_STATUSES },
                { key: 'priority',   label: 'Priority',  opts: ['Low','Medium','High','Critical'] },
                { key: 'shirt_size', label: 'Size',      opts: ['XS','S','M','L','XL'] },
              ].map(f => (
                <div className="modal-field" key={f.key}>
                  <label>{f.label}</label>
                  <select className="opp-filter" style={{ width: '100%' }} value={editing[f.key]} onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="modal-field">
                <label>Release</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.release_id} onChange={e => setEditing(p => ({ ...p, release_id: e.target.value }))}>
                  <option value="">None</option>
                  {projectRelease.map(r => <option key={r.id} value={r.id}>{r.version} {r.name ? `— ${r.name}` : ''}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Assignee</label>
                <input value={editing.assignee} onChange={e => setEditing(p => ({ ...p, assignee: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-field">
                  <label>Est. Hours</label>
                  <input type="number" step="0.5" min="0" value={editing.est_hours ?? ''} onChange={e => setEditing(p => ({ ...p, est_hours: e.target.value }))} placeholder="0.0" />
                </div>
                <div className="modal-field">
                  <label>Actual Hours</label>
                  <input type="number" step="0.5" min="0" value={editing.actual_hours ?? ''} onChange={e => setEditing(p => ({ ...p, actual_hours: e.target.value }))} placeholder="0.0" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save" onClick={save} disabled={!editing.title || !editing.project_id}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Releases ──────────────────────────────────────────────────────────────────
function Releases({ projects }) {
  const [releases, reload] = useApi(`${API}/releases`)
  const [editing, setEditing] = useState(null)

  async function save() {
    if (!editing.version || !editing.project_id) return
    const method = editing.id ? 'PUT' : 'POST'
    const url = editing.id ? `${API}/releases/${editing.id}` : `${API}/releases`
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    reload(); setEditing(null)
  }

  async function del(id) {
    await fetch(`${API}/releases/${id}`, { method: 'DELETE' }); reload()
  }

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>🚢 Releases</h3>
        <button className="btn-save" onClick={() => setEditing({ ...EMPTY_RELEASE })}>+ New Release</button>
      </div>
      <table className="opp-table">
        <thead><tr><th>Version</th><th>Name</th><th>Project</th><th>Status</th><th>Release Date</th><th>Tasks</th><th>Actions</th></tr></thead>
        <tbody>
          {releases.map(r => (
            <tr key={r.id}>
              <td className="opp-name">{r.version}</td>
              <td>{r.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{projects.find(p => p.id === r.project_id)?.name ?? '—'}</td>
              <td><StatusBadge status={r.status} /></td>
              <td style={{ fontSize: '0.8rem' }}>{r.release_date ? new Date(r.release_date).toLocaleDateString() : '—'}</td>
              <td>{Number(r.done_count ?? 0)}/{Number(r.task_count ?? 0)}</td>
              <td>
                <div className="row-hover-actions" style={{ opacity: 1 }}>
                  <button className="row-hover-btn" onClick={() => setEditing({ ...r, release_date: r.release_date ? r.release_date.split('T')[0] : '' })}>Edit</button>
                  <button className="row-hover-btn danger" onClick={() => del(r.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!releases.length && <tr><td colSpan={7} className="opp-empty">No releases yet.</td></tr>}
        </tbody>
      </table>

      {editing && (
        <div className="panel-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="panel">
            <div className="panel-header">
              <h3>{editing.id ? 'Edit Release' : 'New Release'}</h3>
              <button className="panel-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="modal-field">
                <label>Project *</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.project_id} onChange={e => setEditing(p => ({ ...p, project_id: e.target.value }))}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {[{ key: 'version', label: 'Version *', placeholder: 'v1.0.0' }, { key: 'name', label: 'Name', placeholder: 'Release name' }, { key: 'description', label: 'Description', placeholder: '' }].map(f => (
                <div className="modal-field" key={f.key}>
                  <label>{f.label}</label>
                  <input value={editing[f.key]} placeholder={f.placeholder} onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="modal-field">
                <label>Status</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.status} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}>
                  {['Planning','In Progress','Released'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Release Date</label>
                <input type="date" value={editing.release_date} onChange={e => setEditing(p => ({ ...p, release_date: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save" onClick={save} disabled={!editing.version || !editing.project_id}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ideas ──────────────────────────────────────────────────────────────────
function Ideas({ projects }) {
  const [tasks, reload] = useApi(`${API}/tasks?status=Idea`)
  const [releases, reloadReleases] = useApi(`${API}/releases`)
  const [bulkText, setBulkText] = useState('')
  const [bulkProject, setBulkProject] = useState('')
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { reloadReleases() }, [reloadReleases])

  async function handleBulkImport() {
    const ideas = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!ideas.length) return
    setImporting(true)
    await fetch(`${API}/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas, project_id: bulkProject || null })
    })
    setBulkText(''); reload(); setImporting(false)
  }

  async function promoteTask(task, release_id, project_id) {
    await fetch(`${API}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: 'Backlog', release_id: release_id || null, project_id: project_id || task.project_id })
    })
    reload()
  }

  async function del(id) {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' }); reload()
  }

  async function save() {
    if (!editing.title) return
    await fetch(`${API}/tasks/${editing.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing)
    })
    setEditing(null); reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Bulk import */}
      <div className="opp-section">
        <div className="opp-header"><h3>💡 Bulk Import Ideas</h3></div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type one idea per line, then click Import.</p>
          <textarea
            rows={6}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={'Add dark mode toggle to research page\neBay price lookup on card detail\nExport my cards to CSV\nPush notifications for price drops'}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.88rem', background: 'var(--card)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="opp-filter" value={bulkProject} onChange={e => setBulkProject(e.target.value)}>
              <option value="">No project (unassigned)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn-save" onClick={handleBulkImport} disabled={importing || !bulkText.trim()}>
              {importing ? 'Importing...' : `⬇️ Import ${bulkText.split('\n').filter(l => l.trim()).length} Ideas`}
            </button>
          </div>
        </div>
      </div>

      {/* Ideas list */}
      <div className="opp-section">
        <div className="opp-header">
          <h3>📝 Ideas Backlog <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({tasks.length})</span></h3>
        </div>
        <table className="opp-table">
          <thead><tr><th>Idea</th><th>Project</th><th>Priority</th><th>Size</th><th>Assign to Release</th><th>Actions</th></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.title}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{projects.find(p => p.id === t.project_id)?.name ?? <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}</td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><ShirtBadge size={t.shirt_size} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select className="opp-filter" style={{ fontSize: '0.78rem' }}
                      defaultValue=""
                      onChange={e => e.target.value && promoteTask(t, e.target.value, t.project_id)}>
                      <option value="">Move to release...</option>
                      {releases.map(r => <option key={r.id} value={r.id}>{r.version} — {r.name || projects.find(p => p.id === r.project_id)?.name}</option>)}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="row-hover-actions" style={{ opacity: 1 }}>
                    <button className="row-hover-btn" onClick={() => setEditing({ ...t, release_id: t.release_id ?? '' })}>Edit</button>
                    <button className="row-hover-btn danger" onClick={() => del(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!tasks.length && <tr><td colSpan={6} className="opp-empty">No ideas yet. Use the bulk importer above.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="panel-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ width: 560, padding: 0 }}>
            <div className="modal-header">
              <h3>Edit Idea</h3>
              <button className="panel-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="modal-field">
                <label>Title *</label>
                <input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>Description</label>
                <textarea rows={2} value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.9rem', background: 'var(--card)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div className="modal-field">
                <label>Project</label>
                <select className="opp-filter" style={{ width: '100%' }} value={editing.project_id ?? ''} onChange={e => setEditing(p => ({ ...p, project_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {[
                { key: 'priority',   label: 'Priority',  opts: ['Low','Medium','High','Critical'] },
                { key: 'shirt_size', label: 'Size',      opts: ['XS','S','M','L','XL'] },
              ].map(f => (
                <div className="modal-field" key={f.key}>
                  <label>{f.label}</label>
                  <select className="opp-filter" style={{ width: '100%' }} value={editing[f.key]} onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save" onClick={save} disabled={!editing.title}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Roadmap ──────────────────────────────────────────────────────────────────
function Roadmap({ projects }) {
  const [releases, reloadReleases] = useApi(`${API}/releases`)
  const [tasks, reloadTasks] = useApi(`${API}/tasks`)

  useEffect(() => { reloadReleases(); reloadTasks() }, [reloadReleases, reloadTasks])

  const unassigned = tasks.filter(t => !t.release_id && t.status !== 'Idea')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {releases.map(r => {
        const relTasks = tasks.filter(t => String(t.release_id) === String(r.id))
        const done = relTasks.filter(t => t.status === 'Done').length
        const pct  = relTasks.length ? Math.round((done / relTasks.length) * 100) : 0
        const project = projects.find(p => p.id === r.project_id)
        const totalShirt = relTasks.reduce((s, t) => s + ({ XS:1, S:3, M:8, L:20, XL:40 }[t.shirt_size] ?? 3), 0)
        const shirtLabel = totalShirt <= 10 ? 'XS' : totalShirt <= 25 ? 'S' : totalShirt <= 50 ? 'M' : totalShirt <= 100 ? 'L' : 'XL'

        return (
          <div key={r.id} className="opp-section">
            <div className="opp-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ color: 'var(--brand)' }}>{r.version}</h3>
                {r.name && <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{r.name}</span>}
                {project && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {project.name}</span>}
                <StatusBadge status={r.status} />
                <ShirtBadge size={shirtLabel} />
                {r.release_date && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {new Date(r.release_date).toLocaleDateString()}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{done}/{relTasks.length} done</span>
                <div style={{ width: 100, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
            </div>
            {relTasks.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                {relTasks.map(t => (
                  <div key={t.id} style={{ background: 'var(--card)', border: `1px solid ${t.status === 'Done' ? 'var(--green)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', opacity: t.status === 'Done' ? 0.7 : 1 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TYPE_ICONS[t.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', textDecoration: t.status === 'Done' ? 'line-through' : 'none' }}>{t.title}</div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <ShirtBadge size={t.shirt_size} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="opp-empty">No tasks assigned to this release yet.</div>
            )}
          </div>
        )
      })}

      {unassigned.length > 0 && (
        <div className="opp-section">
          <div className="opp-header"><h3 style={{ color: 'var(--text-muted)' }}>📥 Unassigned Tasks</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', padding: '1rem 1.5rem' }}>
            {unassigned.map(t => (
              <div key={t.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TYPE_ICONS[t.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={t.status} />
                    <ShirtBadge size={t.shirt_size} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!releases.length && <div className="opp-empty" style={{ padding: '3rem', textAlign: 'center' }}>No releases yet. Create one in the Releases tab.</div>}
    </div>
  )
}

// ── Analysis ──────────────────────────────────────────────────────────────────
function Analysis() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`${API}/analysis`).then(r => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) return <div className="opp-loading">Loading analysis...</div>

  function BarChart({ rows, labelKey, countKey, color }) {
    const max = Math.max(...rows.map(r => Number(r[countKey])), 1)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map(r => (
          <div key={r[labelKey]} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 110, fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{r[labelKey]}</span>
            <div style={{ flex: 1, height: 20, background: 'var(--gray-100)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ width: `${(Number(r[countKey]) / max) * 100}%`, height: '100%', background: color, borderRadius: 10, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ width: 30, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{r[countKey]}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="kpi-grid">
        {[
          { label: 'Total Projects', value: data.projectStats.reduce((s, r) => s + Number(r.cnt), 0), accent: 'var(--blue)' },
          { label: 'Total Tasks',    value: data.tasksByStatus.reduce((s, r) => s + Number(r.cnt), 0), accent: 'var(--purple)' },
          { label: 'Done',           value: data.tasksByStatus.find(r => r.status === 'Done')?.cnt ?? 0, accent: 'var(--green)' },
          { label: 'Total Releases', value: data.releaseStats.reduce((s, r) => s + Number(r.releases), 0), accent: 'var(--orange)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-accent" style={{ background: k.accent }} />
            <div className="kpi-content">
              <span className="kpi-value">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="home-grid">
        <div className="opp-section">
          <div className="opp-header"><h3>Tasks by Type</h3></div>
          <div style={{ padding: '1rem 1.5rem' }}>
            <BarChart rows={data.tasksByType} labelKey="type" countKey="cnt" color="var(--blue)" />
          </div>
        </div>
        <div className="opp-section">
          <div className="opp-header"><h3>Tasks by Status</h3></div>
          <div style={{ padding: '1rem 1.5rem' }}>
            <BarChart rows={data.tasksByStatus} labelKey="status" countKey="cnt" color="var(--green)" />
          </div>
        </div>
        <div className="opp-section">
          <div className="opp-header"><h3>Tasks by Priority</h3></div>
          <div style={{ padding: '1rem 1.5rem' }}>
            <BarChart rows={data.tasksByPriority} labelKey="priority" countKey="cnt" color="var(--orange)" />
          </div>
        </div>
        <div className="opp-section">
          <div className="opp-header"><h3>Tasks by Shirt Size</h3></div>
          <div style={{ padding: '1rem 1.5rem' }}>
            <BarChart rows={data.tasksByShirt} labelKey="shirt_size" countKey="cnt" color="var(--purple)" />
          </div>
        </div>
      </div>

      <div className="opp-section">
        <div className="opp-header"><h3>Project Shirt Sizes</h3></div>
        <table className="opp-table">
          <thead><tr><th>Project</th><th>Status</th><th>Shirt Size</th><th>Progress</th></tr></thead>
          <tbody>
            {data.projectsWithShirt.map(p => (
              <tr key={p.id}>
                <td className="opp-name">{p.name}</td>
                <td><StatusBadge status={p.status} /></td>
                <td><ShirtBadge size={p.shirt_size} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${p.task_count > 0 ? (p.done_count / p.task_count) * 100 : 0}%`, height: '100%', background: 'var(--green)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Number(p.done_count ?? 0)}/{Number(p.task_count ?? 0)}</span>
                  </div>
                </td>
              </tr>
            ))}
            {!data.projectsWithShirt.length && <tr><td colSpan={4} className="opp-empty">No projects yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'projects',  label: 'Projects',  icon: '📁' },
  { key: 'tasks',     label: 'Tasks',     icon: '✅' },
  { key: 'releases',  label: 'Releases',  icon: '🚢' },
  { key: 'ideas',     label: 'Ideas',     icon: '💡' },
  { key: 'roadmap',   label: 'Roadmap',   icon: '🗺️' },
  { key: 'analysis',  label: 'Analysis',  icon: '📊' },
]

export default function ProjectTracker() {
  const [tab, setTab] = useState('projects')
  const [projects, reloadProjects] = useApi(`${API}/projects`)

  return (
    <div>
      <nav className="sub-tabs" style={{ marginBottom: 'var(--sp-6)' }}>
        {TABS.map(t => (
          <button key={t.key} className={`sub-tab ${tab === t.key ? 'sub-tab-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      {tab === 'projects' && <Projects onReload={reloadProjects} />}
      {tab === 'tasks'    && <Tasks projects={projects} />}
      {tab === 'releases' && <Releases projects={projects} />}
      {tab === 'ideas'    && <Ideas projects={projects} />}
      {tab === 'roadmap'  && <Roadmap projects={projects} />}
      {tab === 'analysis' && <Analysis />}
    </div>
  )
}
