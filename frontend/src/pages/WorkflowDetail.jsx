import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AppShell from '../components/Appshell'
import { workflowAPI, executionAPI } from '../utils/api'
import '../styles/WorkflowDetail.css'
import '../styles/CreateWorkflow.css'
import '../styles/Dashboard.css'
import '../styles/Executions.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STEP_TYPES = [
  { type: 'ai_analysis', icon: '🤖', name: 'AI Analysis' },
  { type: 'condition', icon: '⑂', name: 'Condition' },
  { type: 'action', icon: '⚡', name: 'Action' },
  { type: 'notification', icon: '🔔', name: 'Notification' },
  { type: 'email', icon: '✉', name: 'Send Email' },
]

const TRIGGER_TYPES = [
  { value: 'webhook', icon: '🔗', label: 'Webhook' },
  { value: 'support_ticket', icon: '🎫', label: 'Support Ticket' },
  { value: 'order_placed', icon: '📦', label: 'Order Placed' },
  { value: 'order_updated', icon: '🔄', label: 'Order Updated' },
  { value: 'manual', icon: '▷', label: 'Manual' },
]

function timeAgo(d) {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

function formatDur(s, e) {
  if (!s || !e) return '—'
  const ms = new Date(e) - new Date(s)
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

export default function WorkflowDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workflow, setWorkflow] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // overview | edit | history
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)

  // ✅ NEW: run modal so user can supply a real payload before triggering
  const [runModal, setRunModal] = useState(false)
  const [runPayload, setRunPayload] = useState('')

  // Edit state
  const [editName, setEditName] = useState('')
  const [editTrigger, setEditTrigger] = useState('webhook')
  const [editSteps, setEditSteps] = useState([])

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [wRes, eRes] = await Promise.allSettled([
        workflowAPI.getById(id),
        executionAPI.getAll()
      ])
      if (wRes.status === 'fulfilled') {
        const wf = wRes.value.data?.workflow || wRes.value.data
        setWorkflow(wf)
        setEditName(wf?.name || '')
        setEditTrigger(wf?.triggerType || 'webhook')
        setEditSteps((wf?.steps || []).map((s, i) => ({ ...s, id: Date.now() + i })))
      }
      if (eRes.status === 'fulfilled') {
        const all = eRes.value.data?.executions || eRes.value.data || []
        setExecutions(all.filter(e => {
          const wid = e.workflowId?._id || e.workflowId || e.workflow
          return wid === id
        }))
      }
    } catch (_) {}
    setLoading(false)
  }

  // Open run modal — pre-fill payload based on workflow trigger type
  const handleRun = () => {
    const triggerType = workflow?.triggerType || 'webhook'
    let defaultPayload = {}

    if (triggerType === 'support_ticket' || workflow?.name?.toLowerCase().includes('support')) {
      defaultPayload = {
        message: "I need a refund for order #38291. The item arrived damaged and is completely unusable.",
        type: "support_ticket",
        customer: { email: "john@example.com", name: "John Doe" }
      }
    } else if (triggerType === 'order_placed' || workflow?.name?.toLowerCase().includes('order')) {
      defaultPayload = {
        type: "order_placed",
        orderId: "ORD-28471",
        customer: { email: "buyer@example.com", name: "Jane Smith" },
        items: [{ sku: "PROD-001", qty: 2, price: 49.99 }],
        total: 99.98
      }
    } else if (triggerType === 'order_updated' || workflow?.name?.toLowerCase().includes('refund')) {
      defaultPayload = {
        type: "refund_request",
        orderId: "ORD-19234",
        reason: "Item not as described",
        customer: { email: "user@example.com", name: "Alice" },
        message: "I want a refund, the product quality is very poor."
      }
    } else {
      defaultPayload = {
        message: "Test trigger from workflow detail page.",
        type: "manual",
        source: "workflow_detail"
      }
    }

    setRunPayload(JSON.stringify(defaultPayload, null, 2))
    setRunModal(true)
  }

  // Actually send the execution with the payload from the modal
  const handleRunConfirm = async () => {
    setRunning(true)
    try {
      let parsedPayload = {}
      try {
        parsedPayload = JSON.parse(runPayload)
      } catch (_) {
        showToast('Invalid JSON in payload. Please fix it.', 'error')
        setRunning(false)
        return
      }

      // ✅ FIX: key is 'payload', matches executionController
      const res = await executionAPI.start({ workflowId: id, payload: parsedPayload })
      setRunModal(false)
      showToast('Workflow triggered! Redirecting to execution...', 'success')
      const execId = res.data?.execution?._id || res.data?._id || res.data?.id
      setTimeout(() => navigate(execId ? `/executions/${execId}` : '/executions'), 1200)
    } catch (e) {
      showToast(e.response?.data?.message || e.response?.data?.error || 'Failed to trigger workflow.', 'error')
    }
    setRunning(false)
  }

  const handleSave = async () => {
    if (!editName.trim()) { showToast('Workflow name is required.', 'error'); return }
    setSaving(true)
    try {
      await workflowAPI.update(id, {
        name: editName.trim(),
        triggerType: editTrigger,
        steps: editSteps.map(({ id: _id, ...rest }) => rest)
      })
      await fetchAll()
      setTab('overview')
      showToast('Workflow saved successfully.', 'success')
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save.', 'error')
    }
    setSaving(false)
  }

  const handleToggleStatus = async () => {
    const newStatus = workflow.status === 'active' ? 'inactive' : 'active'
    try {
      await workflowAPI.update(id, { status: newStatus })
      setWorkflow(prev => ({ ...prev, status: newStatus }))
      showToast(`Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'}.`, 'success')
    } catch (_) { showToast('Failed to update status.', 'error') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${workflow?.name}"? This cannot be undone.`)) return
    try {
      await workflowAPI.delete(id)
      navigate('/workflows')
    } catch (_) { showToast('Failed to delete workflow.', 'error') }
  }

  const copyWebhook = () => {
    const url = `${BASE_URL}/webhook/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Edit step helpers
  const updateStep = (idx, field, val) =>
    setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))

  const updateStepConfig = (idx, key, val) =>
    setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, config: { ...s.config, [key]: val } } : s))

  const removeStep = (idx) => setEditSteps(prev => prev.filter((_, i) => i !== idx))

  const addStep = (type) => {
    const defaults = {
      ai_analysis: { name: 'AI Analysis', config: { prompt: '' } },
      condition: { name: 'Condition Check', config: { field: '', operator: 'equals', value: '' } },
      action: { name: 'Execute Action', config: { action: '' } },
      notification: { name: 'Send Notification', config: { channel: 'email', message: '' } },
      email: { name: 'Send Email', config: { template: '' } },
    }
    setEditSteps(prev => [...prev, { type, ...defaults[type], id: Date.now() }])
  }

  if (loading) return (
    <AppShell title="Workflow" breadcrumb="Workflows">
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading workflow...
      </div>
    </AppShell>
  )

  if (!workflow) return (
    <AppShell title="Not Found" breadcrumb="Workflows">
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--clr-error)', marginBottom: 16 }}>Workflow not found.</div>
        <Link to="/workflows" className="topbar-btn">← Back to Workflows</Link>
      </div>
    </AppShell>
  )

  const webhookUrl = `${BASE_URL}/webhook/${id}`
  const triggerInfo = TRIGGER_TYPES.find(t => t.value === workflow.triggerType) || TRIGGER_TYPES[0]

  return (
    <AppShell
      title={workflow.name}
      breadcrumb="Workflows"
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="topbar-btn secondary"
            onClick={handleToggleStatus}
          >
            {workflow.status === 'active' ? '⏸ Deactivate' : '▷ Activate'}
          </button>
          <button className="topbar-btn" onClick={handleRun} disabled={running}>
            {running ? '⏳ Running...' : '▷ Run Now'}
          </button>
        </div>
      }
    >
      <div className="page-enter">

        {/* Tab bar */}
        <div className="tab-bar">
          {[
            { key: 'overview', label: '⬡ Overview' },
            { key: 'edit', label: '✎ Edit' },
            { key: 'history', label: `▷ Run History (${executions.length})` },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============= OVERVIEW TAB ============= */}
        {tab === 'overview' && (
          <div className="detail-grid">
            <div>
              {/* Step flow preview */}
              <div className="panel" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  Workflow Steps
                </div>
                <div className="flow-canvas">
                  {/* Trigger */}
                  <div className="flow-trigger-node">
                    <div className="flow-trigger-node-icon">{triggerInfo.icon}</div>
                    <div>
                      <div className="flow-trigger-label">Trigger</div>
                      <div className="flow-trigger-name">{triggerInfo.label}</div>
                    </div>
                  </div>
                  {(workflow.steps || []).map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flow-connector" />
                      <div className="flow-step-node">
                        <div className="flow-step-header">
                          <span className={`flow-step-type-badge ${step.type}`}>
                            {STEP_TYPES.find(t => t.type === step.type)?.icon} {step.type?.replace('_', ' ')}
                          </span>
                          <span className="flow-step-num">Step {i + 1}</span>
                        </div>
                        <div className="flow-step-body">
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-text-primary)', fontFamily: 'var(--font-display)' }}>
                            {step.name}
                          </div>
                          {step.config?.prompt && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', background: 'var(--clr-surface-2)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid #a371f7' }}>
                              {step.config.prompt}
                            </div>
                          )}
                          {step.config?.field && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              IF {step.config.field} {step.config.operator} "{step.config.value}"
                            </div>
                          )}
                          {step.config?.action && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--clr-accent)', fontFamily: 'var(--font-mono)' }}>
                              → {step.config.action}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  {(workflow.steps || []).length === 0 && (
                    <div style={{ padding: '16px 0', fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      No steps defined. <button className="form-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-accent)' }} onClick={() => setTab('edit')}>Add steps →</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent executions mini */}
              <div className="panel">
                <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  Recent Executions
                </div>
                {executions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--clr-text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                    No executions yet — click "Run Now" above.
                  </div>
                ) : (
                  <div className="history-list">
                    {executions.slice(0, 5).map(exec => {
                      const eid = exec._id || exec.id
                      return (
                        <Link className="history-item" to={`/executions/${eid}`} key={eid}>
                          <div className={`history-item-icon ${exec.status}`}>
                            {exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✕' : '◌'}
                          </div>
                          <div className="history-item-body">
                            <div className="history-item-time">{timeAgo(exec.startTime || exec.createdAt)}</div>
                            <div className="history-item-duration">{formatDur(exec.startTime, exec.endTime)}</div>
                          </div>
                          <span className={`badge ${exec.status}`}>{exec.status}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right info panel */}
            <div className="info-panel">
              <div className="info-panel-header">ℹ Workflow Info</div>
              <div className="info-row">
                <span className="info-row-label">Status</span>
                <span className={`badge ${workflow.status || 'inactive'}`}>{workflow.status || 'inactive'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Trigger Type</span>
                <span className="info-row-value">{triggerInfo.icon} {triggerInfo.label}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Total Steps</span>
                <span className="info-row-value">{(workflow.steps || []).length} steps</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Total Runs</span>
                <span className="info-row-value">{executions.length} executions</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Success Rate</span>
                <span className="info-row-value" style={{ color: 'var(--clr-success)' }}>
                  {executions.length > 0
                    ? `${Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)}%`
                    : '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Created</span>
                <span className="info-row-value">{new Date(workflow.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Workflow ID</span>
                <span className="info-row-value" style={{ fontSize: '0.65rem' }}>#{id.slice(-12)}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Webhook URL</span>
                <div className="webhook-url-box">
                  {webhookUrl}
                  <br />
                  <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyWebhook}>
                    {copied ? '✓ Copied!' : '⎘ Copy URL'}
                  </button>
                </div>
              </div>
              <div className="info-row">
                <button
                  onClick={handleDelete}
                  style={{
                    background: 'none', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)',
                    color: 'var(--clr-error)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                    padding: '8px 14px', cursor: 'pointer', width: '100%', transition: 'all 0.2s'
                  }}
                >
                  ✕ Delete Workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============= EDIT TAB ============= */}
        {tab === 'edit' && (
          <div className="builder-layout">
            {/* Config panel */}
            <div className="config-panel">
              <div className="config-panel-header">⚙ Workflow Config</div>
              <div className="config-section">
                <div className="config-label">Workflow Name</div>
                <input className="config-input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="config-section">
                <div className="config-label">Trigger Event</div>
                <div className="trigger-options">
                  {TRIGGER_TYPES.map(t => (
                    <div
                      key={t.value}
                      className={`trigger-option ${editTrigger === t.value ? 'selected' : ''}`}
                      onClick={() => setEditTrigger(t.value)}
                    >
                      <span className="trigger-option-icon">{t.icon}</span>
                      <div className="trigger-option-text"><strong>{t.label}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="edit-step-list">
                {editSteps.map((step, idx) => (
                  <div className="edit-step-card" key={step.id}>
                    <div className="edit-step-header">
                      <span className="drag-handle">⠿</span>
                      <span className={`flow-step-type-badge ${step.type}`}>
                        {STEP_TYPES.find(t => t.type === step.type)?.icon} {step.type?.replace('_', ' ')}
                      </span>
                      <span className="flow-step-num" style={{ marginLeft: 'auto' }}>Step {idx + 1}</span>
                      <button className="step-delete-btn" onClick={() => removeStep(idx)}>✕</button>
                    </div>
                    <div className="edit-step-body">
                      <div>
                        <div className="config-label" style={{ marginBottom: 6 }}>Step Name</div>
                        <input className="config-input" value={step.name} onChange={e => updateStep(idx, 'name', e.target.value)} />
                      </div>
                      {step.type === 'ai_analysis' && (
                        <div>
                          <div className="config-label" style={{ marginBottom: 6 }}>AI Prompt</div>
                          <textarea className="config-input" style={{ minHeight: 72, resize: 'vertical' }}
                            value={step.config?.prompt || ''} onChange={e => updateStepConfig(idx, 'prompt', e.target.value)}
                            placeholder="Describe what the AI should analyze..." />
                        </div>
                      )}
                      {step.type === 'condition' && (
                        <div className="flow-step-row">
                          <input className="config-input" placeholder="Field" value={step.config?.field || ''} onChange={e => updateStepConfig(idx, 'field', e.target.value)} />
                          <select className="config-select" style={{ maxWidth: 120 }} value={step.config?.operator || 'equals'} onChange={e => updateStepConfig(idx, 'operator', e.target.value)}>
                            <option value="equals">equals</option>
                            <option value="not_equals">not equals</option>
                            <option value="contains">contains</option>
                            <option value="greater_than">{'>'}</option>
                            <option value="less_than">{'<'}</option>
                          </select>
                          <input className="config-input" placeholder="Value" value={step.config?.value || ''} onChange={e => updateStepConfig(idx, 'value', e.target.value)} />
                        </div>
                      )}
                      {step.type === 'action' && (
                        <select className="config-select" value={step.config?.action || ''} onChange={e => updateStepConfig(idx, 'action', e.target.value)}>
                          <option value="">Select action...</option>
                          <option value="store_log">Store to Log</option>
                          <option value="update_status">Update Status</option>
                          <option value="start_fulfillment">Start Fulfillment</option>
                          <option value="escalate">Escalate Ticket</option>
                          <option value="close_ticket">Close Ticket</option>
                          <option value="custom">Custom Action</option>
                        </select>
                      )}
                      {step.type === 'notification' && (
                        <div className="flow-step-row">
                          <select className="config-select" style={{ maxWidth: 120 }} value={step.config?.channel || 'email'} onChange={e => updateStepConfig(idx, 'channel', e.target.value)}>
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="sms">SMS</option>
                          </select>
                          <input className="config-input" placeholder="Message..." value={step.config?.message || ''} onChange={e => updateStepConfig(idx, 'message', e.target.value)} />
                        </div>
                      )}
                      {step.type === 'email' && (
                        <select className="config-select" value={step.config?.template || ''} onChange={e => updateStepConfig(idx, 'template', e.target.value)}>
                          <option value="">Select template...</option>
                          <option value="order_confirmed">Order Confirmed</option>
                          <option value="order_shipped">Order Shipped</option>
                          <option value="refund_acknowledgement">Refund Acknowledgement</option>
                          <option value="support_reply">Support Auto-Reply</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add step */}
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STEP_TYPES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => addStep(t.type)}
                    style={{
                      padding: '7px 12px', background: 'var(--clr-surface)', border: '1px dashed var(--clr-border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--clr-text-muted)', fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = 'var(--clr-accent)'; e.target.style.color = 'var(--clr-accent)' }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.color = 'var(--clr-text-muted)' }}
                  >
                    + {t.icon} {t.name}
                  </button>
                ))}
              </div>

              <div className="edit-save-bar">
                <button className="btn-ghost" onClick={() => setTab('overview')}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : '⚡ Save Changes'}
                </button>
              </div>
            </div>

            {/* Empty right panel placeholder */}
            <div />
          </div>
        )}

        {/* ============= HISTORY TAB ============= */}
        {tab === 'history' && (
          <div>
            {executions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>▷</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text-secondary)', marginBottom: 8 }}>No run history</div>
                <div style={{ fontSize: '0.78rem', marginBottom: 20 }}>This workflow has never been executed.</div>
                <button className="btn-run" onClick={handleRun} disabled={running}>▷ Run Now</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {executions.map(exec => {
                  const eid = exec._id || exec.id
                  return (
                    <Link
                      key={eid}
                      to={`/executions/${eid}`}
                      className="execution-row"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="exec-row-icon" style={{ background: exec.status === 'completed' ? 'var(--clr-success-bg)' : exec.status === 'failed' ? 'var(--clr-error-bg)' : 'var(--clr-accent-glow)' }}>
                        {exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✕' : '◌'}
                      </div>
                      <div className="exec-row-body">
                        <div className="exec-row-title">Execution #{eid.slice(-8)}</div>
                        <div className="exec-row-meta">
                          <span>{timeAgo(exec.startTime || exec.createdAt)}</span>
                          <span>·</span>
                          <span>{formatDur(exec.startTime, exec.endTime)}</span>
                        </div>
                      </div>
                      <div className="exec-row-right">
                        <span className={`badge ${exec.status}`}>{exec.status}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ✅ NEW: Run Modal — user inputs real payload before triggering */}
      {runModal && (
        <div className="modal-overlay" onClick={() => !running && setRunModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">▷ Run Workflow</div>
            <div className="modal-desc" style={{ marginBottom: 16 }}>
              Send a trigger event to <strong>{workflow?.name}</strong>. Edit the payload below before running.
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Event Payload (JSON)
              </div>
              <textarea
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--clr-accent)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  minHeight: 180, resize: 'vertical', outline: 'none', lineHeight: 1.6
                }}
                value={runPayload}
                onChange={e => setRunPayload(e.target.value)}
                spellCheck={false}
                autoFocus
              />
              <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Tip: the <code style={{ color: 'var(--clr-accent)' }}>message</code> field is what Gemini AI will analyze.
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setRunModal(false)} disabled={running}>Cancel</button>
              <button className="btn-primary" onClick={handleRunConfirm} disabled={running}>
                {running ? '⏳ Running...' : '▷ Run Now'}
              </button>
            </div>
          </div>
        </div>
      )}

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