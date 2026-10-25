// src/components/EmployeePortal.jsx
import React, { useState } from 'react';
import {
  Frown,
  Meh,
  Smile,
  Shield,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  RefreshCw
} from 'lucide-react';

// Black / monochrome expression faces (No yellow emojis)
const MOOD_OPTIONS = [
  { level: 1, label: 'Sad / Drained', icon: Frown, symbol: '☹' },
  { level: 2, label: 'Low Energy', icon: Frown, symbol: '🙁' },
  { level: 3, label: 'Medium / Neutral', icon: Meh, symbol: '😐' },
  { level: 4, label: 'Good', icon: Smile, symbol: '🙂' },
  { level: 5, label: 'Happy / Energized', icon: Smile, symbol: '☻' }
];

const DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Marketing & Comms',
  'Operations',
  'Sales',
  'People / HR',
  'Finance',
  'General'
];

export default function EmployeePortal({ onSubmissionSuccess }) {
  const [streamType, setStreamType] = useState('daily_summary'); // 'daily_summary' | 'targeted_incident'
  const [department, setDepartment] = useState('Engineering');
  
  // Daily Summary fields
  const [energyLevel, setEnergyLevel] = useState(3);
  const [achievements, setAchievements] = useState('');
  const [blockers, setBlockers] = useState('');
  const [otherText, setOtherText] = useState('');
  
  // Targeted Incident fields
  const [category, setCategory] = useState('Process Bottleneck');
  const [severity, setSeverity] = useState('medium');
  const [incidentText, setIncidentText] = useState('');

  // AI Neutralization State
  const [isNeutralizing, setIsNeutralizing] = useState(false);
  const [neutralizedResult, setNeutralizedResult] = useState(null);
  const [formError, setFormError] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  const getRawContent = () => {
    if (streamType === 'daily_summary') {
      const parts = [];
      if (achievements.trim()) parts.push(`Today's Achievements & Wins:\n${achievements}`);
      if (blockers.trim()) parts.push(`Operational Friction & Draining Events:\n${blockers}`);
      if (otherText.trim()) parts.push(`Other Notes:\n${otherText}`);
      return parts.join('\n\n');
    }
    return incidentText;
  };

  const handlePreviewSubmission = async () => {
    const raw = getRawContent();
    if (!raw.trim()) {
      setFormError('Please enter some text before previewing.');
      return;
    }

    setFormError('');
    setIsNeutralizing(true);
    try {
      const response = await fetch('/api/neutralize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: raw,
          context: streamType
        })
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      setNeutralizedResult(data);
    } catch (err) {
      console.error('Neutralize error:', err);
      setFormError('Could not process preview. You can still submit directly.');
    } finally {
      setIsNeutralizing(false);
    }
  };

  const handleSubmit = async () => {
    const raw = getRawContent();
    if (!raw.trim()) {
      setFormError('Please enter some text before submitting.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      let finalNeutralized = neutralizedResult?.neutralizedText;
      let finalRedacted = neutralizedResult?.redactedItems || [];

      // If user clicks Submit directly without previewing first, neutralize on the fly
      if (!finalNeutralized) {
        const neutRes = await fetch('/api/neutralize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: raw, context: streamType })
        });
        const neutData = await neutRes.json();
        finalNeutralized = neutData.neutralizedText || raw;
        finalRedacted = neutData.redactedItems || [];
      }

      const payload = {
        type: streamType,
        department,
        energyLevel: streamType === 'daily_summary' ? energyLevel : 3,
        achievements: streamType === 'daily_summary' ? achievements : '',
        blockers: streamType === 'daily_summary' ? blockers : '',
        other: streamType === 'daily_summary' ? otherText : '',
        neutralizedContent: finalNeutralized,
        redactedItems: finalRedacted,
        category: streamType === 'targeted_incident' ? category : 'Daily Summary',
        severity: streamType === 'targeted_incident' ? severity : 'low'
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (resData.success) {
        setSubmittedReceipt({
          id: resData.submissionId,
          timestamp: resData.timestamp,
          affectiveValence: resData.affectiveValence,
          cognitiveStrain: resData.cognitiveStrain
        });
        // Clear inputs
        setAchievements('');
        setBlockers('');
        setOtherText('');
        setIncidentText('');
        setNeutralizedResult(null);
        if (onSubmissionSuccess) onSubmissionSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setFormError('Failed to record submission: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>

      {/* Submission Success Dialog */}
      {submittedReceipt && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid var(--brand-sage)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 24,
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-forest)', marginBottom: 8 }}>
            <CheckCircle2 size={24} color="var(--brand-forest)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Submission Received</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Thank you for sharing your voice. Your submission has been securely processed and sent to the HR Action Board.
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--bg-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: 16
          }}>
            Reference ID: <strong style={{ color: 'var(--brand-forest)' }}>{submittedReceipt.id}</strong>
          </div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => setSubmittedReceipt(null)}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              Submit Another Entry
            </button>
          </div>
        </div>
      )}

      {/* Input Form Card */}
      <div className="card">
        {/* Stream Selector Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button
            type="button"
            className={`btn ${streamType === 'daily_summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStreamType('daily_summary'); setNeutralizedResult(null); }}
            style={{ flex: 1, padding: '12px' }}
          >
            Daily Work Summaries
          </button>
          <button
            type="button"
            className={`btn ${streamType === 'targeted_incident' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStreamType('targeted_incident'); setNeutralizedResult(null); }}
            style={{ flex: 1, padding: '12px' }}
          >
            A Targeted Incident
          </button>
        </div>

        {/* Department field */}
        <div className="input-group">
          <label className="input-label" htmlFor="dept-select">
            Department
          </label>
          <select
            id="dept-select"
            className="input-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Mode 1: Daily Work Summaries */}
        {streamType === 'daily_summary' && (
          <div>
            {/* Daily Emotional Energy & Battery Level */}
            <div className="input-group" style={{ marginBottom: 22 }}>
              <label className="input-label">
                Daily Emotional Energy &amp; Battery Level
              </label>
              <div className="energy-cards-grid">
                {MOOD_OPTIONS.map(item => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      className={`energy-option-btn ${energyLevel === item.level ? 'selected' : ''}`}
                      onClick={() => setEnergyLevel(item.level)}
                    >
                      {/* Black monochrome face */}
                      <div style={{ fontSize: '1.6rem', color: '#1C2621', lineHeight: 1 }}>
                        <IconComponent size={24} strokeWidth={2.2} color="#1C2621" />
                      </div>
                      <div className="energy-level-number" style={{ color: '#1C2621' }}>
                        Level {item.level}
                      </div>
                      <div className="energy-level-label">
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Achievements & Wins */}
            <div className="input-group">
              <label className="input-label" htmlFor="achievements-input">
                Today's Achievements and Wins
              </label>
              <textarea
                id="achievements-input"
                className="input-textarea"
                rows={3}
                placeholder="What went well today? What did you accomplish or enjoy?"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
              />
            </div>

            {/* Operational Friction & Draining Events */}
            <div className="input-group">
              <label className="input-label" htmlFor="blockers-input">
                Operational Friction and Draining Events
              </label>
              <textarea
                id="blockers-input"
                className="input-textarea"
                rows={3}
                placeholder="What drained your energy, slowed down work, or caused frustration?"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
              />
            </div>

            {/* Other (Optional) */}
            <div className="input-group">
              <label className="input-label" htmlFor="other-input">
                Other
                <span className="input-hint">(Optional: share any other thoughts, updates, or notes here)</span>
              </label>
              <textarea
                id="other-input"
                className="input-textarea"
                rows={2}
                placeholder="Any other comments or context you'd like to share..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Mode 2: A Targeted Incident */}
        {streamType === 'targeted_incident' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="category-select">Category</label>
                <select
                  id="category-select"
                  className="input-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Process Bottleneck">Process Bottleneck</option>
                  <option value="Cross-Team Friction">Cross-Team Friction</option>
                  <option value="Tooling & Infrastructure">Tooling &amp; Infrastructure</option>
                  <option value="Culture & Team Health">Culture &amp; Team Health</option>
                  <option value="Direction & Communication">Direction &amp; Communication</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="severity-select">Severity Level</label>
                <select
                  id="severity-select"
                  className="input-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="low">Low (Minor friction)</option>
                  <option value="medium">Medium (Recurring operational delay)</option>
                  <option value="high">High (Critical blocker or concern)</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="incident-text-input">
                Incident Description
                <span className="input-hint">(Feel free to name colleagues like Matthew if relevant; only your own identity is kept confidential)</span>
              </label>
              <textarea
                id="incident-text-input"
                className="input-textarea"
                rows={5}
                placeholder="Describe what occurred, who was involved, and the impact..."
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Form Error Notice */}
        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--accent-clay)',
            backgroundColor: 'var(--accent-clay-soft)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            margin: '14px 0'
          }}>
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        {/* Preview Submission & Submit Buttons TOGETHER */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
          paddingTop: 18,
          borderTop: '1px solid var(--border-delicate)',
          alignItems: 'center'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePreviewSubmission}
            disabled={isNeutralizing || !getRawContent().trim()}
            id="btn-preview-submission"
            style={{ padding: '10px 20px' }}
          >
            {isNeutralizing ? (
              <>
                <RefreshCw size={15} className="spin-icon" />
                Preparing Preview...
              </>
            ) : (
              <>
                <Eye size={15} />
                Preview Submission
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !getRawContent().trim()}
            id="btn-submit-directly"
            style={{ padding: '10px 26px' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
            <Send size={15} />
          </button>
        </div>

        {/* Side-by-Side Preview (Only shown if user clicked Preview Submission) */}
        {neutralizedResult && (
          <div className="safeview-container" style={{ marginTop: 24 }}>
            <div className="safeview-header">
              <div className="safeview-badge">
                <Shield size={14} />
                Submission Preview
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--brand-sage)', fontWeight: 600 }}>
                Submitter Identity Protected
              </span>
            </div>

            <div className="safeview-grid">
              <div className="safeview-col">
                <div className="safeview-label">
                  Your Original Text:
                </div>
                <div className="safeview-box-raw">
                  {getRawContent()}
                </div>
              </div>

              <div className="safeview-col">
                <div className="safeview-label">
                  What HR Will Receive (Neutralized Phrasing):
                </div>
                <div className="safeview-box-neutralized">
                  {neutralizedResult.neutralizedText}
                </div>
              </div>
            </div>

            {neutralizedResult.redactedItems && neutralizedResult.redactedItems.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Privacy &amp; Phrasing Adjustments:
                </div>
                <div className="redactions-list">
                  {neutralizedResult.redactedItems.map((item, idx) => (
                    <span key={idx} className="redaction-pill">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
