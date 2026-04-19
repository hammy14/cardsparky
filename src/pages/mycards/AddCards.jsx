import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'

const SPORTS = ['Baseball','Basketball','Football','Hockey','Soccer','Wrestling','UFC','Racing','Formula 1','Golf','Pokemon','Magic','YuGiOh','Funko']
const TYPES  = ['Base','Insert','Parallel']
const DRAFT_KEY = 'cs_add_card_draft'

const EMPTY = { Sport: '', Year: new Date().getFullYear().toString(), Card: '', Name: '', Number: '', Type: '', RookieCard: '0', SerielNumbered: '', Qty: '1', UngradedPrice: '', Cost: '', SerialNumber: '', ProductType: '', PurchaseName: '' }

function fcur(n) { return '$' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function loadDraft() {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY)) } }
  catch { return EMPTY }
}

function Autocomplete({ value, suggestions = [], onChange, placeholder, style }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="opp-search"
        style={{ width: '100%', ...style }}
        placeholder={placeholder}
        defaultValue={value}
        key={value === '' ? 'empty' : undefined}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
          {suggestions.map(s => (
            <button key={s} onMouseDown={() => {
              onChange(s)
              if (inputRef.current) inputRef.current.value = s
              setOpen(false)
            }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.4rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)' }}
              onMouseEnter={e => e.target.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentCards({ owner, refresh, onEdit }) {
  const [cards, setCards] = useState([])
  const showToast = useToast()

  const load = useCallback(() => {
    if (!owner) return
    fetch(`http://localhost:3001/api/mycards/recent?owner=${encodeURIComponent(owner)}&limit=8`)
      .then(r => r.json()).then(setCards).catch(() => {})
  }, [owner, refresh])

  useEffect(() => { load() }, [load])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return
    await fetch(`http://localhost:3001/api/mycards/card/${id}?owner=${encodeURIComponent(owner)}`, { method: 'DELETE' })
    showToast('Card deleted', 'info')
    load()
  }

  if (!cards.length) return null

  return (
    <div className="opp-section" style={{ marginTop: '1.5rem' }}>
      <div className="opp-header"><h3>🕐 Recently Added</h3></div>
      <div className="home-card-list">
        {cards.map(c => (
          <div key={c.ID} className="home-list-item">
            <div className="home-list-main">
              <span className="home-list-title">{c.Name} — {c.Card}</span>
              <span className="home-list-sub">{c.Sport} · {c.Year}{c.Type ? ` · ${c.Type}` : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 500 }}>{fcur(c.UngradedPrice)}</span>
              <button className="icon-btn" onClick={() => onEdit(c)} title="Edit">✏️</button>
              <button className="icon-btn" onClick={() => handleDelete(c.ID, c.Name)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AddCards() {
  const { currentUser } = useAuth()
  const showToast = useToast()
  const owner = currentUser?.owner ?? currentUser?.name ?? ''

  const [form, setForm] = useState(loadDraft)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [quickAdd, setQuickAdd] = useState(false)
  const [refreshRecent, setRefreshRecent] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [mode, setMode] = useState('single')
  const [bulkRows, setBulkRows] = useState([{ ...EMPTY }])
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [numberSuggestions, setNumberSuggestions] = useState([])
  const nameTimer = useRef(null)
  const numberTimer = useRef(null)

  function fetchNameSuggestions(q) {
    clearTimeout(nameTimer.current)
    if (q.length < 2) { setNameSuggestions([]); return }
    nameTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ owner, q, sport: form.Sport })
        const res = await fetch(`http://localhost:3001/api/mycards/suggest?${params}`)
        setNameSuggestions(await res.json())
      } catch {}
    }, 300)
  }

  function fetchNumberSuggestions(q) {
    clearTimeout(numberTimer.current)
    if (!form.Sport || !form.Card) return
    numberTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ owner, sport: form.Sport, card: form.Card })
        const res = await fetch(`http://localhost:3001/api/mycards/numbersuggest?${params}`)
        setNumberSuggestions(await res.json())
      } catch {}
    }, 300)
  }

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  }, [form])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate(f = form) {
    const e = {}
    if (!f.Sport) e.Sport = 'Required'
    if (!f.Year)  e.Year  = 'Required'
    if (!f.Card)  e.Card  = 'Required'
    if (!f.Name)  e.Name  = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submitCard(data) {
    const res = await fetch('http://localhost:3001/api/mycards/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        owner,
        SerialNumber: data.SerialNumber !== '' ? Number(data.SerialNumber) : 0,
        SerielNumbered: data.SerielNumbered !== '' ? Number(data.SerielNumbered) : 0,
        UngradedPrice: data.UngradedPrice !== '' ? Number(data.UngradedPrice) : 0,
        Cost: data.Cost !== '' ? Number(data.Cost) : 0,
        Qty: data.Qty !== '' ? Number(data.Qty) : 1,
        Type: data.Type || '',
        Number: data.Number || '',
        ProductType: data.ProductType || '',
        PurchaseName: data.PurchaseName || '',
      })
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    return json
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await submitCard(form)
      showToast(`✅ Added: ${form.Name} — ${form.Card}`, 'success')
      setRefreshRecent(r => r + 1)
      setEditingId(null)
      if (quickAdd) setForm(f => ({ ...EMPTY, Sport: f.Sport, Year: f.Year }))
      else { setForm(EMPTY); localStorage.removeItem(DRAFT_KEY) }
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error')
    }
    setSubmitting(false)
  }

  async function handleBulkSubmit() {
    const valid = bulkRows.filter(r => r.Sport && r.Year && r.Card && r.Name)
    if (!valid.length) { showToast('No valid rows to submit', 'error'); return }
    setSubmitting(true)
    let count = 0
    for (const row of valid) {
      try { await submitCard(row); count++ } catch {}
    }
    showToast(`✅ Added ${count} cards`, 'success')
    setRefreshRecent(r => r + 1)
    setBulkRows([{ ...EMPTY }])
    setSubmitting(false)
  }

  function handleEdit(card) {
    setEditingId(card.ID)
    setMode('single')
    setForm({
      Sport: card.Sport ?? '', Year: card.Year ?? '', Card: card.Card ?? '',
      Name: card.Name ?? '', Number: card.Number ?? '', Type: card.Type ?? '',
      RookieCard: card.RookieCard ?? '0', SerielNumbered: card.SerielNumbered ?? '',
      Qty: card.Qty ?? '1', UngradedPrice: card.UngradedPrice ?? '',
      Cost: card.Cost ?? '', SerialNumber: '', ProductType: '', PurchaseName: ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '0.5rem 0.75rem',
    border: `1px solid ${errors[field] ? 'var(--red)' : 'var(--gray-200)'}`,
    borderRadius: 'var(--radius)', fontSize: '0.9rem',
    background: 'var(--card)', color: 'var(--text)'
  })

  function Field({ label, field, required, children }) {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: errors[field] ? 'var(--red)' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
          {label}{required && ' *'}
        </label>
        {children}
        {errors[field] && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{errors[field]}</span>}
      </div>
    )
  }

  function SectionHeader({ title, cols = '1 / -1' }) {
    return (
      <div style={{ gridColumn: cols, borderBottom: '2px solid var(--blue)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--blue)' }}>{title}</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="opp-section">
        <div className="opp-header">
          <h3>{editingId ? '✏️ Edit Card' : '➕ Add a Card'}</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="toggle-group">
              <button className={`toggle-btn ${mode === 'single' ? 'toggle-active' : ''}`} onClick={() => setMode('single')}>Single</button>
              <button className={`toggle-btn ${mode === 'bulk' ? 'toggle-active' : ''}`} onClick={() => setMode('bulk')}>Bulk</button>
            </div>
            {mode === 'single' && !editingId && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={quickAdd} onChange={e => setQuickAdd(e.target.checked)} />
                Quick-add mode
              </label>
            )}
            {editingId && (
              <button className="btn-cancel" onClick={() => { setEditingId(null); setForm(EMPTY) }}>Cancel Edit</button>
            )}
          </div>
        </div>

        {mode === 'single' && (
          <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <SectionHeader title="Card Identity" />

            <Field label="Sport" field="Sport" required>
              <select value={form.Sport} onChange={e => set('Sport', e.target.value)} style={inputStyle('Sport')}>
                <option value="">Select...</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Year" field="Year" required>
              <input type="number" value={form.Year} onChange={e => set('Year', e.target.value)} style={inputStyle('Year')} />
            </Field>

            <Field label="Card (Set Name)" field="Card" required>
              <input type="text" value={form.Card} onChange={e => set('Card', e.target.value)} style={inputStyle('Card')} placeholder="e.g. Topps Chrome" />
            </Field>

            <Field label="Name (Player/Subject)" field="Name" required>
              <Autocomplete
                value={form.Name}
                placeholder="e.g. Mike Trout"
                suggestions={nameSuggestions}
                onChange={v => { set('Name', v); fetchNameSuggestions(v) }}
              />
              {errors.Name && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{errors.Name}</span>}
            </Field>

            <SectionHeader title="Card Details" />

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <Field label="Number" field="Number">
                <Autocomplete
                  value={form.Number}
                  placeholder="Card #"
                  suggestions={numberSuggestions}
                  onChange={v => { set('Number', v); fetchNumberSuggestions(v) }}
                />
              </Field>
              <Field label="Type" field="Type">
                <select value={form.Type} onChange={e => set('Type', e.target.value)} style={inputStyle('Type')}>
                  <option value="">Select...</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Rookie Card" field="RookieCard">
                <select value={form.RookieCard} onChange={e => set('RookieCard', e.target.value)} style={inputStyle('RookieCard')}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </Field>
              <Field label="Serial Numbered (out of)" field="SerielNumbered">
                <input type="number" value={form.SerielNumbered} onChange={e => set('SerielNumbered', e.target.value)} style={inputStyle('SerielNumbered')} placeholder="e.g. 25" />
              </Field>
              {Number(form.SerielNumbered) > 0
                ? <Field label="Serial # (your card)" field="SerialNumber">
                    <input type="number" value={form.SerialNumber} onChange={e => set('SerialNumber', e.target.value)} style={inputStyle('SerialNumber')} placeholder="e.g. 12" />
                  </Field>
                : <Field label="Qty" field="Qty">
                    <input type="number" min="1" value={form.Qty} onChange={e => set('Qty', e.target.value)} style={inputStyle('Qty')} />
                  </Field>
              }
              {Number(form.SerielNumbered) > 0 && (
                <Field label="Qty" field="Qty">
                  <input type="number" min="1" value={form.Qty} onChange={e => set('Qty', e.target.value)} style={inputStyle('Qty')} />
                </Field>
              )}
            </div>

            {/* Financial + Purchase Info combined row */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '1rem', alignItems: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <SectionHeader title="Financial" cols="1 / -1" />
                <Field label="Value (Ungraded Price)" field="UngradedPrice">
                  <input type="number" step="0.01" value={form.UngradedPrice} onChange={e => set('UngradedPrice', e.target.value)} style={inputStyle('UngradedPrice')} placeholder="0.00" />
                </Field>
                <Field label="Cost (What you paid)" field="Cost">
                  <input type="number" step="0.01" value={form.Cost} onChange={e => set('Cost', e.target.value)} style={inputStyle('Cost')} placeholder="0.00" />
                </Field>
              </div>
              <div style={{ background: 'var(--border)', alignSelf: 'stretch', margin: '0 0.5rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <SectionHeader title="Purchase Info" cols="1 / -1" />
                <Field label="Product Type" field="ProductType">
                  <input type="text" maxLength={150} value={form.ProductType} onChange={e => set('ProductType', e.target.value)} style={inputStyle('ProductType')} placeholder="e.g. Hobby Box" />
                </Field>
                <Field label="Purchase Name" field="PurchaseName">
                  <input type="text" maxLength={25} value={form.PurchaseName} onChange={e => set('PurchaseName', e.target.value)} style={inputStyle('PurchaseName')} placeholder="e.g. eBay" />
                </Field>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-save" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }} disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? '💾 Save Changes' : '➕ Add Card'}
              </button>
            </div>
          </form>
        )}

        {mode === 'bulk' && (
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Fill in each row. Sport, Year, Card, and Name are required per row.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="opp-table">
                <thead>
                  <tr>
                    {['Sport','Year','Card','Name','Number','Type','RC','Qty','Value','Cost'].map(h => <th key={h}>{h}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, i) => (
                    <tr key={i}>
                      {[
                        <select value={row.Sport} onChange={e => { const r=[...bulkRows]; r[i]={...r[i],Sport:e.target.value}; setBulkRows(r) }} style={{ ...inputStyle(''), width: 100, padding: '0.25rem' }}>
                          <option value="">Sport</option>{SPORTS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>,
                        <input type="number" value={row.Year} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Year:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:70,padding:'0.25rem'}} placeholder="Year" />,
                        <input type="text" value={row.Card} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Card:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:120,padding:'0.25rem'}} placeholder="Card" />,
                        <input type="text" value={row.Name} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Name:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:120,padding:'0.25rem'}} placeholder="Name" />,
                        <input type="text" value={row.Number} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Number:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:60,padding:'0.25rem'}} placeholder="#" />,
                        <select value={row.Type} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Type:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:80,padding:'0.25rem'}}>
                          <option value="">Type</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>,
                        <select value={row.RookieCard} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],RookieCard:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:60,padding:'0.25rem'}}>
                          <option value="0">No</option><option value="1">Yes</option>
                        </select>,
                        <input type="number" value={row.Qty} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Qty:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:50,padding:'0.25rem'}} />,
                        <input type="number" step="0.01" value={row.UngradedPrice} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],UngradedPrice:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:80,padding:'0.25rem'}} placeholder="0.00" />,
                        <input type="number" step="0.01" value={row.Cost} onChange={e=>{const r=[...bulkRows];r[i]={...r[i],Cost:e.target.value};setBulkRows(r)}} style={{...inputStyle(''),width:80,padding:'0.25rem'}} placeholder="0.00" />,
                      ].map((cell, ci) => <td key={ci}>{cell}</td>)}
                      <td>
                        <button className="icon-btn" onClick={() => setBulkRows(r => r.filter((_, ri) => ri !== i))}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-cancel" onClick={() => setBulkRows(r => [...r, { ...EMPTY }])}>+ Add Row</button>
              <button className="btn-save" onClick={handleBulkSubmit} disabled={submitting}>{submitting ? 'Saving...' : `➕ Add ${bulkRows.filter(r => r.Sport && r.Year && r.Card && r.Name).length} Cards`}</button>
            </div>
          </div>
        )}
      </div>

      <RecentCards owner={owner} refresh={refreshRecent} onEdit={handleEdit} />
    </div>
  )
}
