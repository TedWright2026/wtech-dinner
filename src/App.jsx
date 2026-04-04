import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlskrouwwfsdoefaldyi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsc2tyb3V3d2ZzZG9lZmFsZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjA4MzcsImV4cCI6MjA4ODY5NjgzN30.tqkOQCOgHioV-i0rdmR_j4QedvqMFj_E_x116pthz9c'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ADMIN_PASSWORD = 'wtech2026'
const NAVY = '#1B4B8A'
const RED = '#E8422A'
const NUM_TABLES = 8
const SEATS_PER_TABLE = 5

export default function App() {
  const [view, setView] = useState('guest') // 'guest' | 'admin'
  const [adminAuthed, setAdminAuthed] = useState(false)

  return (
    <>
      <style>{globalStyles}</style>
      <div className="bg">
        <header className="hdr">
          <img src="https://raw.githubusercontent.com/TedWright2026/wtech-dinner/main/wtech-logo.png" alt="WTech Fire Group" className="hdr-logo" />
          <div className="hdr-divider" />
          <h1>Wednesday Evening<br /><em>Dinner Selection</em></h1>
          <p>Wednesday 22 April 2026 · O'Pescatore · Albufeira</p>
          <div className="hdr-nav">
            <button className={`nav-btn ${view === 'guest' ? 'active' : ''}`} onClick={() => setView('guest')}>Select My Meal</button>
            <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>Admin</button>
          </div>
        </header>

        {view === 'guest' && <GuestView />}
        {view === 'admin' && (
          adminAuthed
            ? <AdminView />
            : <AdminLogin onAuth={() => setAdminAuthed(true)} />
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────
// GUEST VIEW
// ─────────────────────────────────────────────────────
function GuestView() {
  const [guests, setGuests] = useState([])
  const [menu, setMenu] = useState({})
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [existingSelection, setExistingSelection] = useState(null)
  const [choices, setChoices] = useState({ starter: '', main: '', dessert: '', wine: '' })
  const [step, setStep] = useState('select-guest') // 'select-guest' | 'make-choices' | 'done'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchGuests(), fetchMenu()])
  }, [])

  async function fetchGuests() {
    const { data } = await supabase.from('dinner_guests').select('*').order('name')
    setGuests(data || [])
    setLoading(false)
  }

  async function fetchMenu() {
    const { data } = await supabase.from('dinner_menu').select('*').eq('active', true).order('sort_order')
    if (!data) return
    const grouped = {}
    data.forEach(item => {
      if (!grouped[item.course]) grouped[item.course] = []
      grouped[item.course].push(item)
    })
    setMenu(grouped)
  }

  async function handleGuestSelect(guest) {
    setSelectedGuest(guest)
    // Check if already submitted
    const { data } = await supabase.from('dinner_selections').select('*').eq('guest_id', guest.id).single()
    if (data) {
      setExistingSelection(data)
      setChoices({ starter: data.starter, main: data.main, dessert: data.dessert, wine: data.wine })
    }
    setStep('make-choices')
  }

  async function handleSubmit() {
    if (!choices.starter || !choices.main || !choices.dessert || !choices.wine) {
      setError('Please make all four selections before submitting.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      guest_id: selectedGuest.id,
      guest_name: selectedGuest.name,
      company: selectedGuest.company,
      starter: choices.starter,
      main: choices.main,
      dessert: choices.dessert,
      wine: choices.wine,
      submitted_at: new Date().toISOString()
    }
    const { error: err } = existingSelection
      ? await supabase.from('dinner_selections').update(payload).eq('guest_id', selectedGuest.id)
      : await supabase.from('dinner_selections').insert(payload)
    setSaving(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    setStep('done')
  }

  if (loading) return <div className="wrap"><div className="loading">Loading menu…</div></div>

  if (step === 'done') {
    return (
      <div className="wrap">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Thank you, {selectedGuest.name.split(' ')[0]}!</h2>
          <p>Your meal selection has been saved. We look forward to a wonderful evening together.</p>
          <div className="summary-grid">
            <div className="summary-item"><div className="summary-label">Starter</div><div className="summary-val">{choices.starter}</div></div>
            <div className="summary-item"><div className="summary-label">Main</div><div className="summary-val">{choices.main}</div></div>
            <div className="summary-item"><div className="summary-label">Dessert</div><div className="summary-val">{choices.dessert}</div></div>
            <div className="summary-item"><div className="summary-label">Wine</div><div className="summary-val">{choices.wine}</div></div>
          </div>
          <button className="btn-secondary" onClick={() => { setStep('select-guest'); setSelectedGuest(null); setExistingSelection(null); setChoices({ starter: '', main: '', dessert: '', wine: '' }) }}>
            Make another selection
          </button>
        </div>
      </div>
    )
  }

  if (step === 'select-guest') {
    return (
      <div className="wrap">
        <div className="card">
          <div className="card-eyebrow">Step 1 of 2</div>
          <h2>Who are you?</h2>
          <p className="card-desc">Select your name from the list below to begin your meal selection.</p>
          <div style={{ marginTop: 20 }}>
            <select value="" onChange={e => {
              const g = guests.find(g => g.id === e.target.value)
              if (g) handleGuestSelect(g)
            }}>
              <option value="" disabled>Select your name…</option>
              {guests.map(g => <option key={g.id} value={g.id}>{g.name} — {g.company}</option>)}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // make-choices step
  const courses = [
    { key: 'starter', label: 'Starter', eyebrow: 'Step 2 of 2 — Choose your starter' },
    { key: 'main', label: 'Main Course', eyebrow: 'Choose your main course' },
    { key: 'dessert', label: 'Dessert', eyebrow: 'Choose your dessert' },
    { key: 'wine', label: 'Wine', eyebrow: 'Choose your wine' },
  ]

  return (
    <div className="wrap">
      {existingSelection && (
        <div className="info-banner">You have already submitted a selection. You can update it below.</div>
      )}

      <div className="guest-greeting">
        <span className="guest-name-tag">{selectedGuest.name}</span>
        <span className="guest-company-tag">{selectedGuest.company}</span>
        <button className="change-btn" onClick={() => { setStep('select-guest'); setSelectedGuest(null); setExistingSelection(null); setChoices({ starter: '', main: '', dessert: '', wine: '' }) }}>Not you?</button>
      </div>

      {/* Couvert note */}
      {menu.couvert && (
        <div className="couvert-card">
          <div className="couvert-label">Included — Couvert</div>
          <div className="couvert-desc">{menu.couvert[0]?.description}</div>
        </div>
      )}

      {courses.map(course => (
        <div key={course.key} className="card">
          <div className="card-eyebrow">{course.eyebrow}</div>
          <h2>{course.label}</h2>
          <div className="opts">
            {(menu[course.key] || []).map(item => (
              <button
                key={item.id}
                className={`opt ${choices[course.key] === item.dish_name ? 'selected' : ''}`}
                onClick={() => setChoices(c => ({ ...c, [course.key]: item.dish_name }))}
              >
                <div className="opt-dot" />
                <div>
                  <div className="opt-name">{item.dish_name}</div>
                  <div className="opt-desc">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && <div className="error-msg">{error}</div>}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={saving || !choices.starter || !choices.main || !choices.dessert || !choices.wine}
      >
        {saving ? 'Saving…' : existingSelection ? 'Update My Selection' : 'Confirm My Selection'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <div className="card" style={{ marginTop: 40 }}>
        <div className="card-eyebrow">Admin Access</div>
        <h2>Enter Password</h2>
        <input className="text-input" type="password" placeholder="Password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && (pw === ADMIN_PASSWORD ? onAuth() : setErr(true))} />
        {err && <div className="error-msg">Incorrect password.</div>}
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => pw === ADMIN_PASSWORD ? onAuth() : setErr(true)}>Enter</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────────────
function AdminView() {
  const [tab, setTab] = useState('responses')
  const [guests, setGuests] = useState([])
  const [selections, setSelections] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from('dinner_guests').select('*').order('name'),
      supabase.from('dinner_selections').select('*').order('guest_name')
    ])
    setGuests(g || [])
    setSelections(s || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const responded = guests.filter(g => selections.find(s => s.guest_id === g.id))
  const pending = guests.filter(g => !selections.find(s => s.guest_id === g.id))
  const pct = guests.length ? Math.round((responded.length / guests.length) * 100) : 0

  function exportCSV() {
    const rows = [['Name', 'Company', 'Starter', 'Main', 'Dessert', 'Wine', 'Table', 'Submitted']]
    guests.forEach(g => {
      const s = selections.find(x => x.guest_id === g.id)
      rows.push([
        g.name, g.company,
        s?.starter || '', s?.main || '', s?.dessert || '', s?.wine || '',
        g.table_number ? `Table ${g.table_number}` : '',
        s?.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''
      ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'wtech-dinner-selections.csv'
    a.click()
  }

  if (loading) return <div className="admin-wrap"><div className="loading">Loading…</div></div>

  return (
    <div className="admin-wrap">
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{responded.length}</div>
          <div className="stat-label">Responded</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#facc15' }}>{pending.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{guests.length}</div>
          <div className="stat-label">Total Guests</div>
        </div>
        <div className="stat-card" style={{ flex: 2 }}>
          <div className="stat-label" style={{ marginBottom: 8 }}>Response Rate — {pct}%</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'responses' ? 'active' : ''}`} onClick={() => setTab('responses')}>Responses</button>
        <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>Pending ({pending.length})</button>
        <button className={`tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>Menu Summary</button>
        <button className={`tab ${tab === 'tables' ? 'active' : ''}`} onClick={() => setTab('tables')}>Table Planner</button>
        <button className={`tab ${tab === 'namecards' ? 'active' : ''}`} onClick={() => setTab('namecards')}>Name Cards</button>
        <button className="tab" style={{ marginLeft: 'auto', background: 'rgba(27,75,138,0.2)', borderColor: NAVY }} onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {tab === 'responses' && <ResponsesTab guests={guests} selections={selections} />}
      {tab === 'pending' && <PendingTab pending={pending} />}
      {tab === 'summary' && <SummaryTab selections={selections} />}
      {tab === 'tables' && <TablePlanner guests={guests} selections={selections} onRefresh={fetchAll} />}
      {tab === 'namecards' && <NameCards guests={guests} selections={selections} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// RESPONSES TAB
// ─────────────────────────────────────────────────────
function ResponsesTab({ guests, selections }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="resp-table">
        <thead>
          <tr>
            <th>Name</th><th>Company</th><th>Starter</th><th>Main</th><th>Dessert</th><th>Wine</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {guests.map(g => {
            const s = selections.find(x => x.guest_id === g.id)
            return (
              <tr key={g.id}>
                <td style={{ fontWeight: 500 }}>{g.name}</td>
                <td style={{ color: 'rgba(240,237,232,0.5)', fontSize: 13 }}>{g.company}</td>
                <td>{s?.starter || <span style={{ color: 'rgba(240,237,232,0.3)' }}>—</span>}</td>
                <td>{s?.main || <span style={{ color: 'rgba(240,237,232,0.3)' }}>—</span>}</td>
                <td>{s?.dessert || <span style={{ color: 'rgba(240,237,232,0.3)' }}>—</span>}</td>
                <td>{s?.wine || <span style={{ color: 'rgba(240,237,232,0.3)' }}>—</span>}</td>
                <td><span className={`pill ${s ? 'pill-done' : 'pill-pend'}`}>{s ? 'Done' : 'Pending'}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// PENDING TAB
// ─────────────────────────────────────────────────────
function PendingTab({ pending }) {
  if (!pending.length) return <div className="card" style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div><p>Everyone has responded!</p></div>
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="resp-table">
        <thead><tr><th>Name</th><th>Company</th><th>Status</th></tr></thead>
        <tbody>
          {pending.map(g => (
            <tr key={g.id}>
              <td style={{ fontWeight: 500 }}>{g.name}</td>
              <td style={{ color: 'rgba(240,237,232,0.5)', fontSize: 13 }}>{g.company}</td>
              <td><span className="pill pill-pend">Pending</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// MENU SUMMARY TAB
// ─────────────────────────────────────────────────────
function SummaryTab({ selections }) {
  function count(field) {
    const tally = {}
    selections.forEach(s => { tally[s[field]] = (tally[s[field]] || 0) + 1 })
    return Object.entries(tally).sort((a, b) => b[1] - a[1])
  }
  const courses = [
    { label: 'Starters', field: 'starter' },
    { label: 'Mains', field: 'main' },
    { label: 'Desserts', field: 'dessert' },
    { label: 'Wine', field: 'wine' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {courses.map(c => (
        <div key={c.field} className="card">
          <div className="card-eyebrow">{c.label}</div>
          {count(c.field).length === 0
            ? <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: 14 }}>No responses yet</p>
            : count(c.field).map(([name, n]) => (
              <div key={name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span style={{ color: NAVY, fontWeight: 600 }}>{n}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(n / selections.length) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TABLE PLANNER
// ─────────────────────────────────────────────────────
function TablePlanner({ guests, selections, onRefresh }) {
  const [dragging, setDragging] = useState(null) // guest id
  const [saving, setSaving] = useState(false)

  const assigned = guests.filter(g => g.table_number)
  const unassigned = guests.filter(g => !g.table_number)

  function getTableGuests(tableNum) {
    return guests.filter(g => g.table_number === tableNum)
  }

  async function assignGuest(guestId, tableNum) {
    setSaving(true)
    await supabase.from('dinner_guests').update({ table_number: tableNum }).eq('id', guestId)
    await onRefresh()
    setSaving(false)
  }

  async function removeGuest(guestId) {
    setSaving(true)
    await supabase.from('dinner_guests').update({ table_number: null }).eq('id', guestId)
    await onRefresh()
    setSaving(false)
  }

  async function autoAssign() {
    setSaving(true)

    // Fisher-Yates shuffle — genuinely random each time
    function shuffle(arr) {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    // Group guests by company, shuffle within each company
    const companies = [...new Set(guests.map(g => g.company))]
    const byCompany = {}
    companies.forEach(c => { byCompany[c] = shuffle(guests.filter(g => g.company === c)) })

    // Shuffle the company order too so tables start differently each run
    const shuffledCompanies = shuffle(companies)

    // Interleave one person from each company at a time
    const interleaved = []
    let i = 0
    while (interleaved.length < guests.length) {
      shuffledCompanies.forEach(c => { if (byCompany[c][i]) interleaved.push(byCompany[c][i]) })
      i++
    }

    // Assign to tables — distributing evenly and mixing companies
    for (let idx = 0; idx < interleaved.length; idx++) {
      const tableNum = (idx % NUM_TABLES) + 1
      await supabase.from('dinner_guests').update({ table_number: tableNum }).eq('id', interleaved[idx].id)
    }

    await onRefresh()
    setSaving(false)
  }

  async function clearAll() {
    setSaving(true)
    await supabase.from('dinner_guests').update({ table_number: null }).neq('id', '00000000-0000-0000-0000-000000000000')
    await onRefresh()
    setSaving(false)
  }

  const getSelection = (guestId) => selections.find(s => s.guest_id === guestId)

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={autoAssign} disabled={saving} style={{ width: 'auto', padding: '10px 20px' }}>
          ✦ Auto-Mix Tables
        </button>
        <button className="btn-secondary" onClick={clearAll} disabled={saving} style={{ width: 'auto', padding: '10px 20px' }}>
          Clear All
        </button>
        {saving && <span style={{ color: 'rgba(240,237,232,0.5)', lineHeight: '40px', fontSize: 14 }}>Saving…</span>}
      </div>

      <div className="planner-grid">
        {/* Unassigned */}
        <div className="unassigned-panel">
          <div className="panel-eyebrow">Unassigned ({unassigned.length})</div>
          {unassigned.length === 0
            ? <p style={{ color: 'rgba(240,237,232,0.35)', fontSize: 13 }}>All guests assigned ✓</p>
            : unassigned.map(g => (
              <div
                key={g.id}
                className="guest-chip draggable"
                draggable
                onDragStart={() => setDragging(g.id)}
                onDragEnd={() => setDragging(null)}
              >
                <div className="chip-dot" style={{ background: companyColor(g.company) }} />
                <div>
                  <div className="chip-name">{g.name}</div>
                  <div className="chip-company">{g.company}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Tables */}
        <div className="tables-grid">
          {Array.from({ length: NUM_TABLES }, (_, i) => i + 1).map(tableNum => {
            const tableGuests = getTableGuests(tableNum)
            const full = tableGuests.length >= SEATS_PER_TABLE
            return (
              <div
                key={tableNum}
                className={`table-card ${full ? 'full' : ''}`}
                onDragOver={e => { if (!full || dragging && tableGuests.find(g => g.id === dragging)) e.preventDefault() }}
                onDrop={e => { e.preventDefault(); if (dragging && !full) assignGuest(dragging, tableNum) }}
              >
                <div className="table-header">
                  <span className="table-title">Table {tableNum}</span>
                  <span className="table-count" style={{ color: full ? RED : 'rgba(240,237,232,0.4)' }}>
                    {tableGuests.length}/{SEATS_PER_TABLE}
                  </span>
                </div>
                <div className="table-seats">
                  {tableGuests.map(g => {
                    const sel = getSelection(g.id)
                    return (
                      <div key={g.id} className="seated-guest">
                        <div className="chip-dot" style={{ background: companyColor(g.company) }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="chip-name" style={{ fontSize: 13 }}>{g.name}</div>
                          {sel && <div className="chip-company">{sel.main} · {sel.wine}</div>}
                        </div>
                        <button className="remove-btn" onClick={() => removeGuest(g.id)} title="Remove">×</button>
                      </div>
                    )
                  })}
                  {Array.from({ length: SEATS_PER_TABLE - tableGuests.length }, (_, i) => (
                    <div key={`empty-${i}`} className="empty-seat">
                      Drop guest here
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// NAME CARDS TAB
// ─────────────────────────────────────────────────────
function NameCards({ guests, selections }) {
  const assigned = guests.filter(g => g.table_number).sort((a, b) => a.table_number - b.table_number || a.name.localeCompare(b.name))

  function printCards() {
    window.print()
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button className="btn-primary" onClick={printCards} style={{ width: 'auto', padding: '10px 20px' }}>
          🖨 Print Name Cards
        </button>
        <span style={{ color: 'rgba(240,237,232,0.4)', lineHeight: '40px', fontSize: 13 }}>
          Assign tables first — then print
        </span>
      </div>
      <div className="name-cards-grid" id="name-cards">
        {assigned.map(g => {
          const sel = selections.find(s => s.guest_id === g.id)
          return (
            <div key={g.id} className="name-card">
              <div className="name-card-table">Table {g.table_number}</div>
              <div className="name-card-accent" />
              <div className="name-card-name">{g.name}</div>
              <div className="name-card-company">{g.company}</div>
              {sel && (
                <div className="name-card-meal">
                  <span>{sel.starter}</span>
                  <span className="name-card-dot">·</span>
                  <span>{sel.main}</span>
                  <span className="name-card-dot">·</span>
                  <span>{sel.wine}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function companyColor(company) {
  const map = {
    'API': '#2a6dd9',
    'CE Sprinkler': '#059669',
    'Compco': '#d97706',
    'FeuerFuchs': '#dc2626',
    'Firecon': '#7c3aed',
    'Ideal Fire': '#db2777',
    'Pacisa': '#0891b2',
    'Safety Tech': '#65a30d',
    'SRS Alert': '#ea580c',
    'Wilec': '#0d9488',
    'WTech': '#1B4B8A',
    'Writech': '#6366f1',
  }
  return map[company] || '#666'
}

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #080d1a; color: #f0ede8; min-height: 100vh; }

  .bg {
    min-height: 100vh;
    background: radial-gradient(ellipse at 20% 10%, rgba(27,75,138,0.18) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 90%, rgba(232,66,42,0.10) 0%, transparent 55%), #080d1a;
  }

  /* HEADER */
  .hdr { padding: 40px 24px 0; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.07); background: linear-gradient(180deg, rgba(27,75,138,0.12) 0%, transparent 100%); }
  .hdr-logo { height: 90px; width: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(27,75,138,0.4)); }
  .hdr-divider { width: 48px; height: 3px; background: linear-gradient(90deg, ${NAVY}, ${RED}); border-radius: 100px; margin: 0 auto 20px; }
  .hdr h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 5vw, 52px); font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 10px; }
  .hdr h1 em { font-style: normal; background: linear-gradient(135deg, #2a6dd9, ${NAVY}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hdr p { font-size: 13px; color: rgba(240,237,232,0.45); letter-spacing: 0.06em; margin-bottom: 24px; }
  .hdr-nav { display: flex; justify-content: center; gap: 8px; padding: 16px 0; }
  .nav-btn { padding: 8px 22px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; color: rgba(240,237,232,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
  .nav-btn:hover { background: rgba(255,255,255,0.09); color: #f0ede8; }
  .nav-btn.active { background: ${NAVY}; border-color: ${NAVY}; color: #fff; font-weight: 600; box-shadow: 0 4px 14px rgba(27,75,138,0.4); }

  /* WRAP */
  .wrap { max-width: 660px; margin: 0 auto; padding: 40px 20px 80px; }
  .admin-wrap { max-width: 1140px; margin: 0 auto; padding: 36px 20px 80px; }

  /* CARDS */
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 28px; margin-bottom: 16px; }
  .card-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: ${RED}; margin-bottom: 10px; }
  .card h2 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: #f0ede8; margin-bottom: 18px; letter-spacing: -0.01em; }
  .card-desc { font-size: 14px; color: rgba(240,237,232,0.5); margin-bottom: 18px; line-height: 1.6; }

  /* SELECT */
  select { width: 100%; padding: 13px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 15px; appearance: none; cursor: pointer; outline: none; }
  select:focus { border-color: ${NAVY}; box-shadow: 0 0 0 3px rgba(27,75,138,0.2); }
  select option { background: #131929; }

  /* OPTIONS */
  .opts { display: grid; gap: 8px; }
  .opt { display: flex; align-items: flex-start; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; }
  .opt:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15); }
  .opt.selected { background: rgba(27,75,138,0.18); border-color: ${NAVY}; }
  .opt-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .opt.selected .opt-dot { background: ${NAVY}; border-color: ${NAVY}; }
  .opt.selected .opt-dot::after { content: ''; width: 7px; height: 7px; background: white; border-radius: 50%; display: block; }
  .opt-name { font-weight: 600; font-size: 15px; margin-bottom: 3px; }
  .opt-desc { font-size: 13px; color: rgba(240,237,232,0.5); line-height: 1.5; }

  /* COUVERT */
  .couvert-card { background: rgba(27,75,138,0.1); border: 1px solid rgba(27,75,138,0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; }
  .couvert-label { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: ${NAVY}; margin-bottom: 4px; }
  .couvert-desc { font-size: 14px; color: rgba(240,237,232,0.6); }

  /* GUEST GREETING */
  .guest-greeting { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .guest-name-tag { font-weight: 600; font-size: 16px; }
  .guest-company-tag { font-size: 13px; color: rgba(240,237,232,0.5); background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 100px; }
  .change-btn { font-size: 13px; color: rgba(240,237,232,0.4); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; margin-left: auto; }
  .change-btn:hover { color: #f0ede8; }

  /* BUTTONS */
  .btn-primary { width: 100%; padding: 16px; background: linear-gradient(135deg, ${NAVY}, #2a6dd9); border: none; border-radius: 12px; color: white; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(27,75,138,0.4); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-secondary { width: 100%; padding: 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 15px; cursor: pointer; transition: all 0.2s; margin-top: 10px; }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); }

  /* TEXT INPUT */
  .text-input { width: 100%; padding: 13px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; margin-bottom: 8px; }
  .text-input:focus { border-color: ${NAVY}; box-shadow: 0 0 0 3px rgba(27,75,138,0.2); }

  /* SUCCESS */
  .success-card { text-align: center; padding: 48px 28px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; }
  .success-icon { width: 64px; height: 64px; background: rgba(27,75,138,0.2); border: 2px solid ${NAVY}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px; }
  .success-card h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; margin-bottom: 10px; }
  .success-card p { color: rgba(240,237,232,0.5); font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; text-align: left; }
  .summary-item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 16px; }
  .summary-label { font-size: 10px; color: rgba(240,237,232,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .summary-val { font-size: 14px; font-weight: 500; }

  /* ADMIN */
  .stats-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px 24px; flex: 1; min-width: 120px; }
  .stat-num { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600; color: ${NAVY}; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 12px; color: rgba(240,237,232,0.45); text-transform: uppercase; letter-spacing: 0.1em; }
  .progress-bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, ${NAVY}, #2a6dd9); border-radius: 100px; transition: width 0.4s ease; }
  .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab { padding: 9px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; color: rgba(240,237,232,0.55); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
  .tab:hover { background: rgba(255,255,255,0.09); color: #f0ede8; }
  .tab.active { background: rgba(27,75,138,0.2); border-color: ${NAVY}; color: #f0ede8; }

  /* RESPONSES TABLE */
  .resp-table { width: 100%; border-collapse: collapse; }
  .resp-table th { padding: 11px 16px; background: rgba(27,75,138,0.2); text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(240,237,232,0.5); border-bottom: 1px solid rgba(255,255,255,0.08); }
  .resp-table td { padding: 11px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .resp-table tr:hover td { background: rgba(255,255,255,0.02); }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
  .pill-done { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  .pill-pend { background: rgba(234,179,8,0.12); color: #facc15; border: 1px solid rgba(234,179,8,0.2); }

  /* TABLE PLANNER */
  .planner-grid { display: grid; grid-template-columns: 260px 1fr; gap: 20px; align-items: start; }
  @media (max-width: 700px) { .planner-grid { grid-template-columns: 1fr; } }
  .unassigned-panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; position: sticky; top: 20px; max-height: 80vh; overflow-y: auto; }
  .panel-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(240,237,232,0.4); margin-bottom: 12px; }
  .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
  .table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; transition: border-color 0.2s; }
  .table-card.full { border-color: rgba(232,66,42,0.3); }
  .table-card:not(.full) { border-color: rgba(255,255,255,0.08); }
  .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .table-title { font-weight: 600; font-size: 14px; }
  .table-count { font-size: 13px; font-weight: 600; }
  .table-seats { display: flex; flex-direction: column; gap: 6px; }
  .guest-chip { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 8px; margin-bottom: 6px; font-size: 13px; cursor: grab; }
  .guest-chip:hover { background: rgba(255,255,255,0.09); }
  .seated-guest { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; }
  .empty-seat { padding: 8px 10px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; font-size: 12px; color: rgba(240,237,232,0.2); text-align: center; }
  .chip-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .chip-name { font-size: 13px; font-weight: 500; }
  .chip-company { font-size: 11px; color: rgba(240,237,232,0.4); margin-top: 1px; }
  .remove-btn { background: none; border: none; color: rgba(240,237,232,0.3); cursor: pointer; font-size: 18px; line-height: 1; padding: 0 2px; margin-left: auto; flex-shrink: 0; }
  .remove-btn:hover { color: ${RED}; }

  /* NAME CARDS */
  .name-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .name-card { background: #fff; color: #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; position: relative; overflow: hidden; }
  .name-card-table { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${NAVY}; margin-bottom: 8px; }
  .name-card-accent { width: 40px; height: 3px; background: ${RED}; margin: 0 auto 12px; border-radius: 100px; }
  .name-card-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #111; margin-bottom: 4px; line-height: 1.2; }
  .name-card-company { font-size: 12px; color: #888; margin-bottom: 10px; }
  .name-card-meal { font-size: 11px; color: #555; display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; }
  .name-card-dot { color: #ccc; }

  /* MISC */
  .info-banner { background: rgba(27,75,138,0.15); border: 1px solid rgba(27,75,138,0.3); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: rgba(240,237,232,0.7); margin-bottom: 16px; }
  .error-msg { background: rgba(232,66,42,0.1); border: 1px solid rgba(232,66,42,0.25); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #fca5a5; margin-bottom: 12px; }
  .loading { text-align: center; padding: 80px 20px; color: rgba(240,237,232,0.4); font-size: 15px; }

  @media print {
    .hdr, .tabs, .stats-row, .btn-primary, .btn-secondary, .nav-btn { display: none !important; }
    .name-cards-grid { grid-template-columns: repeat(3, 1fr); }
    .name-card { border: 1px solid #ddd; break-inside: avoid; }
    body { background: white; color: black; }
  }
`
