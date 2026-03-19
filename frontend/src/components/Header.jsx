import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  return (
    <header className="app-header">
      <div className="brand" onClick={() => nav("/")}>
        <div className="logo-dot" /> AI Workflow
      </div>

      <div className="header-actions">
        <button className="btn ghost" onClick={() => nav("/workflows")}>Workflows</button>
        <button className="btn ghost" onClick={() => nav("/workflows/create")}>Create</button>
        <div className="avatar" title={user?.profile?.email || "You"} onClick={() => logout()}>
          {/* simple avatar */}
          {user?.profile?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}