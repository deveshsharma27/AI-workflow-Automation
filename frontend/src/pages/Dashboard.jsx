import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { workflowAPI, executionAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import '../styles/Dashboard.css'

const MOCK_ACTIVITY = [
  { type: 'support', icon: '🎫', text: <><strong>Refund Request</strong> workflow triggered — Priority: High</>, time: '2 min ago' },
  { type: 'ai', icon: '⚛', text: <><strong>AI Analysis</strong> completed for Order #38291 — Intent: Complaint</>, time: '5 min ago' },
  { type: 'ecommerce', icon: '📦', text: <><strong>Order Shipped</strong> automation sent tracking email to customer</>, time: '12 min ago' },
  { type: 'webhook', icon: '🔗', text: <><strong>Webhook triggered</strong> on workflow "Support Auto-Reply"</>, time: '18 min ago' },
  { type: 'error', icon: '⚠', text: <><strong>Action failed</strong> in workflow "Escalation Engine" — retrying</>, time: '34 min ago' },
  { type: 'support', icon: '✅', text: <><strong>Ticket resolved</strong> automatically — CSAT score logged</>, time: '1 hr ago' },
]

const QUICK_ACTIONS = [
  {
    icon: '🎫', label: 'Customer Support Flow',
    desc: 'Auto-triage & respond to tickets',
    color: 'rgba(0,149,255,0.1)',
    to: '/workflows/new?template=customer-support'
  },
  {
    icon: '📦', label: 'E-Commerce Order Flow',
    desc: 'Handle orders, refunds, shipping',
    color: 'rgba(255,107,53,0.1)',
    to: '/workflows/new?template=ecommerce'
  },
  {
    icon: '⚛', label: 'AI Analysis Pipeline',
    desc: 'Classify, summarize, prioritize',
    color: 'rgba(163,113,247,0.1)',
    to: '/workflows/new?template=ai-analysis'
  },
  {
    icon: '🔗', label: 'Webhook Automation',
    desc: 'Trigger workflows via HTTP events',
    color: 'rgba(0,212,170,0.1)',
    to: '/workflows/new?template=webhook'
  },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDuration(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, eRes] = await Promise.allSettled([
          workflowAPI.getAll(),
          executionAPI.getAll()
        ])
        if (wRes.status === 'fulfilled') setWorkflows(wRes.value.data?.workflows || wRes.value.data || [])
        if (eRes.status === 'fulfilled') setExecutions(eRes.value.data?.executions || eRes.value.data || [])
      } catch (_) {}
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter(w => w.status === 'active').length
  const recentExecs = executions.slice(0, 6)
  const successRate = executions.length
    ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
    : 0

  return (
    <AppShell
      title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || 'Operator'}`}
      breadcrumb="FlowAI"
      topbarRight={
        <Link to="/workflows/new" className="topbar-btn">
          ＋ New Workflow
        </Link>
      }
    >
      <div className="page-enter">

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent" style={{ background: 'linear-gradient(90deg, #00d4aa, #0095ff)' }} />
            <div className="stat-card-header">
              <span className="stat-card-label">Total Workflows</span>
              <span className="stat-card-icon">◈</span>
            </div>
            <div className="stat-card-value">{loading ? '—' : totalWorkflows}</div>
            <div className="stat-card-sub">
              <span className="stat-delta up">↑ {activeWorkflows} active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent" style={{ background: 'linear-gradient(90deg, #ff6b35, #f0883e)' }} />
            <div className="stat-card-header">
              <span className="stat-card-label">Executions Today</span>
              <span className="stat-card-icon">▷</span>
            </div>
            <div className="stat-card-value">{loading ? '—' : executions.length}</div>
            <div className="stat-card-sub">
              <span className="stat-delta up">↑ {executions.filter(e => e.status === 'running').length} running</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent" style={{ background: 'linear-gradient(90deg, #3fb950, #00d4aa)' }} />
            <div className="stat-card-header">
              <span className="stat-card-label">Success Rate</span>
              <span className="stat-card-icon">✓</span>
            </div>
            <div className="stat-card-value">{loading ? '—' : `${successRate}%`}</div>
            <div className="stat-card-sub">
              <span style={{ color: 'var(--clr-text-muted)' }}>avg this session</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent" style={{ background: 'linear-gradient(90deg, #a371f7, #0095ff)' }} />
            <div className="stat-card-header">
              <span className="stat-card-label">AI Steps Run</span>
              <span className="stat-card-icon">✦︎</span>
            </div>
            <div className="stat-card-value">{loading ? '—' : executions.length * 2}</div>
            <div className="stat-card-sub">
              <span style={{ color: 'var(--clr-text-muted)' }}>Gemini powered</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-header">
          <span className="section-title">Quick Start Here</span>
        </div>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map(qa => (
            <Link to={qa.to} className="quick-action-card" key={qa.label}>
              <div className="quick-action-icon" style={{ background: qa.color }}>
                {qa.icon}
              </div>
              <div className="quick-action-text">
                <strong>{qa.label}</strong>
                <span>{qa.desc}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Main + Activity */}
        <div className="dashboard-grid">
          {/* Recent Executions */}
          <div>
            <div className="section-header">
              <span className="section-title">Recent Executions</span>
              <Link to="/executions" className="section-link">View all →</Link>
            </div>
            <div className="panel">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⏳</div>
                  Loading executions...
                </div>
              ) : recentExecs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">▷</div>
                  No executions yet. Trigger a workflow to see results here.
                </div>
              ) : (
                <table className="executions-table">
                  <thead>
                    <tr>
                      <th>Workflow</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExecs.map(exec => (
                      <tr
                        key={exec._id || exec.id}
                        onClick={() => navigate(`/executions/${exec._id || exec.id}`)}
                      >
                        <td>
                          <div className="exec-workflow-name">
                            {exec.workflowId?.name || exec.workflowName || 'Unnamed Workflow'}
                          </div>
                          <div className="exec-workflow-category">
                            {exec.workflowId?.triggerType || exec.triggerType || 'webhook'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${exec.status}`}>{exec.status}</span>
                        </td>
                        <td>
                          <span className="exec-duration">
                            {exec.endTime && exec.startTime
                              ? formatDuration(new Date(exec.endTime) - new Date(exec.startTime))
                              : '—'
                            }
                          </span>
                        </td>
                        <td>
                          <span className="exec-time">{timeAgo(exec.startTime || exec.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className="section-header">
              <span className="section-title">Live Activity</span>
              <span className="badge running">Live</span>
            </div>
            <div className="panel">
              <div className="activity-feed">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div className="activity-item" key={i}>
                    <div className={`activity-dot ${item.type}`}>{item.icon}</div>
                    {i < MOCK_ACTIVITY.length - 1 && <div className="activity-line" />}
                    <div className="activity-body">
                      <div className="activity-text">{item.text}</div>
                      <div className="activity-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="dashboard-bottom">
          {/* Top Workflows */}
          <div>
            <div className="section-header">
              <span className="section-title">Your Workflows</span>
              <Link to="/workflows" className="section-link">Manage all →</Link>
            </div>
            <div className="panel">
              {loading ? (
                <div className="empty-state"><div className="empty-state-icon">⏳</div>Loading...</div>
              ) : workflows.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">◈</div>
                  No workflows yet.{' '}
                  <Link to="/workflows/new" style={{ color: 'var(--clr-accent)' }}>Create one →</Link>
                </div>
              ) : (
                workflows.slice(0, 5).map(wf => (
                  <div className="mini-workflow" key={wf._id || wf.id}>
                    <div className="mini-workflow-left">
                      <div
                        className="mini-workflow-icon"
                        style={{
                          background: wf.category === 'ecommerce'
                            ? 'rgba(255,107,53,0.1)'
                            : 'rgba(0,149,255,0.1)'
                        }}
                      >
                        {wf.category === 'ecommerce' ? '📦' : '🎫'}
                      </div>
                      <div>
                        <div className="mini-workflow-name">{wf.name}</div>
                        <div className="mini-workflow-trigger">{wf.triggerType || 'webhook'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${wf.status || 'inactive'}`}>{wf.status || 'inactive'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Pipeline Showcase */}
          <div>
            <div className="section-header">
              <span className="section-title">How Automation Works</span>
            </div>
            <div className="panel">
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                Customer Support Pipeline
              </p>
              <div className="ai-pipeline" style={{ marginBottom: 16 }}>
                <div className="pipeline-step"><div className="pipeline-node trigger">Support Ticket</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node ai">AI Classify</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node condition">Priority Check</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node action">Auto-Reply</div></div>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                E-Commerce Order Pipeline
              </p>
              <div className="ai-pipeline" style={{ marginBottom: 16 }}>
                <div className="pipeline-step"><div className="pipeline-node trigger">Order Event</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node ai">AI Analysis</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node condition">Rule Engine</div></div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step"><div className="pipeline-node action">Alert / Store</div></div>
              </div>

              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--clr-accent-glow)',
                border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.72rem',
                color: 'var(--clr-accent)',
                fontFamily: 'var(--font-mono)'
              }}>
                ⚡ Redis Queue + BullMQ ensures zero data loss during high traffic
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}