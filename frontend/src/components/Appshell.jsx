import React from 'react'
import Sidebar from './Sidebar'
import '../styles/Sidebar.css'

export default function AppShell({ title, breadcrumb, topbarRight, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            {breadcrumb && <span className="topbar-breadcrumb">{breadcrumb} /</span>}
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-right">
            {topbarRight}
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}