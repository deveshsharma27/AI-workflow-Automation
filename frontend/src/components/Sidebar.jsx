import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Sidebar.css'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">⚛</div>
        <span className="sidebar-logo-text">Flow<span>AI</span></span>
      </Link>

      <p className="sidebar-section-label">Core</p>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⬡</span>
          Dashboard
        </NavLink>
        <NavLink to="/workflows" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">◈</span>
          Workflows
        </NavLink>
        <NavLink to="/executions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">▷</span>
          Executions
          <span className="sidebar-badge green">Live</span>
        </NavLink>
        <NavLink to="/webhooks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⇌</span>
          Webhooks
        </NavLink>
      </nav>

      <p className="sidebar-section-label">Automation</p>
      <div className="sidebar-category-group">
        <NavLink to="/workflows?category=customer-support" className="sidebar-category">
          <span className="cat-dot" style={{ background: '#0095ff' }} />
          Customer Support
        </NavLink>
        <NavLink to="/workflows?category=ecommerce" className="sidebar-category">
          <span className="cat-dot" style={{ background: '#ff6b35' }} />
          E-Commerce
        </NavLink>
        <NavLink to="/workflows?category=ai-processing" className="sidebar-category">
          <span className="cat-dot" style={{ background: '#a371f7' }} />
          AI Processing
        </NavLink>
        <NavLink to="/workflows?category=webhook" className="sidebar-category">
          <span className="cat-dot" style={{ background: '#00d4aa' }} />
          Webhooks
        </NavLink>
      </div>

      <p className="sidebar-section-label">Account</p>
      <nav className="sidebar-nav">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⚙</span>
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-online" />
          System Online
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">Operator</div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  )
}