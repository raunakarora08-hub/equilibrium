// src/components/HrPortal.jsx
import React, { useState, useEffect } from 'react';
import {
  Heart,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  RefreshCw,
  PlusCircle,
  Lock,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  Send,
  Zap,
  FileText,
  Check
} from 'lucide-react';
import AllSubmissionsView from './AllSubmissionsView';

export default function HrPortal({ hrUser, onLoginSuccess }) {
  // Login form state
  const [loginId, setLoginId] = useState('Raunak');
  const [loginPassword, setLoginPassword] = useState('Raunak123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [metrics, setMetrics] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [actions, setActions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [clusterNotice, setClusterNotice] = useState('');

  // Toggle View State: Main Dashboard vs. "See All Submissions"
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);

  // Sorting & Filtering for the Graph
  const [timeframe, setTimeframe] = useState('3month'); // 'day' | 'week' | '1month' | '3month'
  const [activeMetric, setActiveMetric] = useState('both'); // 'both' | 'morale' | 'strain' | 'productivity'

  // AI Problem Discussion Assistant State
  const [discussionInput, setDiscussionInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "Hello Raunak! I'm your AI Strategic HR Advisor. You can ask me to analyze any problems employees are facing, discuss specific colleagues mentioned (like Matthew in Sales), or brainstorm action plans to post to the Action Board.",
      actionProposal: null
    }
  ]);
  const [isDiscussing, setIsDiscussing] = useState(false);

  // New action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');
  const [newActionAssignedTo, setNewActionAssignedTo] = useState('People Operations');
  const [newActionNote, setNewActionNote] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginId.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Login request failed: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchDashboardData = async (selectedTimeframe = timeframe) => {
    if (!hrUser) return;
    setIsLoading(true);
    try {
      const [metricsRes, clustersRes, actionsRes, subsRes] = await Promise.all([
        fetch(`/api/analytics?timeframe=${selectedTimeframe}`),
        fetch('/api/clusters'),
        fetch('/api/actions'),
        fetch('/api/submissions')
      ]);

      const metricsData = await metricsRes.json();
      const clustersData = await clustersRes.json();
      const actionsData = await actionsRes.json();
      const subsData = await subsRes.json();

      setMetrics(metricsData);
      setClusters(clustersData);
      setActions(actionsData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Error loading HR data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hrUser) {
      fetchDashboardData(timeframe);
    }
  }, [hrUser, timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    fetchDashboardData(newTimeframe);
  };

  const handleRegenerateClusters = async () => {
    setIsClustering(true);
    setClusterNotice('');
    try {
      const res = await fetch('/api/clusters/regenerate', { method: 'POST' });
      const data = await res.json();
      if (data.clusters) {
        setClusters(data.clusters);
        setClusterNotice('✓ Problem clusters updated via Gemini AI.');
      }
    } catch (err) {
      console.error('Cluster regeneration error:', err);
      setClusterNotice('Notice: Cluster update encountered a delay.');
    } finally {
      setIsClustering(false);
    }
  };

  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = customPrompt || discussionInput;
    if (!textToSend.trim() || isDiscussing) return;

    const newHistory = [...chatMessages, { role: 'user', text: textToSend, actionProposal: null }];
    setChatMessages(newHistory);
    setDiscussionInput('');
    setIsDiscussing(true);

    try {
      const res = await fetch('/api/hr-discuss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: newHistory.slice(-6)
        })
      });

      const data = await res.json();
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          text: data.reply || 'No response generated.',
          actionProposal: data.actionProposal || null,
          actionPublished: false
        }
      ]);
    } catch (err) {
      console.error('HR discuss error:', err);
      setChatMessages([...newHistory, { role: 'assistant', text: 'Error communicating with AI advisor. Please try again.' }]);
    } finally {
      setIsDiscussing(false);
    }
  };

  // AI Action Proposal to Action Board handler
  const handlePublishProposedAction = async (proposal, msgIndex) => {
    if (!proposal) return;
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterTitle: proposal.title,
          actionDescription: proposal.description,
          assignedTo: proposal.assignedTo || 'Operations & HR Squad',
          publicNote: proposal.publicNote || '',
          status: proposal.status || 'In Progress'
        })
      });
      const data = await res.json();
      if (data.action) {
        setActions([data.action, ...actions]);
        setChatMessages(prev => prev.map((m, idx) => idx === msgIndex ? { ...m, actionPublished: true } : m));
      }
    } catch (err) {
      console.error('Error publishing proposed action:', err);
    }
  };

  const handleStatusChange = async (actionId, newStatus) => {
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.action) {
        setActions(actions.map(a => a.id === actionId ? data.action : a));
      }
    } catch (err) {
      console.error('Action update error:', err);
    }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterTitle: newActionTitle,
          actionDescription: newActionDescription,
          assignedTo: newActionAssignedTo,
          publicNote: newActionNote,
          status: 'Under Review'
        })
      });
      const data = await res.json();
      if (data.action) {
        setActions([data.action, ...actions]);
        setShowActionModal(false);
        setNewActionTitle('');
        setNewActionDescription('');
        setNewActionNote('');
      }
    } catch (err) {
      console.error('Create action error:', err);
    }
  };

  // If not logged in, render HR Portal Login
  if (!hrUser) {
    return (
      <div style={{ maxWidth: 440, margin: '48px auto' }}>
        <div className="card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tint-sage)',
              color: 'var(--brand-forest)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-forest)' }}>
              HR Portal
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Sign in with your HR credentials to review workplace analytics, discuss employee problems, and manage company actions.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-id">
                HR User ID
              </label>
              <input
                id="login-id"
                type="text"
                className="input-textarea"
                style={{ height: 42, padding: '10px 14px' }}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Raunak"
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="input-textarea"
                style={{ height: 42, padding: '10px 14px' }}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Raunak123"
                required
              />
            </div>

            {loginError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--accent-clay)',
                backgroundColor: 'var(--accent-clay-soft)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: 16
              }}>
                <ShieldAlert size={15} />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
              disabled={isLoggingIn}
              id="btn-hr-login"
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In to HR Portal'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If user clicked "See All Submissions", render the dedicated directory view
  if (showAllSubmissions) {
    return (
      <AllSubmissionsView
        submissions={submissions}
        onBack={() => setShowAllSubmissions(false)}
      />
    );
  }

  const trajectoryPoints = metrics?.dailyMoraleTrajectories || [];

  return (
    <div>
      {/* Top Header with "See All Submissions" Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-forest)', letterSpacing: '-0.02em' }}>
            HR Portal
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Workspace for HR Lead Raunak · Analytics, AI Problem Discussion, and Interventions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Prominent "See All Submissions" Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAllSubmissions(true)}
            style={{ fontSize: '0.84rem', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
            id="btn-see-all-submissions"
          >
            <FileText size={16} />
            See All Submissions ({submissions.length})
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => fetchDashboardData(timeframe)}
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <RefreshCw size={14} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Vital Signs KPI Row (including Productivity) */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Rolling Happiness</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-tint-sage)', color: 'var(--brand-sage)' }}>
              <Heart size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics?.rollingHappiness || 75}%</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-emerald)' }}>
            <TrendingUp size={14} />
            <span>Average morale baseline</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Productivity Rate</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-tint-sky)', color: 'var(--accent-teal)' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics?.rollingProductivity || 72}%</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-teal)' }}>
            <span>Operational throughput</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Cognitive Strain</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-tint-clay)', color: 'var(--accent-clay)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: metrics?.avgCognitiveStrain > 55 ? 'var(--accent-clay)' : 'var(--brand-forest)' }}>
            {metrics?.avgCognitiveStrain || 42}/100
          </div>
          <div className="kpi-subtext">
            <span className="severity-pill" style={{
              backgroundColor: metrics?.avgCognitiveStrain > 60 ? 'var(--accent-clay-soft)' : 'var(--bg-tint-sage)',
              color: metrics?.avgCognitiveStrain > 60 ? 'var(--accent-clay)' : 'var(--brand-sage)'
            }}>
              {metrics?.burnoutRiskLevel || 'Moderate'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Voice Volume</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-tint-sage)', color: 'var(--brand-sage)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics?.engagementRate || 88}%</div>
          <div className="kpi-subtext" style={{ color: 'var(--text-secondary)' }}>
            <span>{metrics?.participationCount || 0} reports processed</span>
          </div>
        </div>
      </div>

      {/* Interactive Trends Chart: Day, Week, 1 Month, 3 Month & Metrics: Morale, Strain, Productivity */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="card-title">
              <TrendingUp size={20} color="var(--brand-sage)" />
              Longitudinal Workplace Trends
            </div>
            <div className="card-description">
              Analyze organizational momentum across Day, Week, 1 Month, and 3 Month intervals.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Metric Selector: All Metrics | Morale | Strain | Productivity */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-delicate)' }}>
              <button
                type="button"
                className={`nav-tab-btn ${activeMetric === 'both' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setActiveMetric('both')}
              >
                All Metrics
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeMetric === 'morale' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setActiveMetric('morale')}
              >
                Morale
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeMetric === 'strain' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setActiveMetric('strain')}
              >
                Strain
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeMetric === 'productivity' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setActiveMetric('productivity')}
              >
                Productivity
              </button>
            </div>

            {/* Timeframe Selector: Day | Week | 1 Month | 3 Month */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-delicate)' }}>
              <button
                type="button"
                className={`nav-tab-btn ${timeframe === 'day' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => handleTimeframeChange('day')}
              >
                Day
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${timeframe === 'week' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => handleTimeframeChange('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${timeframe === '1month' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => handleTimeframeChange('1month')}
              >
                1 Month
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${timeframe === '3month' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => handleTimeframeChange('3month')}
              >
                3 Month
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic SVG Chart */}
        <div style={{ height: 230, width: '100%', position: 'relative' }}>
          <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {[20, 40, 60, 80, 100].map(v => {
              const y = 180 - (v * 1.5);
              return (
                <g key={v}>
                  <line x1="45" y1={y} x2="98%" y2={y} stroke="rgba(31, 63, 48, 0.06)" strokeDasharray="4 4" />
                  <text x="36" y={y + 4} fontSize="10" fill="#9CB0A6" textAnchor="end">{v}%</text>
                </g>
              );
            })}

            {trajectoryPoints.length > 0 && (() => {
              const pts = trajectoryPoints;
              const count = pts.length;
              const step = count > 1 ? 840 / (count - 1) : 400;

              const moralePath = pts.map((p, i) => {
                const x = 60 + i * step;
                const y = 180 - (Math.min(100, Math.max(0, p.moraleScore)) * 1.5);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              const strainPath = pts.map((p, i) => {
                const x = 60 + i * step;
                const y = 180 - (Math.min(100, Math.max(0, p.cognitiveStrain)) * 1.5);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              const prodPath = pts.map((p, i) => {
                const x = 60 + i * step;
                const y = 180 - (Math.min(100, Math.max(0, p.productivityScore || 70)) * 1.5);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              return (
                <>
                  {/* Morale Line */}
                  {(activeMetric === 'both' || activeMetric === 'morale') && (
                    <path d={moralePath} fill="none" stroke="var(--brand-forest)" strokeWidth="2.8" strokeLinecap="round" />
                  )}

                  {/* Strain Line */}
                  {(activeMetric === 'both' || activeMetric === 'strain') && (
                    <path d={strainPath} fill="none" stroke="var(--accent-clay)" strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round" />
                  )}

                  {/* Productivity Line */}
                  {(activeMetric === 'both' || activeMetric === 'productivity') && (
                    <path d={prodPath} fill="none" stroke="var(--accent-teal)" strokeWidth="2.2" strokeLinecap="round" />
                  )}

                  {/* Node points */}
                  {pts.map((p, i) => {
                    const x = 60 + i * step;
                    const ym = 180 - (p.moraleScore * 1.5);
                    const ys = 180 - (p.cognitiveStrain * 1.5);
                    const yp = 180 - ((p.productivityScore || 70) * 1.5);
                    return (
                      <g key={i}>
                        {(activeMetric === 'both' || activeMetric === 'morale') && (
                          <circle cx={x} cy={ym} r="5" fill="#FFFFFF" stroke="var(--brand-forest)" strokeWidth="2.5" />
                        )}
                        {(activeMetric === 'both' || activeMetric === 'strain') && (
                          <circle cx={x} cy={ys} r="4" fill="#FFFFFF" stroke="var(--accent-clay)" strokeWidth="2" />
                        )}
                        {(activeMetric === 'both' || activeMetric === 'productivity') && (
                          <rect x={x - 3.5} y={yp - 3.5} width="7" height="7" fill="#FFFFFF" stroke="var(--accent-teal)" strokeWidth="2" transform={`rotate(45 ${x} ${yp})`} />
                        )}
                        <text x={x} y="206" fontSize="11" fill="#485850" fontWeight="600" textAnchor="middle">
                          {p.label || p.date}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 14, justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
          {(activeMetric === 'both' || activeMetric === 'morale') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-forest)' }}>
              <span style={{ width: 14, height: 4, backgroundColor: 'var(--brand-forest)', borderRadius: 2 }}></span>
              Morale Index
            </span>
          )}
          {(activeMetric === 'both' || activeMetric === 'strain') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-clay)' }}>
              <span style={{ width: 14, height: 4, backgroundColor: 'var(--accent-clay)', borderRadius: 2 }}></span>
              Cognitive Strain
            </span>
          )}
          {(activeMetric === 'both' || activeMetric === 'productivity') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-teal)' }}>
              <span style={{ width: 14, height: 4, backgroundColor: 'var(--accent-teal)', borderRadius: 2 }}></span>
              Productivity Rate
            </span>
          )}
        </div>
      </div>

      {/* AI Problem Discussion Room with Action Board Creation */}
      <div className="card" style={{ marginBottom: 28, border: '1px solid rgba(42, 123, 136, 0.25)', backgroundColor: '#FAFCFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tint-sky)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                Discuss Workplace Problems with AI
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ask strategic questions about reports, named bottlenecks (e.g. Matthew in Sales), or brainstorm leadership resolutions.
              </p>
            </div>
          </div>
          <span className="brand-badge" style={{ backgroundColor: 'var(--bg-tint-sky)', color: 'var(--accent-teal)' }}>
            Gemini AI Advisor
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            "Why are people complaining about Matthew in Sales?",
            "What are the top tooling bottlenecks in Engineering?",
            "Suggest an action plan to fix meeting overload",
            "Create an action on the board for Sales pre-scoping"
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              className="tag-pill"
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              onClick={() => handleSendMessage(promptText)}
            >
              💬 {promptText}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-delicate)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          maxHeight: 340,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 14
        }}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div
                style={{
                  backgroundColor: msg.role === 'user' ? 'var(--brand-forest)' : 'var(--bg-subtle)',
                  color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.text}
              </div>

              {/* ACTION CREATION CARD: AI generates actionable proposal directly into HR Action Board */}
              {msg.actionProposal && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid var(--brand-sage)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--brand-sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ⚡ Proposed Leadership Action
                    </span>
                    <span className="brand-badge" style={{ fontSize: '0.68rem' }}>
                      Ready to Publish
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                    {msg.actionProposal.title}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {msg.actionProposal.description}
                  </p>

                  <div style={{ fontSize: '0.74rem', backgroundColor: 'var(--bg-tint-sage)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--brand-forest)' }}>
                    <strong>Workforce Notice:</strong> {msg.actionProposal.publicNote}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Assigned: <strong>{msg.actionProposal.assignedTo}</strong>
                    </span>

                    {msg.actionPublished ? (
                      <span style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Check size={14} />
                        Published to Action Board
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                        onClick={() => handlePublishProposedAction(msg.actionProposal, index)}
                      >
                        <PlusCircle size={14} />
                        Add to Action Board
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isDiscussing && (
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--bg-subtle)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <RefreshCw size={14} className="spin-icon" />
              AI is analyzing reports and generating leadership action...
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="input-textarea"
            style={{ height: 42, padding: '10px 14px', fontSize: '0.86rem' }}
            placeholder="Ask AI to discuss any problem or propose an action for the board..."
            value={discussionInput}
            onChange={(e) => setDiscussionInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0 18px', flexShrink: 0 }}
            onClick={() => handleSendMessage()}
            disabled={isDiscussing || !discussionInput.trim()}
          >
            <Send size={15} />
            Ask
          </button>
        </div>
      </div>

      {/* Automated Problem Highlighting (STACKED VERTICALLY: Top Weekly first, then Monthly) */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-forest)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--brand-sage)" />
              Automated Problem Highlighting
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Top weekly operational hurdles stacked first, followed by monthly systemic bottlenecks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {clusterNotice && (
              <span style={{ fontSize: '0.78rem', color: 'var(--brand-sage)', fontWeight: 600 }}>
                {clusterNotice}
              </span>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleRegenerateClusters}
              disabled={isClustering}
              style={{ fontSize: '0.8rem' }}
            >
              {isClustering ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  Regenerating with AI...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Update AI Clusters
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. TOP WEEKLY OPERATIONAL HURDLES (Full Width Stack) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                Top Weekly Operational Hurdles
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Immediate tactical friction points &amp; release blockers</span>
            </div>
            <span className="brand-badge">Weekly Priority</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(clusters?.weeklyHurdles || []).map(hurdle => (
              <div key={hurdle.id} className="cluster-item" style={{ marginBottom: 0 }}>
                <div className="cluster-top">
                  <div className="cluster-title">{hurdle.title}</div>
                  <span className={`severity-pill severity-${hurdle.severity?.toLowerCase()}`}>
                    {hurdle.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {hurdle.impactSummary}
                </p>
                <div style={{
                  fontSize: '0.76rem',
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  "{hurdle.sampleQuote}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>Category: <strong>{hurdle.category}</strong></span>
                  <span><strong>{hurdle.frequency}</strong> mentions this week</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. MONTHLY SYSTEMIC HURDLES (Full Width Stack Below) */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                Monthly Systemic Bottlenecks
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Chronic cross-team, structural, and culture patterns</span>
            </div>
            <span className="brand-badge" style={{ backgroundColor: 'var(--bg-tint-clay)', color: 'var(--accent-clay)' }}>
              Monthly Systemic
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(clusters?.monthlySystemicChallenges || []).map(challenge => (
              <div key={challenge.id} className="cluster-item" style={{ marginBottom: 0 }}>
                <div className="cluster-top">
                  <div className="cluster-title">{challenge.title}</div>
                  <span className={`severity-pill severity-${challenge.burnoutRisk === 'Severe' ? 'high' : 'moderate'}`}>
                    {challenge.burnoutRisk} Risk
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <strong>Root Cause:</strong> {challenge.underlyingRootCause}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--brand-sage)', backgroundColor: 'var(--bg-tint-sage)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Impact:</strong> {challenge.impactSummary || challenge.aetImplication}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Persisting for {challenge.persistenceWeeks} consecutive weeks
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Publish & Manage Interventions (Feeds the Public Action Board) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <CheckCircle size={20} color="var(--brand-sage)" />
              Manage Interventions (Public Action Board Feed)
            </div>
            <div className="card-description">
              Actions and notices published here are displayed publicly on the Company Action Board for all employees to see.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowActionModal(true)}
            style={{ fontSize: '0.82rem' }}
          >
            <PlusCircle size={15} />
            Post New Action
          </button>
        </div>

        {/* Modal for new action */}
        {showActionModal && (
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            marginBottom: 20
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-forest)', marginBottom: 12 }}>
              Publish Leadership Action
            </h4>
            <form onSubmit={handleCreateAction}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Target Issue / Action Title"
                  className="input-textarea"
                  style={{ height: 42, padding: '8px 12px' }}
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Owner / Squad"
                  className="input-textarea"
                  style={{ height: 42, padding: '8px 12px' }}
                  value={newActionAssignedTo}
                  onChange={(e) => setNewActionAssignedTo(e.target.value)}
                />
              </div>
              <textarea
                placeholder="Action Description (What is being implemented?)"
                className="input-textarea"
                rows={2}
                value={newActionDescription}
                onChange={(e) => setNewActionDescription(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <textarea
                placeholder="Public Workforce Notice (Note visible to employees on what is being done)"
                className="input-textarea"
                rows={2}
                value={newActionNote}
                onChange={(e) => setNewActionNote(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish to Action Board
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Action Board Columns */}
        <div className="action-board-grid">
          {['Under Review', 'In Progress', 'Action Deployed'].map(columnStatus => (
            <div key={columnStatus} className="action-column">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-delicate)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                  {columnStatus}
                </span>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                  {actions.filter(a => a.status === columnStatus).length}
                </span>
              </div>

              {actions.filter(a => a.status === columnStatus).map(action => (
                <div key={action.id} className="action-card">
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-forest)' }}>
                    {action.clusterTitle}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {action.actionDescription}
                  </p>
                  {action.publicNote && (
                    <div style={{ fontSize: '0.74rem', backgroundColor: 'var(--bg-tint-sage)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--brand-sage)' }}>
                      <strong>Workforce Notice:</strong> {action.publicNote}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{action.assignedTo}</span>
                    <select
                      value={action.status}
                      onChange={(e) => handleStatusChange(action.id, e.target.value)}
                      style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-delicate)' }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Action Deployed">Action Deployed</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
