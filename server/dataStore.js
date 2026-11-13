// server/dataStore.js
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { initialSubmissions, initialActions, defaultClusters } from './seedData.js';
import { pool, ensureDbInitialized, isPgConfigured } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe DATA_DIR: Use /tmp on Vercel to respect read-only serverless filesystem
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'equilibrium-data')
  : path.join(__dirname, 'data');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Graceful fallback if filesystem is strictly read-only
}

const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ACTIONS_FILE = path.join(DATA_DIR, 'actions.json');
const CLUSTERS_FILE = path.join(DATA_DIR, 'clusters.json');

function readJsonFile(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem safe fallback
  }
  return defaultData;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem safe fallback
  }
}

// Local JSON persistence, used only when no PostgreSQL connection string is configured
let submissions = readJsonFile(SUBMISSIONS_FILE, initialSubmissions);
let actions = readJsonFile(ACTIONS_FILE, initialActions);
let clusters = readJsonFile(CLUSTERS_FILE, defaultClusters);

/**
 * Returns true when PostgreSQL should be used. If a database is configured but
 * unreachable, throws instead of silently falling back to ephemeral storage,
 * so callers report the failure rather than "saving" data that is then lost.
 */
async function shouldUsePostgres() {
  if (!isPgConfigured()) return false;
  const ready = await ensureDbInitialized();
  if (!ready) {
    throw new Error('Database is configured but currently unreachable. Please try again.');
  }
  return true;
}

function toInt(value, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function rowToSubmission(r) {
  return {
    id: r.id,
    type: r.type,
    timestamp: toIso(r.timestamp),
    department: r.department,
    energyLevel: r.energy_level,
    rhythmTags: r.rhythm_tags || [],
    productivityScore: r.productivity_score,
    achievements: r.achievements,
    blockers: r.blockers,
    other: r.other_notes,
    neutralizedContent: r.neutralized_content,
    redactedItems: r.redacted_items || [],
    sentimentScore: parseFloat(r.sentiment_score || 0),
    cognitiveStrain: r.cognitive_strain,
    affectiveValence: r.affective_valence,
    category: r.category,
    severity: r.severity
  };
}

function rowToAction(r) {
  return {
    id: r.id,
    clusterTitle: r.cluster_title,
    actionDescription: r.action_description,
    assignedTo: r.assigned_to,
    status: r.status,
    publicNote: r.public_note,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at)
  };
}

export async function getAllSubmissions() {
  if (await shouldUsePostgres()) {
    const res = await pool.query('SELECT * FROM submissions ORDER BY timestamp DESC');
    return res.rows.map(rowToSubmission);
  }
  return submissions;
}

/**
 * Adds an anonymous submission.
 * Enforces Zero-Knowledge principles:
 * - No user-agent, IP, or user IDs are accepted or stored.
 * - Random timing jitter (±15 mins) is added to the timestamp to thwart correlation attacks.
 */
export async function addSubmission(submission) {
  // Apply timestamp jitter
  const now = new Date();
  const jitterMinutes = Math.floor(Math.random() * 30) - 15; // -15 to +15 mins
  now.setMinutes(now.getMinutes() + jitterMinutes);

  // Gemini may return decimals or strings; coerce to what the INT/NUMERIC columns accept
  const energy = clamp(toInt(submission.energyLevel, 3), 1, 5);
  const strain = clamp(toInt(submission.cognitiveStrain, 45), 0, 100);
  const sentiment = clamp(Number(submission.sentimentScore) || 0, -1, 1);
  const hasAchievements = (submission.achievements && submission.achievements.trim().length > 5) ? 15 : 0;
  const hasBlockers = (submission.blockers && submission.blockers.trim().length > 5) ? 10 : 0;
  const productivityScore = Math.max(20, Math.min(95, Math.round((energy * 16) + hasAchievements - (strain * 0.25) - hasBlockers + 10)));

  const cleanEntry = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: String(submission.type || 'daily_summary').slice(0, 50),
    timestamp: now.toISOString(),
    department: String(submission.department || 'General').slice(0, 100),
    energyLevel: energy,
    rhythmTags: Array.isArray(submission.rhythmTags) ? submission.rhythmTags : [],
    achievements: submission.achievements || '',
    blockers: submission.blockers || '',
    other: submission.other || '',
    neutralizedContent: submission.neutralizedContent || submission.neutralizedText || '',
    redactedItems: Array.isArray(submission.redactedItems) ? submission.redactedItems : [],
    sentimentScore: Math.round(sentiment * 100) / 100,
    cognitiveStrain: strain,
    productivityScore: productivityScore,
    affectiveValence: String(submission.affectiveValence || 'Neutral').slice(0, 50),
    category: String(submission.category || 'General').slice(0, 100),
    severity: String(submission.severity || 'normal').slice(0, 50)
  };

  if (await shouldUsePostgres()) {
    await pool.query(`
      INSERT INTO submissions (
        id, type, timestamp, department, energy_level, productivity_score,
        achievements, blockers, other_notes, neutralized_content,
        sentiment_score, cognitive_strain, affective_valence, category, severity,
        redacted_items, rhythm_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
    `, [
      cleanEntry.id, cleanEntry.type, cleanEntry.timestamp, cleanEntry.department,
      cleanEntry.energyLevel, cleanEntry.productivityScore, cleanEntry.achievements,
      cleanEntry.blockers, cleanEntry.other, cleanEntry.neutralizedContent,
      cleanEntry.sentimentScore, cleanEntry.cognitiveStrain, cleanEntry.affectiveValence,
      cleanEntry.category, cleanEntry.severity,
      JSON.stringify(cleanEntry.redactedItems), JSON.stringify(cleanEntry.rhythmTags)
    ]);
    return cleanEntry;
  }

  submissions.unshift(cleanEntry);
  writeJsonFile(SUBMISSIONS_FILE, submissions);
  return cleanEntry;
}

export async function getAllActions() {
  if (await shouldUsePostgres()) {
    const res = await pool.query('SELECT * FROM actions ORDER BY created_at DESC');
    return res.rows.map(rowToAction);
  }
  return actions;
}

export async function updateAction(id, updateData) {
  if (await shouldUsePostgres()) {
    const res = await pool.query(`
      UPDATE actions
      SET status = COALESCE($1, status),
          public_note = COALESCE($2, public_note),
          assigned_to = COALESCE($3, assigned_to),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [updateData.status ?? null, updateData.publicNote ?? null, updateData.assignedTo ?? null, id]);
    return res.rows[0] ? rowToAction(res.rows[0]) : null;
  }

  const index = actions.findIndex(a => a.id === id);
  if (index === -1) return null;
  actions[index] = {
    ...actions[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  writeJsonFile(ACTIONS_FILE, actions);
  return actions[index];
}

export async function addAction(actionData) {
  const nowIso = new Date().toISOString();
  const newAction = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    targetClusterId: actionData.targetClusterId || 'custom',
    clusterTitle: String(actionData.clusterTitle || 'General Workplace Action').slice(0, 255),
    status: String(actionData.status || 'Under Review').slice(0, 50),
    assignedTo: String(actionData.assignedTo || 'People Operations').slice(0, 150),
    actionDescription: actionData.actionDescription || '',
    publicNote: actionData.publicNote || '',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  if (await shouldUsePostgres()) {
    const res = await pool.query(`
      INSERT INTO actions (
        id, cluster_title, action_description, assigned_to, status, public_note, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;
    `, [
      newAction.id, newAction.clusterTitle, newAction.actionDescription,
      newAction.assignedTo, newAction.status, newAction.publicNote
    ]);
    return rowToAction(res.rows[0]);
  }

  actions.unshift(newAction);
  writeJsonFile(ACTIONS_FILE, actions);
  return newAction;
}

export async function getClusters() {
  if (await shouldUsePostgres()) {
    const res = await pool.query('SELECT data FROM clusters WHERE id = $1', ['active']);
    return res.rows[0] ? res.rows[0].data : defaultClusters;
  }
  return clusters;
}

export async function updateClusters(newClusters) {
  if (await shouldUsePostgres()) {
    await pool.query(`
      INSERT INTO clusters (id, data, updated_at)
      VALUES ('active', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW();
    `, [JSON.stringify(newClusters)]);
    return newClusters;
  }

  clusters = newClusters;
  writeJsonFile(CLUSTERS_FILE, clusters);
  return clusters;
}

/**
 * Helper to get week label like 'W42 (Oct)'
 */
function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  const monthName = d.toLocaleString('en-US', { month: 'short' });
  return `W${weekNum} (${monthName})`;
}

/**
 * Computes live aggregate metrics for the HR Dashboard with Day / Week / 1 Month / 3 Month grouping.
 */
export async function getAnalyticsMetrics(timeframe = 'day') {
  const subList = await getAllSubmissions();
  const totalSubmissions = subList.length;

  if (totalSubmissions === 0) {
    return {
      rollingHappiness: 75,
      rollingProductivity: 70,
      engagementRate: 85,
      avgCognitiveStrain: 35,
      burnoutRiskLevel: 'Low',
      participationCount: 0,
      dailyMoraleTrajectories: [],
      departmentClimate: [],
      energyDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  // Calculate Average Energy & Happiness
  const totalEnergy = subList.reduce((sum, s) => sum + (s.energyLevel || 3), 0);
  const avgEnergy = totalEnergy / totalSubmissions;
  const rollingHappiness = Math.round((avgEnergy / 5) * 100);

  // Calculate Cognitive Strain
  const totalStrain = subList.reduce((sum, s) => sum + (s.cognitiveStrain || 40), 0);
  const avgCognitiveStrain = Math.round(totalStrain / totalSubmissions);

  // Calculate Productivity
  const totalProd = subList.reduce((sum, s) => {
    const prod = s.productivityScore || Math.max(25, Math.min(95, Math.round((s.energyLevel || 3) * 16 - (s.cognitiveStrain || 40) * 0.2 + 20)));
    return sum + prod;
  }, 0);
  const rollingProductivity = Math.round(totalProd / totalSubmissions);

  let burnoutRiskLevel = 'Low';
  if (avgCognitiveStrain >= 70) burnoutRiskLevel = 'Severe Warning';
  else if (avgCognitiveStrain >= 50) burnoutRiskLevel = 'Elevated';
  else if (avgCognitiveStrain >= 35) burnoutRiskLevel = 'Moderate';

  // Longitudinal Trajectory grouped by Day, Week, 1 Month, or 3 Month
  const trajectoryMap = {};
  subList.forEach(s => {
    const rawDate = s.timestamp || '2026-10-24T12:00:00Z';
    const d = new Date(rawDate);
    let bucketKey = '';
    let displayLabel = '';

    if (timeframe === '3month' || timeframe === 'month') {
      bucketKey = rawDate.slice(0, 7); // YYYY-MM
      displayLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } else if (timeframe === '1month') {
      const dayOfMonth = d.getDate();
      const weekIndex = Math.min(4, Math.ceil(dayOfMonth / 7));
      bucketKey = `${rawDate.slice(0, 7)}-W${weekIndex}`;
      displayLabel = `${d.toLocaleString('en-US', { month: 'short' })} W${weekIndex}`;
    } else if (timeframe === 'week') {
      const weekLabel = getWeekLabel(rawDate);
      bucketKey = `${d.getFullYear()}-${weekLabel}`;
      displayLabel = weekLabel;
    } else {
      bucketKey = rawDate.split('T')[0];
      displayLabel = bucketKey.slice(5); // MM-DD
    }

    if (!trajectoryMap[bucketKey]) {
      trajectoryMap[bucketKey] = {
        key: bucketKey,
        label: displayLabel,
        totalEnergy: 0,
        totalStrain: 0,
        totalProd: 0,
        count: 0
      };
    }
    const prod = s.productivityScore || Math.max(25, Math.min(95, Math.round((s.energyLevel || 3) * 16 - (s.cognitiveStrain || 40) * 0.2 + 20)));
    trajectoryMap[bucketKey].totalEnergy += (s.energyLevel || 3);
    trajectoryMap[bucketKey].totalStrain += (s.cognitiveStrain || 40);
    trajectoryMap[bucketKey].totalProd += prod;
    trajectoryMap[bucketKey].count++;
  });

  const dailyMoraleTrajectories = Object.keys(trajectoryMap)
    .sort()
    .map(key => {
      const item = trajectoryMap[key];
      return {
        date: item.key,
        label: item.label,
        moraleScore: Math.round((item.totalEnergy / item.count) * 20),
        cognitiveStrain: Math.round(item.totalStrain / item.count),
        productivityScore: Math.round(item.totalProd / item.count)
      };
    });

  // Department Aggregates
  const deptMap = {};
  subList.forEach(s => {
    const d = s.department || 'General';
    if (!deptMap[d]) {
      deptMap[d] = {
        name: d,
        totalEnergy: 0,
        totalStrain: 0,
        totalProd: 0,
        count: 0
      };
    }
    const prod = s.productivityScore || Math.max(25, Math.min(95, Math.round((s.energyLevel || 3) * 16 - (s.cognitiveStrain || 40) * 0.2 + 20)));
    deptMap[d].totalEnergy += (s.energyLevel || 3);
    deptMap[d].totalStrain += (s.cognitiveStrain || 40);
    deptMap[d].totalProd += prod;
    deptMap[d].count++;
  });

  const departmentClimate = Object.keys(deptMap).map(key => {
    const item = deptMap[key];
    const avgE = item.totalEnergy / item.count;
    const avgS = Math.round(item.totalStrain / item.count);
    const avgP = Math.round(item.totalProd / item.count);
    return {
      department: item.name,
      moraleIndex: Math.round((avgE / 5) * 100),
      cognitiveStrain: avgS,
      productivityScore: avgP,
      sentiment: avgE >= 3.8 ? 'Positive' : avgE <= 2.2 ? 'Strained' : 'Neutral',
      activeFrictions: avgS >= 50 ? 2 : 1
    };
  });

  // Energy Level Distribution (1-5)
  const energyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  subList.forEach(s => {
    const level = s.energyLevel || 3;
    if (energyDistribution[level] !== undefined) {
      energyDistribution[level]++;
    }
  });

  return {
    rollingHappiness,
    rollingProductivity,
    engagementRate: Math.min(98, 70 + totalSubmissions),
    avgCognitiveStrain,
    burnoutRiskLevel,
    participationCount: totalSubmissions,
    dailyMoraleTrajectories,
    departmentClimate,
    energyDistribution
  };
}
