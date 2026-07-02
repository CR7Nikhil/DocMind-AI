import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { login, register } = useAuth()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        if (!form.name.trim()) return toast.error('Name is required')
        await register(form.name, form.email, form.password)
        toast.success('Account created! Let\'s get started 🚀')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">🧠</div>
          DocuMind
        </Link>
      </nav>

      <div className="auth-body">
        <div className="auth-card">
          {/* Title */}
          <div className="auth-title">
            <h1>DocuMind</h1>
            <p>{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              id="tab-login"
              className={`tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              className={`tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name" name="name" type="text"
                  placeholder="John Doe"
                  value={form.name} onChange={handleChange} required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <span className="input-icon">@</span>
                <input
                  id="email" name="email" type="email"
                  placeholder="sarah@company.com"
                  value={form.email} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  required minLength={6}
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <a href="#" className="forgot-link">Forgot password?</a>
            )}

            <button
              id="auth-submit"
              type="submit"
              className="btn btn-primary form-submit"
              disabled={loading}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="auth-footer-text">
            {mode === 'login' ? (
              <>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('register') }}>Sign up free</a></>
            ) : (
              <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}>Sign in</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}