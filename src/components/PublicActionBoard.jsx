// src/components/PublicActionBoard.jsx
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock3,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers
} from 'lucide-react';

export default function PublicActionBoard() {
  const [actions, setActions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/actions');
      const data = await res.json();
      setActions(data);
    } catch (err) {
      console.error('Error fetching public actions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const filteredActions = actions.filter(action => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      action.clusterTitle?.toLowerCase().includes(q) ||
      action.actionDescription?.toLowerCase().includes(q) ||
      action.publicNote?.toLowerCase().includes(q) ||
      action.assignedTo?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-sage)', marginBottom: 4 }}>
            <CheckCircle size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Public Company Transparency
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-forest)', letterSpacing: '-0.02em' }}>
            Company Action Board
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Track real management interventions and status updates in response to anonymous employee feedback.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search actions or fixes..."
              className="input-textarea"
              style={{
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-pill)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={fetchActions}
            style={{ fontSize: '0.8rem', padding: '8px 12px', flexShrink: 0 }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        marginBottom: 24
      }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-delicate)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Under Investigation
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-forest)', marginTop: 2 }}>
            {actions.filter(a => a.status === 'Under Review').length} Items
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            HR assessing reports &amp; operational context
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-delicate)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-amber)' }}>
            Solutions In Progress
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-forest)', marginTop: 2 }}>
            {actions.filter(a => a.status === 'In Progress').length} Items
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            Squads actively addressing infrastructure/processes
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-delicate)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>
            Action Deployed
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-forest)', marginTop: 2 }}>
            {actions.filter(a => a.status === 'Action Deployed' || a.status === 'Resolved').length} Items
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            Policy or technical changes officially live
          </div>
        </div>
      </div>

      {/* Action Columns */}
      <div className="action-board-grid">
        {['Under Review', 'In Progress', 'Action Deployed'].map(columnStatus => {
          const colActions = filteredActions.filter(a => a.status === columnStatus);
          return (
            <div key={columnStatus} className="action-column">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-delicate)' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                  {columnStatus}
                </span>
                <span style={{ fontSize: '0.74rem', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                  {colActions.length}
                </span>
              </div>

              {colActions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  No actions currently in this stage.
                </div>
              ) : (
                colActions.map(action => (
                  <div key={action.id} className="action-card">
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                      {action.clusterTitle}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {action.actionDescription}
                    </p>
                    {action.publicNote && (
                      <div style={{
                        fontSize: '0.76rem',
                        backgroundColor: 'var(--bg-tint-sage)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--brand-forest)',
                        lineHeight: 1.4
                      }}>
                        <strong>Workforce Notice:</strong> {action.publicNote}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Owner: <strong>{action.assignedTo}</strong></span>
                      <span className="severity-pill" style={{
                        backgroundColor: columnStatus === 'Action Deployed' ? 'var(--accent-emerald-soft)' : columnStatus === 'In Progress' ? 'var(--accent-amber-soft)' : 'var(--bg-tint-sage)',
                        color: columnStatus === 'Action Deployed' ? 'var(--accent-emerald)' : columnStatus === 'In Progress' ? 'var(--accent-amber)' : 'var(--brand-sage)'
                      }}>
                        {columnStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
