import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import useLoadingBtn from '../hooks/useLoadingBtn'
import CardSparkyLogo from '../components/CardSparkyLogo'

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [signing, handleSubmit] = useLoadingBtn(async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.error) setError(result.error)
  })

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.75rem' }}>
          <CardSparkyLogo size={52} onDark={false} />
        </div>
        <h1>CardSparky</h1>
        <p>Sign in to your collection</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="text"
            placeholder="email@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
          />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" disabled={signing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {signing && <span className="btn-spinner" />}
            {signing ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1rem 0', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
          <button className="btn-secondary" style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }} onClick={loginAsGuest}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}
