import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/Appshell'
import { workflowAPI } from '../utils/api'
import '../styles/CreateWorkflow.css'
import '../styles/Dashboard.css'

const TRIGGER_TYPES = [
  { value: 'webhook', icon: '🔗', label: 'Webhook', desc: 'HTTP POST event' },
  { value: 'support_ticket', icon: '🎫', label: 'Support Ticket', desc: 'Customer complaint / inquiry' },
  { value: 'order_placed', icon: '📦', label: 'Order Placed', desc: 'New e-commerce order' },
  { value: 'order_updated', icon: '🔄', label: 'Order Updated', desc: 'Status change, refund, etc.' },
  { value: 'manual', icon: '▷', label: 'Manual', desc: 'Trigger via API call' },
]

const STEP_TYPES = [
  { type: 'ai_analysis', icon: '⚛', name: 'AI Analysis', desc: 'Gemini classifies & summarizes' },
  { type: 'condition', icon: '⑂', name: 'Condition', desc: 'Branch based on a rule' },
  { type: 'action', icon: '⚡', name: 'Action', desc: 'Perform an operation' },
  { type: 'notification', icon: '🔔', name: 'Notification', desc: 'Alert a team or user' },
  { type: 'email', icon: '✉', name: 'Send Email', desc: 'Automated email response' },
]

const TEMPLATES = [
  {
    name: '🎫 Auto Support Reply',
    category: 'customer-support',
    desc: 'Analyze ticket, detect priority, send AI-generated reply',
    trigger: 'support_ticket',
    steps: [
      { type: 'ai_analysis', name: 'Analyze Ticket', config: { prompt: 'Analyze support ticket. Detect: intent, priority (low/medium/high), summary.' } },
      { type: 'condition', name: 'Check Priority', config: { field: 'priority', operator: 'equals', value: 'high' } },
      { type: 'notification', name: 'Alert Support Team', config: { channel: 'email', message: 'High priority ticket received' } },
      { type: 'action', name: 'Log Ticket', config: { action: 'store_log' } },
    ]
  },
  {
    name: '🔄 Refund Processor',
    category: 'customer-support',
    desc: 'Detect refund request, validate, notify finance team',
    trigger: 'support_ticket',
    steps: [
      { type: 'ai_analysis', name: 'Detect Refund Intent', config: { prompt: 'Detect if this is a refund request. Extract: order_id, reason, urgency.' } },
      { type: 'condition', name: 'Valid Refund?', config: { field: 'intent', operator: 'equals', value: 'refund' } },
      { type: 'notification', name: 'Notify Finance', config: { channel: 'slack', message: 'Refund request detected' } },
      { type: 'email', name: 'Confirm to Customer', config: { template: 'refund_acknowledgement' } },
    ]
  },
  {
    name: '📦 Order Fulfillment',
    category: 'ecommerce',
    desc: 'Process new order, run AI checks, trigger fulfillment',
    trigger: 'order_placed',
    steps: [
      { type: 'ai_analysis', name: 'Order Risk Check', config: { prompt: 'Analyze order for risk: fraud indicators, unusual patterns.' } },
      { type: 'condition', name: 'Fraud Check', config: { field: 'risk_level', operator: 'equals', value: 'low' } },
      { type: 'action', name: 'Trigger Fulfillment', config: { action: 'start_fulfillment' } },
      { type: 'email', name: 'Order Confirmation', config: { template: 'order_confirmed' } },
    ]
  },
  {
    name: '🚚 Shipping Update',
    category: 'ecommerce',
    desc: 'Detect order update event, notify customer via email',
    trigger: 'order_updated',
    steps: [
      { type: 'condition', name: 'Check Event Type', config: { field: 'event', operator: 'equals', value: 'shipped' } },
      { type: 'email', name: 'Shipping Notification', config: { template: 'order_shipped' } },
      { type: 'action', name: 'Update Order DB', config: { action: 'update_status' } },
    ]
  },
  {
    name: '🔗 Generic Webhook Flow',
    category: 'webhook',
    desc: 'Catch any webhook, AI process payload, take action',
    trigger: 'webhook',
    steps: [
      { type: 'ai_analysis', name: 'Process Payload', config: { prompt: 'Analyze incoming webhook payload. Determine action required.' } },
      { type: 'condition', name: 'Route Decision', config: { field: 'action_required', operator: 'equals', value: 'true' } },
      { type: 'action', name: 'Execute Action', config: { action: 'custom' } },
    ]
  },
]

function newStep(type) {
  const defaults = {
    ai_analysis: { name: 'AI Analysis', config: { prompt: '' } },
    condition: { name: 'Condition Check', config: { field: '', operator: 'equals', value: '' } },
    action: { name: 'Execute Action', config: { action: '' } },
    notification: { name: 'Send Notification', config: { channel: 'email', message: '' } },
    email: { name: 'Send Email', config: { template: '', to: '' } },
  }
  return { type, ...defaults[type], id: Date.now() }
}

function getTriggerInfo(val) {
  return TRIGGER_TYPES.find(t => t.value === val) || TRIGGER_TYPES[0]
}

export default function CreateWorkflow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('webhook')
  const [steps, setSteps] = useState([])
  const [showStepPicker, setShowStepPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load template if passed in URL
  useEffect(() => {
    const templateParam = searchParams.get('template')
    if (templateParam) {
      const tpl = TEMPLATES.find(t => t.category === templateParam) || TEMPLATES[0]
      applyTemplate(tpl)
    }
  }, [])

  const applyTemplate = (tpl) => {
    setName(tpl.name.replace(/^[^\w]+ ?/, ''))
    setTriggerType(tpl.trigger)
    setSteps(tpl.steps.map((s, i) => ({ ...s, id: Date.now() + i })))
    setShowStepPicker(false)
  }

  const addStep = (type) => {
    setSteps(prev => [...prev, newStep(type)])
    setShowStepPicker(false)
  }

  const removeStep = (idx) => {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }

  const updateStep = (idx, field, value) => {
    setSteps(prev => prev.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    ))
  }

  const updateStepConfig = (idx, key, value) => {
    setSteps(prev => prev.map((s, i) =>
      i === idx ? { ...s, config: { ...s.config, [key]: value } } : s
    ))
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Workflow name is required.'); return }
    if (steps.length === 0) { setError('Add at least one step.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        triggerType,
        status: 'active',
        steps: steps.map(({ id, ...rest }) => rest)
      }
      await workflowAPI.create(payload)
      navigate('/workflows')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save workflow.')
    }
    setSaving(false)
  }

  const triggerInfo = getTriggerInfo(triggerType)

  return (
    <AppShell
      title="Create Workflow"
      breadcrumb="Workflows"
      topbarRight={
        <button className="topbar-btn secondary" onClick={() => navigate('/workflows')}>
          ← Back
        </button>
      }
    >
      <div className="page-enter">
        {error && (
          <div className="form-alert error" style={{ marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            <span>⚠ {error}</span>
          </div>
        )}

        <div className="builder-layout">
          {/* ---- Left Config ---- */}
          <div className="config-panel">
            <div className="config-panel-header">⚙ Workflow Config</div>

            <div className="config-section">
              <div className="config-label">Workflow Name</div>
              <input
                className="config-input"
                placeholder="e.g. Auto Support Reply"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="config-section">
              <div className="config-label">Trigger Event</div>
              <div className="trigger-options">
                {TRIGGER_TYPES.map(t => (
                  <div
                    key={t.value}
                    className={`trigger-option ${triggerType === t.value ? 'selected' : ''}`}
                    onClick={() => setTriggerType(t.value)}
                  >
                    <span className="trigger-option-icon">{t.icon}</span>
                    <div className="trigger-option-text">
                      <strong>{t.label}</strong>
                      <span>{t.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-section">
              <div className="config-label">Steps Summary</div>
              {steps.length === 0 ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  No steps yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {steps.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--clr-text-secondary)' }}>
                      <span style={{ color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{i + 1}.</span>
                      <span className={`step-chip ${s.type}`} style={{ fontSize: '0.62rem' }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- Middle Flow Canvas ---- */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Flow Builder
              </div>
            </div>

            <div className="flow-canvas">
              {/* Trigger Node */}
              <div className="flow-trigger-node">
                <div className="flow-trigger-node-icon">{triggerInfo.icon}</div>
                <div>
                  <div className="flow-trigger-label">Trigger</div>
                  <div className="flow-trigger-name">{triggerInfo.label}</div>
                </div>
              </div>

              {/* Steps */}
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flow-connector" />
                  <div className="flow-step-node">
                    <div className="flow-step-header">
                      <span className={`flow-step-type-badge ${step.type}`}>
                        {STEP_TYPES.find(t => t.type === step.type)?.icon} {step.type.replace('_', ' ')}
                      </span>
                      <span className="flow-step-num">Step {idx + 1}</span>
                      <button className="step-delete-btn" onClick={() => removeStep(idx)}>✕</button>
                    </div>
                    <div className="flow-step-body">
                      <div>
                        <div className="config-label" style={{ marginBottom: 6 }}>Step Name</div>
                        <input
                          className="config-input"
                          value={step.name}
                          onChange={e => updateStep(idx, 'name', e.target.value)}
                          placeholder="Step name..."
                        />
                      </div>

                      {/* AI Analysis config */}
                      {step.type === 'ai_analysis' && (
                        <div>
                          <div className="config-label" style={{ marginBottom: 6 }}>AI Prompt</div>
                          <textarea
                            className="config-input"
                            style={{ minHeight: 72, resize: 'vertical' }}
                            value={step.config?.prompt || ''}
                            onChange={e => updateStepConfig(idx, 'prompt', e.target.value)}
                            placeholder="e.g. Analyze this support ticket. Detect intent, priority, and summarize..."
                          />
                        </div>
                      )}

                      {/* Condition config */}
                      {step.type === 'condition' && (
                        <div className="flow-step-row">
                          <input
                            className="config-input"
                            placeholder="Field (e.g. priority)"
                            value={step.config?.field || ''}
                            onChange={e => updateStepConfig(idx, 'field', e.target.value)}
                          />
                          <select
                            className="config-select"
                            style={{ maxWidth: 120 }}
                            value={step.config?.operator || 'equals'}
                            onChange={e => updateStepConfig(idx, 'operator', e.target.value)}
                          >
                            <option value="equals">equals</option>
                            <option value="not_equals">not equals</option>
                            <option value="contains">contains</option>
                            <option value="greater_than">{'>'}</option>
                            <option value="less_than">{'<'}</option>
                          </select>
                          <input
                            className="config-input"
                            placeholder="Value"
                            value={step.config?.value || ''}
                            onChange={e => updateStepConfig(idx, 'value', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Action config */}
                      {step.type === 'action' && (
                        <div>
                          <div className="config-label" style={{ marginBottom: 6 }}>Action Type</div>
                          <select
                            className="config-select"
                            value={step.config?.action || ''}
                            onChange={e => updateStepConfig(idx, 'action', e.target.value)}
                          >
                            <option value="">Select action...</option>
                            <option value="store_log">Store to Log</option>
                            <option value="update_status">Update Status</option>
                            <option value="start_fulfillment">Start Fulfillment</option>
                            <option value="escalate">Escalate Ticket</option>
                            <option value="close_ticket">Close Ticket</option>
                            <option value="custom">Custom Action</option>
                          </select>
                        </div>
                      )}

                      {/* Notification config */}
                      {step.type === 'notification' && (
                        <div className="flow-step-row">
                          <select
                            className="config-select"
                            style={{ maxWidth: 120 }}
                            value={step.config?.channel || 'email'}
                            onChange={e => updateStepConfig(idx, 'channel', e.target.value)}
                          >
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="sms">SMS</option>
                            <option value="webhook">Webhook</option>
                          </select>
                          <input
                            className="config-input"
                            placeholder="Notification message..."
                            value={step.config?.message || ''}
                            onChange={e => updateStepConfig(idx, 'message', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Email config */}
                      {step.type === 'email' && (
                        <div className="flow-step-row">
                          <select
                            className="config-select"
                            value={step.config?.template || ''}
                            onChange={e => updateStepConfig(idx, 'template', e.target.value)}
                          >
                            <option value="">Select template...</option>
                            <option value="order_confirmed">Order Confirmed</option>
                            <option value="order_shipped">Order Shipped</option>
                            <option value="refund_acknowledgement">Refund Acknowledgement</option>
                            <option value="support_reply">Support Auto-Reply</option>
                            <option value="custom">Custom</option>
                          </select>
                          <input
                            className="config-input"
                            placeholder="To: (optional)"
                            value={step.config?.to || ''}
                            onChange={e => updateStepConfig(idx, 'to', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* Add Step */}
              <div className="flow-connector" />

              {showStepPicker ? (
                <div style={{ width: '100%', maxWidth: 460 }}>
                  <div style={{ marginBottom: 10, fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Choose step type:
                  </div>
                  <div className="step-type-picker">
                    {STEP_TYPES.map(t => (
                      <div
                        key={t.type}
                        className="step-type-option"
                        onClick={() => addStep(t.type)}
                      >
                        <div className="step-type-icon">{t.icon}</div>
                        <div className="step-type-name">{t.name}</div>
                        <div className="step-type-desc">{t.desc}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => setShowStepPicker(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="add-step-btn" onClick={() => setShowStepPicker(true)}>
                  ＋ Add Step
                </button>
              )}
            </div>
          </div>

          {/* ---- Right Templates ---- */}
          <div className="templates-panel">
            <div className="templates-panel-header">📋 Templates</div>
            <div className="template-list">
              {TEMPLATES.map((tpl, i) => (
                <div className="template-card" key={i} onClick={() => applyTemplate(tpl)}>
                  <div className="template-card-name">{tpl.name}</div>
                  <div className="template-card-desc">{tpl.desc}</div>
                  <div className="template-steps-preview">
                    {tpl.steps.map((s, j) => (
                      <span className="template-step-tag" key={j}>{s.type}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="builder-submit-bar">
          <div className="submit-bar-info">
            {steps.length} step{steps.length !== 1 ? 's' : ''} · {triggerInfo.icon} {triggerInfo.label} trigger
          </div>
          <div className="submit-bar-actions">
            <button className="btn-ghost" onClick={() => navigate('/workflows')}>
              Discard
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving...' : '⚡ Deploy Workflow'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}