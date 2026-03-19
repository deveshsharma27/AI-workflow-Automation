import React, { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages
import Login           from '../pages/Login'
import Signup          from '../pages/Signup'
import Dashboard       from '../pages/Dashboard'
import Workflows       from '../pages/Workflows'
import CreateWorkflow  from '../pages/CreateWorkflow'
import WorkflowDetail  from '../pages/WorkflowDetail'
import Executions      from '../pages/Executions'
import ExecutionDetail from '../pages/ExecutionDetail'
import Webhooks        from '../pages/Webhooks'
import Settings        from '../pages/Settings'

// Auth context — direct useContext so ProtectedRoute stays inside this file
import { AuthContext } from '../context/AuthContext'

// ─── Protected Route (inline, owned by AppRoutes) ─────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loadingAuth } = useContext(AuthContext)

  if (loadingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-bg)',
        color: 'var(--clr-text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        gap: 10
      }}>
        <span style={{
          width: 14, height: 14, border: '2px solid var(--clr-border)',
          borderTopColor: 'var(--clr-accent)', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite', display: 'inline-block'
        }} />
        Checking session...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

// ─── All Application Routes ────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/workflows"       element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
        <Route path="/workflows/new"   element={<ProtectedRoute><CreateWorkflow /></ProtectedRoute>} />
        <Route path="/workflows/:id"   element={<ProtectedRoute><WorkflowDetail /></ProtectedRoute>} />
        <Route path="/executions"      element={<ProtectedRoute><Executions /></ProtectedRoute>} />
        <Route path="/executions/:id"  element={<ProtectedRoute><ExecutionDetail /></ProtectedRoute>} />
        <Route path="/webhooks"        element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
        <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Fallbacks */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}