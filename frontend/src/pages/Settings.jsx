import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/Appshell'
import { useAuth } from '../context/AuthContext'
import '../styles/Settings.css'
import '../styles/Dashboard.css'
import '../styles/Workflows.css'

const SECTIONS = [
  { key: 'profile', icon: '👤', label: 'Profile' },
  { key: 'api', icon: '⚙', label: 'API & Integration' },
  { key: 'notifications', icon: '🔔', label: 'Notifications' },
  { key: 'system', icon: '⬡', label: 'System Status' },
  { key: 'danger', icon: '⚠', label: 'Danger Zone' },
]

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('profile')
  const [toast, setToast] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)

  // Profile form
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  // Notification toggles
  const [notifs, setNotifs] = useState({
    executionComplete: true,
    executionFailed: true,
    workflowTriggered: false,
    weeklyDigest: true,
  })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    await new Promise(r => setTimeout(r, 800)) // simulated
    showToast('Profile updated successfully.')
    setSavingProfile(false)
  }

  const handleSavePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { showToast('Fill all password fields.', 'error'); return }
    if (newPw !== confirmPw) { showToast('New passwords do not match.', 'error'); return }
    if (newPw.length < 6) { showToast('Password must be 6+ characters.', 'error'); return }
    await new Promise(r => setTimeout(r, 800))
    showToast('Password changed successfully.')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  const handleCopyKey = () => {
    const token = localStorage.getItem('token') || 'no-token-found'
    navigator.clipboard.writeText(token)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const maskedToken = () => {
    const token = localStorage.getItem('token') || ''
    if (!token) return 'No token'
    return token.slice(0, 12) + '••••••••••••••••••••' + token.slice(-6)
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleDeleteAccount = () => {
    if (!confirm('Are you absolutely sure? This will permanently delete your account and all workflows. This cannot be undone.')) return
    logout()
    navigate('/login')
  }

  return (
    <AppShell title="Settings" breadcrumb="FlowAI">
      <div className="page-enter">
        <div className="settings-layout">

          {/* Nav */}
          <div className="settings-nav">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`settings-nav-item ${section === s.key ? 'active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                <span className="settings-nav-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="settings-content">

            {/* ======== PROFILE ======== */}
            {section === 'profile' && <>
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">Your Profile</div>
                    <div className="settings-card-desc">Update your name and email address</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="avatar-row">
                    <div className="avatar-large">{initials}</div>
                    <div className="avatar-info">
                      <div className="avatar-name">{name || 'User'}</div>
                      <div className="avatar-email">{email || '—'}</div>
                    </div>
                  </div>
                  <div className="settings-input-row">
                    <div className="settings-field" style={{ flex: 1 }}>
                      <div className="settings-field-label">Full Name</div>
                      <input className="settings-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                    </div>
                    <div className="settings-field" style={{ flex: 1 }}>
                      <div className="settings-field-label">Email Address</div>
                      <input className="settings-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? '⏳ Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">Change Password</div>
                    <div className="settings-card-desc">Minimum 6 characters</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="settings-field">
                    <div className="settings-field-label">Current Password</div>
                    <input className="settings-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="settings-input-row">
                    <div className="settings-field" style={{ flex: 1 }}>
                      <div className="settings-field-label">New Password</div>
                      <input className="settings-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="settings-field" style={{ flex: 1 }}>
                      <div className="settings-field-label">Confirm New Password</div>
                      <input className="settings-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={handleSavePassword}>Update Password</button>
                  </div>
                </div>
              </div>
            </>}



            {/* ======== API ========
            {section === 'api' && <>
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">API Credentials</div>
                    <div className="settings-card-desc">Use your JWT token to authenticate API requests</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="settings-field">
                    <div className="settings-field-label">Auth Token (Bearer)</div>
                    <div className="api-key-box">
                      <span className="api-key-value">{maskedToken()}</span>
                      <button className={`copy-btn ${copiedKey ? 'copied' : ''}`} onClick={handleCopyKey} style={{ marginTop: 0, flexShrink: 0 }}>
                        {copiedKey ? '✓ Copied' : '⎘ Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--clr-accent)' }}>
                    Usage: <span style={{ color: 'var(--clr-accent)' }}>Authorization: Bearer {'<token>'}</span>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">Backend Connection</div>
                    <div className="settings-card-desc">Your current API endpoint configuration</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="settings-field">
                    <div className="settings-field-label">API Base URL</div>
                    <input className="settings-input" value={BASE_URL} disabled />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { path: 'POST /auth/login', desc: 'Login' },
                      { path: 'POST /auth/register', desc: 'Register' },
                      { path: 'GET /workflows', desc: 'List Workflows' },
                      { path: 'POST /executions/start', desc: 'Start Execution' },
                      { path: 'POST /webhook/:id', desc: 'Webhook Trigger' },
                      { path: 'GET /executions/:id/logs', desc: 'Execution Logs' },
                    ].map(ep => (
                      <div key={ep.path} style={{
                        padding: '8px 12px', background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)'
                      }}>
                        <div style={{ color: 'var(--clr-accent)', marginBottom: 2 }}>{ep.path}</div>
                        <div style={{ color: 'var(--clr-text-muted)' }}>{ep.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>} */}


            

            {/* ======== NOTIFICATIONS ======== */}
            {section === 'notifications' && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">Notification Preferences</div>
                    <div className="settings-card-desc">Control when you receive alerts</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  {[
                    { key: 'executionComplete', label: 'Workflow Execution Completed', desc: 'Notify when a workflow finishes successfully' },
                    { key: 'executionFailed', label: 'Workflow Execution Failed', desc: 'Alert when a workflow fails or errors out' },
                    { key: 'workflowTriggered', label: 'Webhook Trigger Received', desc: 'Notify when an incoming webhook fires a workflow' },
                    { key: 'weeklyDigest', label: 'Weekly Automation Digest', desc: 'Summary email of workflow activity every Monday' },
                  ].map(n => (
                    <div className="toggle-row" key={n.key}>
                      <div className="toggle-row-left">
                        <div className="toggle-row-label">{n.label}</div>
                        <div className="toggle-row-desc">{n.desc}</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifs[n.key]}
                          onChange={e => setNotifs(prev => ({ ...prev, [n.key]: e.target.checked }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button className="btn-primary" onClick={() => showToast('Notification preferences saved.')}>
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======== SYSTEM STATUS ======== */}
            {section === 'system' && <>
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">System Status</div>
                    <div className="settings-card-desc">Real-time backend service health</div>
                  </div>
                  <span className="badge running">Live</span>
                </div>
                <div className="settings-card-body">
                  <div className="system-status-grid">
                    {[
                      { name: 'API Server', value: 'Online', status: 'online', detail: 'Node.js + Express' },
                      { name: 'MongoDB', value: 'Connected', status: 'online', detail: 'Primary cluster' },
                      { name: 'Redis Queue', value: 'Connected', status: 'online', detail: 'BullMQ ready' },
                      { name: 'Workflow Engine', value: 'Running', status: 'online', detail: 'DAG executor' },
                      { name: 'AI Service', value: 'Active', status: 'online', detail: 'Gemini API' },
                      { name: 'WebSockets', value: 'Listening', status: 'online', detail: 'Socket.io' },
                      { name: 'Worker Thread', value: 'Online', status: 'online', detail: 'Background jobs' },
                      { name: 'Webhook Server', value: 'Accepting', status: 'online', detail: 'All routes active' },
                      { name: 'Retry Engine', value: 'Standby', status: 'warn', detail: '0 pending retries' },
                    ].map(s => (
                      <div className="system-status-item" key={s.name}>
                        <div className="system-status-name">{s.name}</div>
                        <div className="system-status-value">
                          <span className={`system-dot ${s.status}`} />
                          <span style={{ color: s.status === 'online' ? 'var(--clr-success)' : s.status === 'warn' ? '#f0883e' : 'var(--clr-error)' }}>
                            {s.value}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {s.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-title">Backend Architecture</div>
                </div>
                <div className="settings-card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { component: 'Auth System', tech: 'JWT + bcrypt', status: 'active' },
                      { component: 'Workflow Engine', tech: 'DAG-based execution', status: 'active' },
                      { component: 'Queue System', tech: 'Redis + BullMQ', status: 'active' },
                      { component: 'AI Processing', tech: 'Google Gemini', status: 'active' },
                      { component: 'Real-time Monitor', tech: 'Socket.io WebSockets', status: 'active' },
                      { component: 'Execution Logs', tech: 'MongoDB + TTL Index', status: 'active' },
                    ].map(item => (
                      <div key={item.component} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
                        background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--clr-border)'
                      }}>
                        <span className={`badge ${item.status}`} style={{ flexShrink: 0 }}>{item.status}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--clr-text-primary)', flex: 1 }}>
                          {item.component}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.tech}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>}

            {/* ======== DANGER ZONE ======== */}
            {section === 'danger' && (
              <div className="settings-card danger-zone">
                <div className="settings-card-header">
                  <div>
                    <div className="settings-card-title">⚠ Danger Zone</div>
                    <div className="settings-card-desc">These actions are irreversible. Proceed with caution.</div>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-text-primary)', marginBottom: 3 }}>
                        Delete All Workflows
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Permanently deletes all workflows and execution history
                      </div>
                    </div>
                    <button className="btn-danger" onClick={() => showToast('This feature is disabled in demo mode.', 'error')}>
                      Delete All
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248,81,73,0.2)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-error)', marginBottom: 3 }}>
                        Delete Account
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Permanently deletes your account, all workflows, and data
                      </div>
                    </div>
                    <button className="btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'success' ? 'var(--clr-success-bg)' : 'var(--clr-error-bg)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
          color: toast.type === 'success' ? 'var(--clr-success)' : 'var(--clr-error)',
          padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)', zIndex: 300, animation: 'slideUp 0.3s ease'
        }}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}
    </AppShell>
  )
}