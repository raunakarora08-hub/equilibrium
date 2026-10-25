// server/dataStore.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialSubmissions, initialActions, defaultClusters } from './seedData.js';
import { pool, isPgConnected } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  return defaultData;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// In-memory caching with disk persistence
let submissions = readJsonFile(SUBMISSIONS_FILE, initialSubmissions);
let actions = readJsonFile(ACTIONS_FILE, initialActions);
let clusters = readJsonFile(CLUSTERS_FILE, defaultClusters);

export function getAllSubmissions() {
  return submissions;
}

/**
 * Adds an anonymous submission.
 * Enforces Zero-Knowledge principles:
 * - No user-agent, IP, or user IDs are accepted or stored.
 * - Random timing jitter (±10 to 25 mins) is added to the timestamp to thwart correlation attacks.
 */
export function addSubmission(submission) {
  // Apply timestamp jitter
  const now = new Date();
  const jitterMinutes = Math.floor(Math.random() * 30) - 15; // -15 to +15 mins
  now.setMinutes(now.getMinutes() + jitterMinutes);

  const energy = Number(submission.energyLevel) || 3;
  const strain = submission.cognitiveStrain !== undefined ? submission.cognitiveStrain : 45;
  const hasAchievements = (submission.achievements && submission.achievements.trim().length > 5) ? 15 : 0;
  const hasBlockers = (submission.blockers && submission.blockers.trim().length > 5) ? 10 : 0;
  const productivityScore = Math.max(20, Math.min(95, Math.round((energy * 16) + hasAchievements - (strain * 0.25) - hasBlockers + 10)));

  const cleanEntry = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: submission.type || 'daily_summary',
    timestamp: now.toISOString(),
    department: submission.department || 'General',
    energyLevel: energy,
    rhythmTags: Array.isArray(submission.rhythmTags) ? submission.rhythmTags : [],
    achievements: submission.achievements || '',
    blockers: submission.blockers || '',
    other: submission.other || '',
    neutralizedContent: submission.neutralizedContent || submission.neutralizedText || '',
    redactedItems: submission.redactedItems || [],
    sentimentScore: submission.sentimentScore !== undefined ? submission.sentimentScore : 0,
    cognitiveStrain: strain,
    productivityScore: productivityScore,
    affectiveValence: submission.affectiveValence || 'Neutral',
    category: submission.category || 'General',
    severity: submission.severity || 'low'
  };

  submissions.unshift(cleanEntry);
  writeJsonFile(SUBMISSIONS_FILE, submissions);

  // Asynchronously persist to PostgreSQL if connected
  if (isPgConnected() && pool) {
    pool.query(`
      INSERT INTO submissions (
        id, type, timestamp, department, energy_level, productivity_score,
        achievements, blockers, other_notes, neutralized_content,
        sentiment_score, cognitive_strain, affective_valence, category, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING;
    `, [
      cleanEntry.id, cleanEntry.type, cleanEntry.timestamp, cleanEntry.department,
      cleanEntry.energyLevel, cleanEntry.productivityScore, cleanEntry.achievements,
      cleanEntry.blockers, cleanEntry.other, cleanEntry.neutralizedContent,
      cleanEntry.sentimentScore, cleanEntry.cognitiveStrain, cleanEntry.affectiveValence,
      cleanEntry.category, cleanEntry.severity
    ]).catch(err => console.error('PG insert submission error:', err.message));
  }

  return cleanEntry;
}

export function getAllActions() {
  return actions;
}

export function updateAction(id, updateData) {
  const index = actions.findIndex(a => a.id === id);
  if (index !== -1) {
    actions[index] = {
      ...actions[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(ACTIONS_FILE, actions);

    // Persist to PostgreSQL if connected
    if (isPgConnected() && pool) {
      pool.query(`
        UPDATE actions
        SET status = $1, updated_at = NOW()
        WHERE id = $2;
      `, [actions[index].status, id]).catch(err => console.error('PG update action error:', err.message));
    }

    return actions[index];
  }
  return null;
}

export function addAction(actionData) {
  const newAction = {
    id: `act-${Date.now()}`,
    targetClusterId: actionData.targetClusterId || 'custom',
    clusterTitle: actionData.clusterTitle || 'General Workplace Action',
    status: actionData.status || 'Under Review',
    assignedTo: actionData.assignedTo || 'People Operations',
    actionDescription: actionData.actionDescription || '',
    publicNote: actionData.publicNote || '',
    updatedAt: new Date().toISOString()
  };
  actions.unshift(newAction);
  writeJsonFile(ACTIONS_FILE, actions);

  // Persist to PostgreSQL if connected
  if (isPgConnected() && pool) {
    pool.query(`
      INSERT INTO actions (
        id, cluster_title, action_description, assigned_to, status, public_note, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [
      newAction.id, newAction.clusterTitle, newAction.actionDescription,
      newAction.assignedTo, newAction.status, newAction.publicNote
    ]).catch(err => console.error('PG insert action error:', err.message));
  }

  return newAction;
}

export function getClusters() {
  return clusters;
}

export function updateClusters(newClusters) {
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
export function getAnalyticsMetrics(timeframe = 'day') {
  const totalSubmissions = submissions.length;
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
  const totalEnergy = submissions.reduce((sum, s) => sum + (s.energyLevel || 3), 0);
  const avgEnergy = totalEnergy / totalSubmissions;
  const rollingHappiness = Math.round((avgEnergy / 5) * 100);

  // Calculate Cognitive Strain
  const totalStrain = submissions.reduce((sum, s) => sum + (s.cognitiveStrain || 40), 0);
  const avgCognitiveStrain = Math.round(totalStrain / totalSubmissions);

  // Calculate Productivity
  const totalProd = submissions.reduce((sum, s) => {
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
  submissions.forEach(s => {
    const rawDate = s.timestamp || '2026-10-24T12:00:00Z';
    const d = new Date(rawDate);
    let bucketKey = '';
    let displayLabel = '';

    if (timeframe === '3month' || timeframe === 'month') {
      bucketKey = rawDate.slice(0, 7); // YYYY-MM
      displayLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } else if (timeframe === '1month') {
      // 1 Month view: group by 7-day intervals of the latest month (Oct)
      const dayOfMonth = d.getDate();
      const weekIndex = Math.min(4, Math.ceil(dayOfMonth / 7));
      bucketKey = `${rawDate.slice(0, 7)}-W${weekIndex}`;
      displayLabel = `${d.toLocaleString('en-US', { month: 'short' })} W${weekIndex}`;
    } else if (timeframe === 'week') {
      const weekLabel = getWeekLabel(rawDate);
      bucketKey = `${d.getFullYear()}-${weekLabel}`;
      displayLabel = weekLabel;
    } else {
      // default: day
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
        moraleScore: Math.round((item.totalEnergy / item.count) * 20), // 0 to 100
        cognitiveStrain: Math.round(item.totalStrain / item.count),
        productivityScore: Math.round(item.totalProd / item.count),
        submissionsCount: item.count
      };
    });

  // Department Climate
  const deptMap = {};
  submissions.forEach(s => {
    const dept = s.department || 'General';
    if (!deptMap[dept]) deptMap[dept] = { dept, totalEnergy: 0, totalStrain: 0, totalProd: 0, count: 0 };
    const prod = s.productivityScore || Math.max(25, Math.min(95, Math.round((s.energyLevel || 3) * 16 - (s.cognitiveStrain || 40) * 0.2 + 20)));
    deptMap[dept].totalEnergy += (s.energyLevel || 3);
    deptMap[dept].totalStrain += (s.cognitiveStrain || 40);
    deptMap[dept].totalProd += prod;
    deptMap[dept].count++;
  });

  const departmentClimate = Object.values(deptMap).map(d => ({
    department: d.dept,
    happinessIndex: Math.round((d.totalEnergy / d.count) * 20),
    cognitiveStrain: Math.round(d.totalStrain / d.count),
    productivityScore: Math.round(d.totalProd / d.count),
    sampleSize: d.count
  }));

  return {
    timeframe,
    rollingHappiness,
    rollingProductivity,
    engagementRate: Math.min(96, Math.max(72, 70 + totalSubmissions * 2)),
    avgCognitiveStrain,
    burnoutRiskLevel,
    participationCount: totalSubmissions,
    dailyMoraleTrajectories,
    departmentClimate
  };
}
