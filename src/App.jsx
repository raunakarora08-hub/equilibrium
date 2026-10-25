// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmployeePortal from './components/EmployeePortal';
import PublicActionBoard from './components/PublicActionBoard';
import HrPortal from './components/HrPortal';

export default function App() {
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'public_action' | 'hr'
  const [hrUser, setHrUser] = useState(() => localStorage.getItem('hr_user') || '');

  const handleLoginSuccess = (user, token) => {
    setHrUser(user);
    localStorage.setItem('hr_user', user);
    localStorage.setItem('hr_token', token);
  };

  const handleLogout = () => {
    setHrUser('');
    localStorage.removeItem('hr_user');
    localStorage.removeItem('hr_token');
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hrUser={hrUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === 'employee' && (
          <EmployeePortal onSubmissionSuccess={() => {}} />
        )}

        {activeTab === 'public_action' && (
          <PublicActionBoard />
        )}

        {activeTab === 'hr' && (
          <HrPortal
            hrUser={hrUser}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>

      {/* Clean, professional product footer */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-delicate)',
        padding: '20px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>Equilibrium</strong> · Anonymous Workplace Wellness Platform
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--brand-sage)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('public_action')}>Public Action Board</span>
            <span>·</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('hr')}>HR Portal</span>
            <span>·</span>
            <span style={{ color: 'var(--text-muted)' }}>Zero-Knowledge Privacy Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
