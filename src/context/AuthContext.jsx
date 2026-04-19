import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'cs_session'
const API = 'http://localhost:3001/api/auth'
const TAB_VISIBILITY_KEY = 'cs_tab_visibility'

export const ALL_TABS = [
  { key: 'home',     label: 'Home',           icon: '🏠', locked: ['admin'] },
  { key: 'learn101', label: 'Collecting 101',  icon: '📚', locked: [] },
  { key: 'research', label: 'Research',        icon: '🔍', locked: [] },
  { key: 'mycards',  label: 'My Cards',        icon: '🃏', locked: [] },
  { key: 'data',     label: 'Analysis',        icon: '📊', locked: [] },
  { key: 'settings', label: 'Settings',        icon: '⚙️', locked: ['admin'] },
]

const DEFAULT_ROLE_TABS = {
  guest: ['home', 'learn101'],
  user:  ['home', 'learn101', 'research', 'mycards', 'data'],
  admin: ['home', 'learn101', 'research', 'mycards', 'data', 'settings'],
}

function loadRoleTabs() {
  try {
    const saved = JSON.parse(localStorage.getItem(TAB_VISIBILITY_KEY))
    if (saved) {
      // always ensure admin keeps home + settings, guest keeps home
      return {
        ...DEFAULT_ROLE_TABS,
        ...saved,
        admin: Array.from(new Set(['home', 'settings', ...(saved.admin ?? DEFAULT_ROLE_TABS.admin)])),
        guest: Array.from(new Set(['home', ...(saved.guest ?? DEFAULT_ROLE_TABS.guest)])),
        user:  Array.from(new Set(['home', ...(saved.user  ?? DEFAULT_ROLE_TABS.user)])),
      }
    }
  } catch {}
  return DEFAULT_ROLE_TABS
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadSession)
  const [users, setUsers] = useState([])
  const [roleTabs, setRoleTabsState] = useState(loadRoleTabs)

  function saveSession(user) {
    setCurrentUser(user)
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }

  function setRoleTabs(updated) {
    setRoleTabsState(updated)
    localStorage.setItem(TAB_VISIBILITY_KEY, JSON.stringify(updated))
  }

  async function login(email, password) {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error }
      saveSession(data)
      return { success: true, mustResetPassword: data.mustResetPassword }
    } catch {
      return { error: 'Cannot connect to server' }
    }
  }

  function loginAsGuest() {
    saveSession({ id: null, name: 'Guest', email: null, role: 'guest', owner: '' })
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API}/users`)
      const data = await res.json()
      setUsers(data)
      return data
    } catch { return [] }
  }

  async function addUser(user) {
    await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    })
    await loadUsers()
  }

  async function updateUser(id, changes) {
    await fetch(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    })
    if (currentUser?.id === id) {
      const updated = { ...currentUser, ...changes }
      saveSession(updated)
    }
    await loadUsers()
  }

  async function removeUser(id) {
    await fetch(`${API}/users/${id}`, { method: 'DELETE' })
    await loadUsers()
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, roleTabs, setRoleTabs, login, loginAsGuest, logout, loadUsers, addUser, updateUser, removeUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export const ROLE_HOME_SECTIONS = {
  guest: ['announcements', 'tips', 'gettingstarted', 'whysignup', 'featuredaffiliate'],
  user:  ['announcements', 'tips', 'kpis', 'quickaccess'],
  admin: ['announcements', 'tips', 'kpis', 'quickaccess'],
}
