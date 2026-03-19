import React from 'react'
import '../styles/Executions.css'

const STEP_ICONS = {
  ai_analysis: '⚛',
  condition: '⑂',
  action: '⚡',
  notification: '🔔',
  email: '✉',
}

function formatResult(result) {
  if (!result) return null
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

export default function ExecutionTimeline({ steps = [], status }) {
  if (steps.length === 0) {
    return (
      <div style={{ padding: '18px', fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
        No step data available.
      </div>
    )
  }

  return (
    <div className="execution-timeline">
      {steps.map((step, i) => {
        const isRunning = step.status === 'running'
        const icon = STEP_ICONS[step.type] || '◈'
        const result = formatResult(step.result)

        return (
          <div className="timeline-step" key={i}>
            <div className="timeline-step-line" />
            <div className={`timeline-step-dot ${step.status || 'pending'}`}>
              {step.status === 'completed' ? '✓' :
               step.status === 'failed' ? '✕' :
               step.status === 'running' ? '◌' :
               icon}
            </div>
            <div className="timeline-step-content">
              <div className="timeline-step-name">{step.name || step.stepName || `Step ${i + 1}`}</div>
              <div className="timeline-step-type">{(step.type || '').replace('_', ' ')}</div>
              {result && (
                <div className={`timeline-step-result ${step.type === 'ai_analysis' ? 'ai' : ''}`}>
                  {result}
                </div>
              )}
              {step.duration && (
                <div className="timeline-step-duration">⏱ {step.duration}ms</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}