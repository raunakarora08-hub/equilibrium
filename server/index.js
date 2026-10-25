// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  neutralizeFeedback,
  analyzeAffectiveMetrics,
  generateSemanticClusters,
  discussProblemsWithAI
} from './geminiService.js';
import {
  getAllSubmissions,
  addSubmission,
  getAnalyticsMetrics,
  getClusters,
  updateClusters,
  getAllActions,
  addAction,
  updateAction
} from './dataStore.js';

import { initializeDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize PostgreSQL if DATABASE_URL or POSTGRES_URL is provided
initializeDatabase().catch(err => console.error('DB init error:', err.message));

app.use(cors());
app.use(express.json());

// Zero-knowledge header stripping middleware
app.use((req, res, next) => {
  // Strip any client identifying IP or tracking headers before processing
  delete req.headers['x-forwarded-for'];
  delete req.headers['user-agent'];
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Anonymous AI Workplace Wellness & Climate Analytics',
    workingGroup: 'A7',
    geminiConfigured: !!(process.env.GEMINI_API_KEY)
  });
});

/**
 * Feature 2: AI Anonymity & Writing Neutralizer Endpoint
 * Takes raw candid text and returns:
 * - Sanitized neutralized text
 * - Redacted PII list
 * - Stylometric adjustments
 * - Privacy score
 */
app.post('/api/neutralize', async (req, res) => {
  try {
    const { rawText, context } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const result = await neutralizeFeedback(rawText, context);
    res.json(result);
  } catch (err) {
    console.error('Error during neutralization:', err);
    res.status(500).json({ error: 'Failed to neutralize text: ' + err.message });
  }
});

/**
 * Feature 1: Dual Anonymous Employee Portal Submission
 * Handles Daily Work Summaries and Targeted Friction Feedback.
 * Automatically runs Affective Events Theory (AET) sentiment & cognitive strain analysis.
 */
app.post('/api/submit', async (req, res) => {
  try {
    const payload = req.body;
    const textToAnalyze = payload.neutralizedContent || payload.neutralizedText || payload.blockers || payload.achievements || '';

    // Run Affective Events Theory analysis
    const metrics = await analyzeAffectiveMetrics(textToAnalyze, payload.energyLevel || 3);

    const saved = addSubmission({
      ...payload,
      sentimentScore: metrics.sentimentScore,
      cognitiveStrain: metrics.cognitiveStrain,
      affectiveValence: metrics.affectiveValence
    });

    res.json({
      success: true,
      submissionId: saved.id,
      timestamp: saved.timestamp,
      affectiveValence: saved.affectiveValence,
      cognitiveStrain: saved.cognitiveStrain
    });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Failed to record anonymous submission: ' + err.message });
  }
});

// HR Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const validUser = (username || '').trim().toLowerCase() === 'raunak';
  const validPass = (password || '').trim() === 'Raunak123' || (password || '').trim().toLowerCase() === 'raunak123';

  if (validUser && validPass) {
    return res.json({
      success: true,
      token: 'hr-auth-session-raunak',
      user: 'Raunak'
    });
  }
  return res.status(401).json({
    success: false,
    error: 'Invalid HR credentials. Access restricted to authorized personnel (ID: Raunak, Pass: Raunak123).'
  });
});

/**
 * Feature 3: Real-Time HR Analytics Dashboard Metrics
 * Supports ?timeframe=day|week|month
 */
app.get('/api/analytics', (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'day';
    const metrics = getAnalyticsMetrics(timeframe);
    res.json(metrics);
  } catch (err) {
    console.error('Error getting analytics:', err);
    res.status(500).json({ error: 'Failed to load analytics: ' + err.message });
  }
});

/**
 * Sanitized Submissions Feed (Only returns PII-scrubbed, neutralized content)
 */
app.get('/api/submissions', (req, res) => {
  try {
    const all = getAllSubmissions();
    // Safety guarantee: Ensure no raw text ever leaves the server
    const sanitized = all.map(s => ({
      id: s.id,
      type: s.type,
      timestamp: s.timestamp,
      department: s.department,
      energyLevel: s.energyLevel,
      rhythmTags: s.rhythmTags,
      neutralizedContent: s.neutralizedContent,
      redactedItems: s.redactedItems,
      sentimentScore: s.sentimentScore,
      cognitiveStrain: s.cognitiveStrain,
      affectiveValence: s.affectiveValence,
      category: s.category,
      severity: s.severity
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sanitized submissions' });
  }
});

/**
 * Feature 4: Automated Problem Highlighting (Weekly Hurdles & Monthly Bottlenecks)
 */
app.get('/api/clusters', (req, res) => {
  try {
    const clusters = getClusters();
    res.json(clusters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve clusters' });
  }
});

app.post('/api/clusters/regenerate', async (req, res) => {
  try {
    const submissions = getAllSubmissions();
    const newClusters = await generateSemanticClusters(submissions);
    if (newClusters) {
      updateClusters(newClusters);
      res.json({ success: true, clusters: newClusters });
    } else {
      res.json({ success: false, clusters: getClusters(), message: 'Retained previous clusters' });
    }
  } catch (err) {
    console.error('Error regenerating clusters:', err);
    res.status(500).json({ error: 'Failed to regenerate clusters: ' + err.message });
  }
});

/**
 * Action & Resolution Tracker ("Closing the Loop")
 */
app.get('/api/actions', (req, res) => {
  try {
    const actions = getAllActions();
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve actions' });
  }
});

app.post('/api/actions', (req, res) => {
  try {
    const action = addAction(req.body);
    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

app.patch('/api/actions/:id', (req, res) => {
  try {
    const updated = updateAction(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Action not found' });
    res.json({ success: true, action: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

/**
 * Interactive HR Problem Discussion with Gemini AI
 */
app.post('/api/hr-discuss', async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const submissions = getAllSubmissions();
    const clusters = getClusters();
    const result = await discussProblemsWithAI(message, submissions, clusters, chatHistory || []);
    res.json(result);
  } catch (err) {
    console.error('Error in HR discussion:', err);
    res.status(500).json({ error: 'Failed to process discussion: ' + err.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌿 Equilibrium Wellness & Climate Server running on http://localhost:${PORT}`);
  });
}

export default app;
