import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '../components/Appshell'
import ExecutionTimeline from '../components/ExecutionTimeline'
import { executionAPI } from '../utils/api'
import '../styles/Executions.css'
import '../styles/Dashboard.css'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function ExecutionDetail() {
  const { id } = useParams()
  const [exec, setExec] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eRes, lRes] = await Promise.allSettled([
          executionAPI.getById(id),
          executionAPI.getLogs(id)
        ])
        if (eRes.status === 'fulfilled') setExec(eRes.value.data?.execution || eRes.value.data)
        if (lRes.status === 'fulfilled') setLogs(lRes.value.data?.logs || lRes.value.data || [])
      } catch (_) {}
      setLoading(false)
    }
    fetchData()
    const poll = setInterval(fetchData, 4000)
    return () => clearInterval(poll)
  }, [id])

  if (loading) return (
    <AppShell title="Execution Detail" breadcrumb="Executions">
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading execution...
      </div>
    </AppShell>
  )

  if (!exec) return (
    <AppShell title="Execution Not Found" breadcrumb="Executions">
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--clr-error)', marginBottom: 16 }}>Execution not found.</div>
        <Link to="/executions" className="topbar-btn">← Back to Executions</Link>
      </div>
    </AppShell>
  )

  return (
    <AppShell
      title={exec.workflowId?.name || exec.workflowName || 'Execution Detail'}
      breadcrumb="Executions"
      topbarRight={
        <Link to="/executions" className="topbar-btn secondary">← All Executions</Link>
      }
    >
      <div className="page-enter">
        {/* Header info */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Status', value: <span className={`badge ${exec.status}`}>{exec.status}</span> },
            { label: 'Execution ID', value: `#${id.slice(-8)}` },
            { label: 'Started', value: timeAgo(exec.startTime || exec.createdAt) },
            { label: 'Trigger', value: exec.triggerType || 'manual' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--clr-surface)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px'
            }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="executions-layout">
          {/* Timeline */}
          <div className="exec-detail-panel" style={{ position: 'static' }}>
            <div className="exec-detail-header">
              <div className="exec-detail-title">Step-by-Step Timeline</div>
              <div className="exec-detail-meta">
                {(exec.steps || exec.logs || []).length} steps executed
              </div>
            </div>
            <ExecutionTimeline
              steps={exec.steps || exec.logs || []}
              status={exec.status}
            />
          </div>

          {/* Logs */}
          <div className="exec-detail-panel" style={{ position: 'sticky', top: 76 }}>
            <div className="exec-detail-header">
              <div className="exec-detail-title">Execution Logs</div>
            </div>
            <div className="logs-body" style={{ maxHeight: 480 }}>
              {logs.length === 0 ? (
                <span style={{ color: 'var(--clr-text-muted)' }}>No logs available.</span>
              ) : (
                logs.map((log, i) => (
                  <div className="log-line" key={i}>
                    <span className="log-time">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--'}
                    </span>
                    <span className={`log-level ${log.level || 'info'}`}>
                      [{(log.level || 'INFO').toUpperCase()}]
                    </span>
                    <span>{log.message || log.result || JSON.stringify(log)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}