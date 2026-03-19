import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Login.css'
import '../styles/Signup.css'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: '#f85149' },
    { label: 'Fair', color: '#f0883e' },
    { label: 'Good', color: '#d29922' },
    { label: 'Strong', color: '#3fb950' },
  ]
  return { score, ...levels[score] }
}

export default function Signup() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [alert, setAlert] = useState(null)

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (alert) setAlert(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setAlert({ type: 'error', msg: 'Please fill in all fields.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    if (form.password.length < 6) {
      setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' })
      return
    }
    if (!agreed) {
      setAlert({ type: 'error', msg: 'Please accept the terms to continue.' })
      return
    }

    const result = await register(form.name, form.email, form.password)
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
            Start<br />
            automating<br />
            <em>today.</em>
          </h1>
          <p className="brand-desc">
            Create your free account and deploy your first AI-powered
            workflow in minutes. No charges required.
          </p>
        </div>

        <div className="signup-steps">
          <div className="signup-step">
            <div className="step-number">01</div>
            <div className="step-text">
              <strong>Create Account</strong>
              <span>Register with your email</span>
            </div>
          </div>
          <div className="signup-step">
            <div className="step-number">02</div>
            <div className="step-text">
              <strong>Build a Workflow</strong>
              <span>Define triggers, AI steps & actions</span>
            </div>
          </div>
          <div className="signup-step">
            <div className="step-number">03</div>
            <div className="step-text">
              <strong>Deploy & Monitor</strong>
              <span>Watch automation run in real-time</span>
            </div>
          </div>
          <div className="signup-step">
            <div className="step-number">04</div>
            <div className="step-text">
              <strong>Scale Freely</strong>
              <span>Add unlimited workflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Form Panel ---- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            {/* <p className="auth-form-eyebrow">// NEW ACCOUNT</p> */}
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-subtitle">Join the automation revolution</p>
          </div>

          {alert && (
            <div className={`form-alert ${alert.type}`} role="alert">
              <span className="alert-icon">{alert.type === 'error' ? '⚠' : '✓'}</span>
              <span>{alert.msg}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="form-input-wrapper">
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="NAME"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                />
                <span className="form-input-icon icon-user">👤</span>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
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
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <span className="form-input-icon">🔒</span>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password"
                >
                  {showPassword ? '⊘' : '👁'}
                </button>
              </div>

              {/* Strength meter */}
              {form.password && (
                <div className="password-strength">
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        background: passwordStrength.color
                      }}
                    />
                  </div>
                  <span
                    className="strength-label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="form-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input ${
                    form.confirmPassword && form.confirmPassword !== form.password ? 'error' : ''
                  }`}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <span className="form-input-icon">🔒</span>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? '⊘' : '👁'}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="terms-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              I agree to the{' '}
              <a href="#" className="form-link" onClick={e => e.preventDefault()}>
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="form-link" onClick={e => e.preventDefault()}>
                Privacy Policy
              </a>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-submit-loader">
                  <span className="spinner" />
                  Creating account...
                </span>
              ) : (
                'Create Account →'
              )}
            </button>

            <div className="form-divider">OR</div>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="form-link">Sign in</Link>
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