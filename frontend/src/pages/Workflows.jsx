import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppShell from '../components/Appshell.jsx'
import WorkflowCard from '../components/workflowCard.jsx'
import { workflowAPI } from '../utils/api'
import '../styles/Workflows.css'
import '../styles/Dashboard.css'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'customer-support', label: '🎫 Customer Support' },
  { key: 'ecommerce', label: '📦 E-Commerce' },
  { key: 'ai-processing', label: '⚛ AI Processing' },
  { key: 'webhook', label: '🔗 Webhook' },
]

function matchCategory(wf, cat) {
  if (cat === 'all') return true
  const name = (wf.name || '').toLowerCase()
  if (cat === 'customer-support') return name.includes('support') || name.includes('ticket') || name.includes('complaint') || name.includes('refund')
  if (cat === 'ecommerce') return name.includes('order') || name.includes('commerce') || name.includes('ship')
  if (cat === 'ai-processing') return (wf.steps || []).some(s => s.type === 'ai_analysis')
  if (cat === 'webhook') return wf.triggerType === 'webhook'
  return true
}

export default function Workflows() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const activeCategory = searchParams.get('category') || 'all'

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const res = await workflowAPI.getAll()
      setWorkflows(res.data?.workflows || res.data || [])
    } catch (_) {}
    setLoading(false)
  }

  const handleDelete = (id, name) => setDeleteTarget({ id, name })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await workflowAPI.delete(deleteTarget.id)
      setWorkflows(prev => prev.filter(w => (w._id || w.id) !== deleteTarget.id))
      showToast('Workflow deleted successfully.', 'success')
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete workflow.', 'error')
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await workflowAPI.update(id, { status: newStatus })
      setWorkflows(prev =>
        prev.map(w => (w._id || w.id) === id ? { ...w, status: newStatus } : w)
      )
    } catch (_) {
      showToast('Failed to update workflow status.', 'error')
    }
  }

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = workflows.filter(wf => {
    const matchSearch = !search || (wf.name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = matchCategory(wf, activeCategory)
    return matchSearch && matchCat
  })

  return (
    <AppShell
      title="Workflows"
      breadcrumb="FlowAI"
      topbarRight={
        <Link to="/workflows/new" className="topbar-btn">
          ＋ New Workflow
        </Link>
      }
    >
      <div className="page-enter">

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-search-wrapper">
            <span className="filter-search-icon">⌕</span>
            <input
              className="filter-search"
              placeholder="Search workflows..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-pill ${activeCategory === f.key ? 'active' : ''}`}
                onClick={() => setSearchParams(f.key === 'all' ? {} : { category: f.key })}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="workflows-count">
            {filtered.length} workflow{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="workflows-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                height: 180,
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-lg)'
              }} className="skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--clr-text-muted)'
          }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>◈</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-text-secondary)', marginBottom: 8 }}>
              {search ? 'No workflows match your search' : 'No workflows yet'}
            </div>
            <div style={{ fontSize: '0.8rem', marginBottom: 24, fontFamily: 'var(--font-mono)' }}>
              {search
                ? 'Try a different search term or filter.'
                : 'Build your first automation — Customer Support or E-Commerce.'}
            </div>
            {!search && (
              <Link to="/workflows/new" className="topbar-btn" style={{ display: 'inline-flex' }}>
                ＋ Create First Workflow
              </Link>
            )}
          </div>
        ) : (
          <div className="workflows-grid">
            {filtered.map(wf => (
              <WorkflowCard
                key={wf._id || wf.id}
                workflow={wf}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Workflow?</div>
            <div className="modal-desc">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
              This will permanently remove the workflow and all its execution history.
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'success' ? 'var(--clr-success-bg)' : 'var(--clr-error-bg)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
          color: toast.type === 'success' ? 'var(--clr-success)' : 'var(--clr-error)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)',
          zIndex: 300,
          animation: 'slideUp 0.3s ease'
        }}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}
    </AppShell>
  )
}