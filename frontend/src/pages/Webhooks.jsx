import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { workflowAPI, webhookAPI } from '../utils/api'
import '../styles/Webhooks.css'
import '../styles/Dashboard.css'
import '../styles/Sidebar.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const DEFAULT_PAYLOADS = {
  support: `{
  "type": "support_ticket",
  "message": "I need a refund for order #38291. The item arrived damaged.",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "priority": "unknown"
}`,
  ecommerce: `{
  "type": "order_placed",
  "orderId": "ORD-28471",
  "customer": {
    "email": "buyer@example.com",
    "name": "Jane Smith"
  },
  "items": [
    { "sku": "PROD-001", "qty": 2, "price": 49.99 }
  ],
  "total": 99.98
}`,
  generic: `{
  "event": "custom_trigger",
  "data": {
    "message": "Sample webhook payload"
  },
  "timestamp": "${new Date().toISOString()}"
}`,
}

function timeAgo(d) {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function Webhooks() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [payload, setPayload] = useState(DEFAULT_PAYLOADS.generic)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState(null)
  const [history, setHistory] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const res = await workflowAPI.getAll()
      const all = res.data?.workflows || res.data || []
      setWorkflows(all)
      if (all.length > 0) setSelectedId(all[0]._id || all[0].id)
    } catch (_) {}
    setLoading(false)
  }

  const copyUrl = (id) => {
    navigator.clipboard.writeText(`${BASE_URL}/webhook/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const loadTemplate = (type) => {
    setPayload(DEFAULT_PAYLOADS[type] || DEFAULT_PAYLOADS.generic)
  }

  const sendWebhook = async () => {
    if (!selectedId) return
    setSending(true)
    setResponse(null)
    const start = Date.now()
    try {
      let parsed = {}
      try { parsed = JSON.parse(payload) } catch (_) { parsed = { raw: payload } }

      const res = await webhookAPI.trigger(selectedId, parsed)
      const elapsed = Date.now() - start
      setResponse({
        ok: true,
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        elapsed,
      })
      const wf = workflows.find(w => (w._id || w.id) === selectedId)
      setHistory(prev => [{
        id: Date.now(),
        workflowName: wf?.name || 'Unknown',
        workflowId: selectedId,
        status: res.status,
        elapsed,
        time: Date.now(),
      }, ...prev.slice(0, 19)])
    } catch (e) {
      const elapsed = Date.now() - start
      setResponse({
        ok: false,
        status: e.response?.status || 0,
        statusText: e.response?.statusText || 'Network Error',
        data: e.response?.data || { error: e.message },
        elapsed,
      })
    }
    setSending(false)
  }

  const selectedWorkflow = workflows.find(w => (w._id || w.id) === selectedId)

  return (
    <AppShell title="Webhooks" breadcrumb="FlowAI">
      <div className="page-enter">

        {/* Info banner */}
        <div style={{
          background: 'var(--clr-accent-glow)',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 20 }}>⇌</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-accent)', marginBottom: 2 }}>
              Webhook Triggers
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Every workflow gets a unique HTTP endpoint. POST any JSON payload to trigger it — from Shopify, Zendesk, or any external service.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--clr-accent)', fontFamily: 'var(--font-mono)' }}>
            <span className="live-dot" />
            Receiving
          </div>
        </div>

        <div className="webhooks-layout">
          {/* Left: workflow webhook list */}
          <div>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="section-title">
                Workflow Endpoints
              </span>
              <Link to="/workflows/new" className="section-link">+ New Workflow</Link>
            </div>

            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="webhook-card skeleton" style={{ height: 100 }} />
              ))
            ) : workflows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>⇌</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--clr-text-secondary)', marginBottom: 8 }}>
                  No workflows yet
                </div>
                <Link to="/workflows/new" className="topbar-btn" style={{ display: 'inline-flex' }}>
                  Create First Workflow
                </Link>
              </div>
            ) : (
              workflows.map(wf => {
                const wid = wf._id || wf.id
                const url = `${BASE_URL}/webhook/${wid}`
                const isCopied = copiedId === wid
                const isSelected = selectedId === wid

                return (
                  <div
                    key={wid}
                    className="webhook-card"
                    style={{
                      borderColor: isSelected ? 'var(--clr-accent)' : undefined,
                      background: isSelected ? 'rgba(0,212,170,0.03)' : undefined,
                    }}
                  >
                    <div className="webhook-card-header">
                      <div className="webhook-card-name">
                        <span>{wf.name}</span>
                        <span className={`badge ${wf.status || 'inactive'}`}>{wf.status || 'inactive'}</span>
                      </div>
                      <div className="webhook-card-actions">
                        <button
                          className="topbar-btn secondary"
                          style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                          onClick={() => { setSelectedId(wid) }}
                        >
                          Test
                        </button>
                        <Link
                          to={`/workflows/${wid}`}
                          className="topbar-btn secondary"
                          style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <div className="webhook-url-row">
                      <span className="webhook-url-method">POST</span>
                      <span className="webhook-url-text">{url}</span>
                      <button
                        className={`copy-btn ${isCopied ? 'copied' : ''}`}
                        onClick={() => copyUrl(wid)}
                        style={{ flexShrink: 0, marginTop: 0 }}
                      >
                        {isCopied ? '✓' : '⎘'}
                      </button>
                    </div>

                    <div className="webhook-meta">
                      <span className="webhook-meta-item">
                        ◈ {(wf.steps || []).length} steps
                      </span>
                      <span className="webhook-meta-item">
                        {wf.triggerType === 'webhook'
                          ? '🔗 Webhook trigger'
                          : `${wf.triggerType?.replace('_', ' ') || 'manual'} trigger`}
                      </span>
                      <span className="webhook-meta-item" style={{ marginLeft: 'auto' }}>
                        #{wid.slice(-8)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}

            {/* History */}
            {history.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-header" style={{ marginBottom: 12 }}>
                  <span className="section-title">Recent Test Calls</span>
                  <button
                    className="section-link"
                    onClick={() => setHistory([])}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}
                  >
                    Clear
                  </button>
                </div>
                <div className="webhook-history">
                  {history.map(h => (
                    <div className="webhook-history-item" key={h.id}>
                      <span className="webhook-history-method">POST</span>
                      <span className="webhook-history-workflow">{h.workflowName}</span>
                      <span style={{ color: h.status >= 200 && h.status < 300 ? 'var(--clr-success)' : 'var(--clr-error)', fontWeight: 700, flexShrink: 0 }}>
                        {h.status}
                      </span>
                      <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>
                        {h.elapsed}ms
                      </span>
                      <span className="webhook-history-time">{timeAgo(h.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Tester */}
          <div className="tester-panel">
            <div className="tester-panel-header">
              <div className="tester-panel-title">🧪 Webhook Tester</div>
              <div className="tester-panel-sub">
                Send a test request to any workflow endpoint
              </div>
            </div>
            <div className="tester-body">
              {/* Workflow selector */}
              <div>
                <div className="tester-label">Target Workflow</div>
                <select
                  className="config-select"
                  style={{ width: '100%', padding: '9px 32px 9px 12px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', outline: 'none' }}
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  <option value="">Select workflow...</option>
                  {workflows.map(wf => (
                    <option key={wf._id || wf.id} value={wf._id || wf.id}>{wf.name}</option>
                  ))}
                </select>
              </div>

              {/* URL preview */}
              {selectedId && (
                <div style={{ background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', borderLeft: '2px solid var(--clr-accent)' }}>
                  POST {BASE_URL}/webhook/{selectedId.slice(-12)}...
                </div>
              )}

              {/* Payload templates */}
              <div>
                <div className="tester-label">Payload Templates</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'support', label: '🎫 Support Ticket' },
                    { key: 'ecommerce', label: '📦 E-Commerce' },
                    { key: 'generic', label: '⚡ Generic' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => loadTemplate(t.key)}
                      style={{
                        padding: '5px 10px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)',
                        borderRadius: '20px', color: 'var(--clr-text-secondary)', fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* JSON payload */}
              <div>
                <div className="tester-label">JSON Payload</div>
                <textarea
                  className="tester-json"
                  value={payload}
                  onChange={e => setPayload(e.target.value)}
                  spellCheck={false}
                />
              </div>

              {/* Send button */}
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={sendWebhook}
                disabled={sending || !selectedId}
              >
                {sending ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="spinner" style={{ borderTopColor: '#080c10', borderColor: 'rgba(0,0,0,0.2)' }} />
                    Sending...
                  </span>
                ) : '⇌ Send Webhook'}
              </button>

              {/* Response */}
              {response && (
                <div>
                  <div className="tester-label">Response</div>
                  <div className="response-panel">
                    <div className="response-header">
                      <span className={`response-status ${response.ok ? 'ok' : 'err'}`}>
                        {response.ok ? '✓' : '✕'} {response.status} {response.statusText}
                      </span>
                      <span className="response-time">{response.elapsed}ms</span>
                    </div>
                    <div className="response-body">
                      {JSON.stringify(response.data, null, 2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}