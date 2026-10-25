// src/components/Header.jsx
import React from 'react';
import { ShieldCheck, UserCheck, CheckCircle2, Lock, LogOut, Briefcase } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, hrUser, onLogout }) {
  return (
    <header className="header-wrapper">
      <div className="header-inner">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-title">
              Equilibrium
            </div>
            <div className="brand-subtitle">
              Anonymous Workplace Wellness Platform
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            className={`nav-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
            onClick={() => setActiveTab('employee')}
            id="nav-employee-tab"
          >
            <UserCheck size={16} />
            Employee Portal
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'public_action' ? 'active' : ''}`}
            onClick={() => setActiveTab('public_action')}
            id="nav-public-action-tab"
          >
            <CheckCircle2 size={16} />
            Action Board
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'hr' ? 'active' : ''}`}
            onClick={() => setActiveTab('hr')}
            id="nav-hr-tab"
          >
            <Briefcase size={16} />
            HR Portal
            {!hrUser && <Lock size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
          </button>
        </nav>

        {/* Right side: Privacy status & HR logged in status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hrUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-forest)' }}>
                HR: {hrUser}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                onClick={onLogout}
              >
                <LogOut size={12} />
                Log Out
              </button>
            </div>
          ) : (
            <div className="header-status" title="Your identity is completely protected.">
              <span className="status-dot"></span>
              <span>Anonymous &amp; Encrypted</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
