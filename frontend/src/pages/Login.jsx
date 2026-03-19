import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (alert) setAlert(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setAlert({ type: 'error', msg: 'Please fill in all fields.' })
      return
    }

    const result = await login(form.email, form.password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setAlert({ type: 'error', msg: result.message })
    }
  }

  return (
    <div className="auth-layout">
      {/* ---- Brand Panel ---- */}
      <div className="auth-brand-panel">
        <div className="brand-grid" />

        <div className="brand-logo">
          <div className="brand-logo-icon">⚛</div>
          <span className="brand-logo-text">Flow<span>AI</span></span>
        </div>

        <div className="brand-content">
          <h1 className="brand-headline">
            Automate<br />
            <em>Everything.</em><br />
            Instantly.
          </h1>
          <p className="brand-desc">
            AI-powered workflow automation platform that processes customer support,
            e-commerce events, and complex business logic — without manual effort.
          </p>

          <div className="brand-stats">
            <div className="stat-item">
              <span className="stat-value">10x</span>
              <span className="stat-label">Faster</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">99%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">∞</span>
              <span className="stat-label">Workflows</span>
            </div>
          </div>
        </div>

        <ul className="brand-features">
          <li><span className="feature-dot" /> AI-powered decision engine (Gemini)</li>
          <li><span className="feature-dot" /> Real-time execution monitoring</li>
          <li><span className="feature-dot" /> Redis queue + BullMQ processing</li>
          <li><span className="feature-dot" /> Webhook triggers & automated actions</li>
        </ul>
      </div>

      {/* ---- Form Panel ---- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            {/* <p className="auth-form-eyebrow">// ACCESS TERMINAL</p> */}
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to your automation dashboard</p>
          </div>

          {alert && (
            <div className={`form-alert ${alert.type}`} role="alert">
              <span className="alert-icon">{alert.type === 'error' ? '⚠' : '✓'}</span>
              <span>{alert.msg}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${alert?.type === 'error' ? 'error' : ''}`}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                />
                <span className="form-input-icon">@</span>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${alert?.type === 'error' ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <span className="form-input-icon">🔒</span>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '⊘' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="form-link">Forgot password?</a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-submit-loader">
                  <span className="spinner" />
                  Authenticating...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>

            {/* Switch */}
            <div className="form-divider">OR</div>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/signup" className="form-link">Create one free</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Terminal status bar */}
      <div className="auth-terminal-bar">
        <span className="terminal-dot" />
        <span>SYSTEM ONLINE</span>
        <span>·</span>
        <span>FlowAI v1.0.0</span>
        <span>·</span>
        <span>Redis + MongoDB Connected</span>
      </div>
    </div>
  )
}