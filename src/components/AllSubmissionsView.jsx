// src/components/AllSubmissionsView.jsx
import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Frown,
  Meh,
  Smile,
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  Zap,
  TrendingUp,
  Tag
} from 'lucide-react';

const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Operations',
  'Product & Design',
  'Marketing',
  'Sales',
  'Customer Support',
  'People & HR',
  'General'
];

const AI_TAGS = [
  'All Tags',
  'Deep Focus',
  'Cross-Team Friction',
  'Process Bottleneck',
  'Tooling & Infrastructure',
  'Meeting Overload',
  'Direction & Alignment',
  'Workplace Environment',
  'Culture & Team Health'
];

export default function AllSubmissionsView({ submissions = [], onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'daily_summary' | 'targeted_incident'
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedTag, setSelectedTag] = useState('All Tags');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'strain_high' | 'morale_high' | 'productivity_high'

  // Filter logic
  const filteredSubmissions = submissions.filter(s => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = (s.neutralizedContent || s.blockers || s.achievements || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      if (!content.includes(q) && !dept.includes(q) && !cat.includes(q)) {
        return false;
      }
    }

    // Type filter
    if (selectedType !== 'all' && s.type !== selectedType) {
      return false;
    }

    // Department filter
    if (selectedDept !== 'All Departments' && s.department !== selectedDept) {
      return false;
    }

    // AI Tag filter
    if (selectedTag !== 'All Tags' && s.category !== selectedTag) {
      return false;
    }

    return true;
  });

  // Sort logic
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
    }
    if (sortBy === 'strain_high') {
      return (b.cognitiveStrain || 0) - (a.cognitiveStrain || 0);
    }
    if (sortBy === 'morale_high') {
      return (b.energyLevel || 0) - (a.energyLevel || 0);
    }
    if (sortBy === 'productivity_high') {
      return (b.productivityScore || 0) - (a.productivityScore || 0);
    }
    return 0;
  });

  const getMoodIcon = (level) => {
    if (level <= 2) return <Frown size={16} color="#1C2621" />;
    if (level === 3) return <Meh size={16} color="#1C2621" />;
    return <Smile size={16} color="#1C2621" />;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBack}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            <ArrowLeft size={16} />
            Back to HR Dashboard
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-forest)', letterSpacing: '-0.02em' }}>
              All Anonymous Submissions
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Inspect and filter all 20 employee entries across departments, AI tags, and strain levels.
            </p>
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--brand-forest)', fontWeight: 600, backgroundColor: 'var(--bg-tint-sage)', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}>
          Showing {sortedSubmissions.length} of {submissions.length} Submissions
        </div>
      </div>

      {/* Filter and Search Bar Controls Card */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            placeholder="Search all submissions by keyword, colleague name (e.g. Matthew, Chloe, Alex), or blocker..."
            className="input-textarea"
            style={{
              height: 42,
              paddingLeft: 38,
              paddingRight: 14,
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-pill)'
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {/* Submission Type */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Submission Type
            </label>
            <select
              className="input-select"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="daily_summary">Daily Work Summaries</option>
              <option value="targeted_incident">Targeted Incidents</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Department
            </label>
            <select
              className="input-select"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* AI Automated Tag */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              AI Automated Tag
            </label>
            <select
              className="input-select"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              {AI_TAGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Sort Order
            </label>
            <select
              className="input-select"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="strain_high">Highest Cognitive Strain</option>
              <option value="morale_high">Highest Energy / Morale</option>
              <option value="productivity_high">Highest Productivity</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedType !== 'all' || selectedDept !== 'All Departments' || selectedTag !== 'All Tags') && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.76rem', padding: '4px 12px' }}
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedDept('All Departments');
                setSelectedTag('All Tags');
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sortedSubmissions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.92rem' }}>No submissions matched the selected criteria.</p>
          </div>
        ) : (
          sortedSubmissions.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '20px 24px',
                border: '1px solid var(--border-delicate)',
                transition: 'all var(--transition-smooth)'
              }}
            >
              {/* Card Header Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Type Badge */}
                  <span className="brand-badge" style={{
                    backgroundColor: item.type === 'targeted_incident' ? 'var(--accent-clay-soft)' : 'var(--bg-tint-sage)',
                    color: item.type === 'targeted_incident' ? 'var(--accent-clay)' : 'var(--brand-forest)'
                  }}>
                    {item.type === 'targeted_incident' ? 'Targeted Incident' : 'Daily Work Summary'}
                  </span>

                  {/* Department */}
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-forest)', backgroundColor: '#FFFFFF', padding: '3px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-delicate)' }}>
                    {item.department || 'General'}
                  </span>

                  {/* AI Automated Tag */}
                  {item.category && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--brand-sage)', backgroundColor: 'var(--bg-subtle)', padding: '3px 10px', borderRadius: 'var(--radius-pill)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={12} />
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Date & Mood */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem' }}>
                  {/* Mood Face */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1C2621' }} title={`Energy Level: ${item.energyLevel || 3}/5`}>
                    {getMoodIcon(item.energyLevel || 3)}
                    <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>Lvl {item.energyLevel || 3}</span>
                  </div>

                  {/* Strain Indicator */}
                  <span style={{
                    color: (item.cognitiveStrain || 0) > 60 ? 'var(--accent-clay)' : 'var(--brand-sage)',
                    fontWeight: 700
                  }}>
                    Strain: {item.cognitiveStrain || 40}/100
                  </span>

                  {/* Date */}
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.timestamp ? item.timestamp.slice(0, 10) : ''}
                  </span>
                </div>
              </div>

              {/* Neutralized Content */}
              <div style={{
                fontSize: '0.92rem',
                color: 'var(--brand-forest)',
                lineHeight: 1.6,
                fontWeight: 500,
                marginBottom: item.achievements || item.blockers ? 12 : 0
              }}>
                {item.neutralizedContent || item.blockers || item.achievements}
              </div>

              {/* Achievements & Blockers Detail (if available) */}
              {(item.achievements || item.blockers) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: item.achievements && item.blockers ? '1fr 1fr' : '1fr',
                  gap: 12,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-delicate)',
                  fontSize: '0.8rem'
                }}>
                  {item.achievements && (
                    <div style={{ backgroundColor: 'var(--bg-tint-sage)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ color: 'var(--brand-forest)' }}>Wins:</strong> {item.achievements}
                    </div>
                  )}
                  {item.blockers && (
                    <div style={{ backgroundColor: 'var(--bg-tint-clay)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ color: 'var(--accent-clay)' }}>Blockers:</strong> {item.blockers}
                    </div>
                  )}
                </div>
              )}

              {/* Redaction notes */}
              {item.redactedItems && item.redactedItems.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.redactedItems.map((r, ri) => (
                    <span key={ri} className="redaction-pill" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      🛡️ {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
