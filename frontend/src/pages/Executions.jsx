import React, { useEffect, useState, useRef } from 'react'
import AppShell from '../components/Appshell'
import ExecutionTimeline from '../components/ExecutionTimeline'
import { executionAPI, workflowAPI } from '../utils/api'
import '../styles/Executions.css'
import '../styles/Dashboard.css'
import '../styles/Workflows.css'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDuration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getCategoryIcon(exec) {
  const name = (exec.workflowId?.name || exec.workflowName || '').toLowerCase()
  if (name.includes('support') || name.includes('ticket')) return { icon: '🎫', color: 'rgba(0,149,255,0.1)' }
  if (name.includes('order') || name.includes('commerce')) return { icon: '📦', color: 'rgba(255,107,53,0.1)' }
  if (name.includes('refund')) return { icon: '🔄', color: 'rgba(240,136,62,0.1)' }
  return { icon: '⚡', color: 'rgba(0,212,170,0.08)' }
}

// ✅ FIX 3: real payloads so Gemini actually has text to analyze
const DEFAULT_SUPPORT_PAYLOAD = JSON.stringify({
  message: "I need a refund for order #38291. The item arrived damaged and is completely unusable.",
  type: "support_ticket",
  customer: { email: "john@example.com", name: "John Doe" }
}, null, 2)

const DEFAULT_ECOMMERCE_PAYLOAD = JSON.stringify({
  type: "order_placed",
  orderId: "ORD-28471",
  customer: { email: "buyer@example.com", name: "Jane Smith" },
  items: [{ sku: "PROD-001", qty: 2, price: 49.99 }],
  total: 99.98
}, null, 2)

export default function Executions() {
  const [executions, setExecutions] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [triggerModal, setTriggerModal] = useState(false)
  const [triggerWorkflow, setTriggerWorkflow] = useState('')
  const [triggerPayload, setTriggerPayload] = useState(DEFAULT_SUPPORT_PAYLOAD)
  const [triggering, setTriggering] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    fetchAll()
    pollRef.current = setInterval(fetchAll, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  // Auto-refresh selected execution every 3s so status updates live
  useEffect(() => {
    if (!selected) return
    const id = selected._id || selected.id
    const refresh = setInterval(async () => {
      try {
        const res = await executionAPI.getById(id)
        const updated = res.data?.execution || res.data
        if (updated) setSelected(prev => ({ ...prev, ...updated }))
      } catch (_) {}
    }, 3000)
    return () => clearInterval(refresh)
  }, [selected?._id])

  const fetchAll = async () => {
    try {
      const [eRes, wRes] = await Promise.allSettled([
        executionAPI.getAll(),
        workflowAPI.getAll()
      ])
      if (eRes.status === 'fulfilled')
        setExecutions(eRes.value.data?.executions || eRes.value.data || [])
      if (wRes.status === 'fulfilled')
        setWorkflows(wRes.value.data?.workflows || wRes.value.data || [])
    } catch (_) {}
    setLoading(false)
  }

  const selectExecution = async (exec) => {
    setSelected(exec)
    setLogsLoading(true)
    setLogs([])
    try {
      const id = exec._id || exec.id
      const res = await executionAPI.getLogs(id)
      const fetchedLogs = res.data?.logs || res.data || []
      setLogs(fetchedLogs)

      // ✅ FIX 4: map DB logs into step shape so ExecutionTimeline renders them
      const stepsFromLogs = fetchedLogs.map(log => ({
        name: log.stepName,
        type: log.stepName,
        status: 'completed',
        result: log.result,
      }))
      setSelected(prev => ({ ...prev, steps: stepsFromLogs }))
    } catch (_) {}
    setLogsLoading(false)
  }

  const handleTrigger = async () => {
    if (!triggerWorkflow) return
    setTriggering(true)
    try {
      let parsedPayload = {}
      try {
        parsedPayload = JSON.parse(triggerPayload)
      } catch (_) {
        alert('Invalid JSON — please fix the payload and try again.')
        setTriggering(false)
        return
      }

      // ✅ FIX 1+2: send key 'payload' — now matches executionController
      await executionAPI.start({ workflowId: triggerWorkflow, payload: parsedPayload })
      setTriggerModal(false)
      setTimeout(fetchAll, 1000)
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data?.error || 'Failed to trigger execution.')
    }
    setTriggering(false)
  }

  const filtered = executions.filter(e =>
    statusFilter === 'all' ? true : e.status === statusFilter
  )

  const running = executions.filter(e => e.status === 'running').length

  return (
    <AppShell
      title="Executions"
      breadcrumb="FlowAI"
      topbarRight={
        <button className="topbar-btn" onClick={() => setTriggerModal(true)}>
          ▷ Trigger Workflow
        </button>
      }
    >
      <div className="page-enter">

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',     count: executions.length,                                           color: 'var(--clr-accent)' },
            { label: 'Running',   count: executions.filter(e => e.status === 'running').length,   color: 'var(--clr-accent)' },
            { label: 'Completed', count: executions.filter(e => e.status === 'completed').length, color: 'var(--clr-success)' },
            { label: 'Failed',    count: executions.filter(e => e.status === 'failed').length,    color: 'var(--clr-error)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)', padding: '10px 18px',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: s.color }}>
                {s.count}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {s.label}
              </span>
            </div>
          ))}
          {running > 0 && (
            <div style={{
              background: 'var(--clr-accent-glow)', border: '1px solid rgba(0,212,170,0.3)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.72rem', color: 'var(--clr-accent)', fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-accent)', animation: 'pulse 1.2s infinite', display: 'inline-block' }} />
              Auto-refreshing every 5s
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <div className="filter-pills">
            {['all', 'running', 'completed', 'failed', 'pending'].map(s => (
              <button
                key={s}
                className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="executions-layout">
          {/* Left: Execution List */}
          <div>
            {loading ? (
              <div className="execution-list">
                {[1,2,3,4].map(i => (
                  <div key={i} className="execution-row skeleton" style={{ height: 72 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="exec-empty">
                <div className="exec-empty-icon">▷</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text-secondary)', marginBottom: 8 }}>
                  No executions {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}
                </div>
                <div style={{ fontSize: '0.78rem', marginBottom: 20 }}>
                  Trigger a workflow to see execution results here.
                </div>
                <button className="topbar-btn" onClick={() => setTriggerModal(true)}>
                  ▷ Trigger First Workflow
                </button>
              </div>
            ) : (
              <div className="execution-list">
                {filtered.map(exec => {
                  const { icon, color } = getCategoryIcon(exec)
                  const id = exec._id || exec.id
                  const isSelected = selected && (selected._id || selected.id) === id

                  return (
                    <div
                      key={id}
                      className={`execution-row ${exec.status}`}
                      style={{ outline: isSelected ? '2px solid var(--clr-accent)' : 'none', cursor: 'pointer' }}
                      onClick={() => selectExecution(exec)}
                    >
                      <div className="exec-row-icon" style={{ background: color }}>{icon}</div>
                      <div className="exec-row-body">
                        <div className="exec-row-title">
                          {exec.workflowId?.name || exec.workflowName || 'Workflow Execution'}
                        </div>
                        <div className="exec-row-meta">
                          <span>{timeAgo(exec.startTime || exec.createdAt)}</span>
                          <span>·</span>
                          <span>{formatDuration(exec.startTime, exec.endTime)}</span>
                          {exec.status === 'running' && (
                            <>
                              <span>·</span>
                              <span style={{ color: 'var(--clr-accent)' }}>Processing...</span>
                            </>
                          )}
                        </div>
                        {exec.status === 'running' && (
                          <div className="exec-progress-bar">
                            <div className="exec-progress-fill" style={{ width: '60%', animation: 'progress 2s ease-in-out infinite alternate' }} />
                          </div>
                        )}
                      </div>
                      <div className="exec-row-right">
                        <span className="exec-row-id">#{id?.slice(-6) || '000000'}</span>
                        <span className={`badge ${exec.status}`}>{exec.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div>
            {selected ? (
              <div className="exec-detail-panel">
                <div className="exec-detail-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="exec-detail-title">
                      {selected.workflowId?.name || selected.workflowName || 'Execution Detail'}
                    </div>
                    <span className={`badge ${selected.status}`}>{selected.status}</span>
                  </div>
                  <div className="exec-detail-meta">
                    <span>ID: #{(selected._id || selected.id || '').slice(-8)}</span>
                    <span>Started: {timeAgo(selected.startTime || selected.createdAt)}</span>
                    <span>Duration: {formatDuration(selected.startTime, selected.endTime)}</span>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--clr-border)', padding: '12px 18px 0' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    Step Timeline
                  </div>
                </div>

                {logsLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Loading steps...
                  </div>
                ) : (
                  <ExecutionTimeline
                    steps={selected.steps || []}
                    status={selected.status}
                  />
                )}

                {/* Logs section */}
                {logs.length > 0 && (
                  <div className="logs-panel" style={{ margin: 16, borderRadius: 'var(--radius-md)' }}>
                    <div className="logs-header">
                      <span className="logs-title">Execution Logs</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {logs.length} entries
                      </span>
                    </div>
                    <div className="logs-body">
                      {logs.map((log, i) => (
                        <div className="log-line" key={i}>
                          <span className="log-time">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '--:--:--'}
                          </span>
                          <span className="log-level info">[INFO]</span>
                          <span>
                            <strong>{log.stepName}</strong>{' — '}{log.result}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="exec-detail-panel">
                <div className="exec-detail-header">
                  <div className="exec-detail-title">Execution Detail</div>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>▷</div>
                  Click an execution to see step-by-step timeline and logs.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trigger Modal */}
      {triggerModal && (
        <div className="modal-overlay" onClick={() => setTriggerModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">▷ Trigger Workflow</div>
            <div className="modal-desc" style={{ marginBottom: 12 }}>
              Manually start a workflow execution with a custom payload.
            </div>

            {/* Payload templates */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>Templates:</span>
              <button
                onClick={() => setTriggerPayload(DEFAULT_SUPPORT_PAYLOAD)}
                style={{ padding: '4px 10px', background: 'rgba(0,149,255,0.1)', border: '1px solid rgba(0,149,255,0.3)', borderRadius: 20, color: '#0095ff', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              >
                🎫 Support Ticket
              </button>
              <button
                onClick={() => setTriggerPayload(DEFAULT_ECOMMERCE_PAYLOAD)}
                style={{ padding: '4px 10px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 20, color: 'var(--clr-orange)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              >
                📦 E-Commerce Order
              </button>
            </div>

            <div className="trigger-modal-content">
              <div>
                <div className="trigger-field-label">Select Workflow</div>
                <select
                  className="config-select"
                  value={triggerWorkflow}
                  onChange={e => setTriggerWorkflow(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', padding: '9px 12px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', color: 'var(--clr-text-primary)', width: '100%', outline: 'none' }}
                >
                  <option value="">Choose a workflow...</option>
                  {workflows.map(wf => (
                    <option key={wf._id || wf.id} value={wf._id || wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="trigger-field-label">Event Payload (JSON)</div>
                <textarea
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-md)', color: 'var(--clr-accent)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                    minHeight: 160, resize: 'vertical', outline: 'none',
                  }}
                  value={triggerPayload}
                  onChange={e => setTriggerPayload(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setTriggerModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleTrigger}
                disabled={!triggerWorkflow || triggering}
              >
                {triggering ? '⏳ Starting...' : '▷ Run Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}