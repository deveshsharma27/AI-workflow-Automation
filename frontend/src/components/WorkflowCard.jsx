import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Workflows.css'

function getCategoryInfo(wf) {
  const name = (wf.name || '').toLowerCase()
  const steps = wf.steps || []
  if (name.includes('support') || name.includes('ticket') || name.includes('complaint') || name.includes('refund'))
    return { key: 'support', label: 'Customer Support', icon: '🎫', color: 'rgba(0,149,255,0.12)' }
  if (name.includes('order') || name.includes('ecommerce') || name.includes('ship') || name.includes('commerce'))
    return { key: 'ecommerce', label: 'E-Commerce', icon: '📦', color: 'rgba(255,107,53,0.12)' }
  if (steps.some(s => s.type === 'ai_analysis'))
    return { key: 'ai', label: 'AI Processing', icon: '⚛', color: 'rgba(163,113,247,0.12)' }
  if (wf.triggerType === 'webhook')
    return { key: 'webhook', label: 'Webhook', icon: '🔗', color: 'rgba(0,212,170,0.1)' }
  return { key: 'general', label: 'General', icon: '⚡', color: 'rgba(255,255,255,0.05)' }
}

function getStepChipClass(type) {
  const map = { ai_analysis: 'ai_analysis', condition: 'condition', action: 'action', notification: 'notification', email: 'email' }
  return map[type] || 'default'
}

export default function WorkflowCard({ workflow, onDelete, onToggle }) {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef(null)
  const category = getCategoryInfo(workflow)
  const steps = workflow.steps || []
  const id = workflow._id || workflow.id

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleCardClick = (e) => {
    if (e.target.closest('.card-menu-wrapper') || e.target.closest('.toggle-switch')) return
    navigate(`/workflows/${id}`)
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setDropdownOpen(v => !v)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setDropdownOpen(false)
    onDelete(id, workflow.name)
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggle(id, workflow.status)
  }

  const handleExecute = (e) => {
    e.stopPropagation()
    setDropdownOpen(false)
    navigate(`/executions?trigger=${id}`)
  }

  return (
    <div className="workflow-card" onClick={handleCardClick}>
      <div className="workflow-card-header">
        <div className="workflow-card-icon-wrap" style={{ background: category.color }}>
          {category.icon}
        </div>
        <div className="workflow-card-title-area">
          <div className="workflow-card-name">{workflow.name}</div>
          <div className="workflow-card-trigger">
            {workflow.triggerType || 'webhook'} trigger
          </div>
        </div>
        <div className="card-menu-wrapper" ref={dropRef}>
          <button className="workflow-card-menu" onClick={handleMenuClick}>⋯</button>
          {dropdownOpen && (
            <div className="card-dropdown">
              <button className="card-dropdown-item" onClick={handleExecute}>
                ▷ Run Now
              </button>
              <button className="card-dropdown-item" onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate(`/workflows/${id}`) }}>
                ✎ Edit
              </button>
              <button className="card-dropdown-item danger" onClick={handleDelete}>
                ✕ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Steps preview */}
      {steps.length > 0 && (
        <div className="workflow-card-steps">
          {steps.slice(0, 4).map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="step-chip-arrow">→</span>}
              <span className={`step-chip ${getStepChipClass(step.type)}`}>
                {step.name || step.type}
              </span>
            </React.Fragment>
          ))}
          {steps.length > 4 && (
            <><span className="step-chip-arrow">→</span>
            <span className="step-chip default">+{steps.length - 4} more</span></>
          )}
        </div>
      )}

      <div className="workflow-card-footer">
        <div className="workflow-card-meta">
          <span className={`category-tag ${category.key}`}>{category.label}</span>
          <span className="workflow-meta-item">
            ◈ {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="card-menu-wrapper" onClick={e => e.stopPropagation()}>
          <label className="toggle-switch" title={workflow.status === 'active' ? 'Deactivate' : 'Activate'}>
            <input
              type="checkbox"
              checked={workflow.status === 'active'}
              onChange={handleToggle}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
    </div>
  )
}