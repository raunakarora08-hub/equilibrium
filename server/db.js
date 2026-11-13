// server/db.js
import pg from 'pg';
import { initialSubmissions, initialActions, defaultClusters } from './seedData.js';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let initPromise = null;

// Support all standard Vercel Postgres / Neon environment variables
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL_NON_POOLING;

if (connectionString) {
  try {
    // Strip sslmode from the URL so the explicit ssl option below is the one that applies
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
    pool = new Pool({
      connectionString: url.toString(),
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      // Neon can take a few seconds to wake a suspended compute
      connectionTimeoutMillis: 15000
    });
    // Neon drops idle connections; without this listener the error crashes the process
    pool.on('error', err => {
      console.error('PostgreSQL idle client error:', err.message);
    });
    console.log('🔌 PostgreSQL pool initialized');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err.message);
  }
}

/**
 * Auto-creates PostgreSQL tables if they don't already exist.
 * Seeds initial 20 realistic submissions if table is empty.
 */
export async function initializeDatabase() {
  if (!pool) {
    console.log('ℹ️ No POSTGRES_URL or DATABASE_URL provided. Operating with local JSON file persistence.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      // 1. Create Submissions Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id VARCHAR(100) PRIMARY KEY,
          type VARCHAR(50) DEFAULT 'daily_summary',
          timestamp TIMESTAMPTZ NOT NULL,
          department VARCHAR(100) NOT NULL,
          energy_level INT DEFAULT 3,
          productivity_score INT DEFAULT 70,
          achievements TEXT,
          blockers TEXT,
          other_notes TEXT,
          neutralized_content TEXT NOT NULL,
          sentiment_score NUMERIC(4, 2) DEFAULT 0,
          cognitive_strain INT DEFAULT 45,
          affective_valence VARCHAR(50) DEFAULT 'Neutral',
          category VARCHAR(100) DEFAULT 'General',
          severity VARCHAR(50) DEFAULT 'normal'
        );
      `);
      await client.query(`
        ALTER TABLE submissions
          ADD COLUMN IF NOT EXISTS redacted_items JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS rhythm_tags JSONB DEFAULT '[]'::jsonb;
      `);

      // 2. Create Actions Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS actions (
          id VARCHAR(100) PRIMARY KEY,
          cluster_title VARCHAR(255) NOT NULL,
          action_description TEXT NOT NULL,
          assigned_to VARCHAR(150) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Under Review',
          public_note TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. Create Clusters Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS clusters (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Check if submissions need seeding
      const subCountRes = await client.query('SELECT COUNT(*) FROM submissions');
      const subCount = parseInt(subCountRes.rows[0].count, 10);

      if (subCount === 0) {
        console.log('🌱 Seeding PostgreSQL with 20 realistic workplace submissions...');
        for (const s of initialSubmissions) {
          await client.query(`
            INSERT INTO submissions (
              id, type, timestamp, department, energy_level, productivity_score,
              achievements, blockers, other_notes, neutralized_content,
              sentiment_score, cognitive_strain, affective_valence, category, severity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING;
          `, [
            s.id, s.type, s.timestamp, s.department, s.energyLevel, s.productivityScore || 70,
            s.achievements || '', s.blockers || '', s.other || '', s.neutralizedContent || '',
            s.sentimentScore || 0, s.cognitiveStrain || 45, s.affectiveValence || 'Neutral',
            s.category || 'General', s.severity || 'normal'
          ]);
        }
      }

      // Check if actions need seeding
      const actCountRes = await client.query('SELECT COUNT(*) FROM actions');
      const actCount = parseInt(actCountRes.rows[0].count, 10);

      if (actCount === 0) {
        console.log('🌱 Seeding PostgreSQL with initial actions...');
        for (const a of initialActions) {
          await client.query(`
            INSERT INTO actions (
              id, cluster_title, action_description, assigned_to, status, public_note, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;
          `, [
            a.id, a.clusterTitle, a.actionDescription, a.assignedTo, a.status,
            a.publicNote || '', a.createdAt || new Date().toISOString(), a.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Seed clusters
      await client.query(`
        INSERT INTO clusters (id, data, updated_at)
        VALUES ('active', $1, NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [JSON.stringify(defaultClusters)]);

      isConnected = true;
      console.log('✅ PostgreSQL database ready and synced!');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ PostgreSQL initialization error:', err.message);
    isConnected = false;
    return false;
  }
}

/**
 * Ensures DB is initialized once, caching the promise for serverless functions.
 * A failed attempt is not cached, so the next request retries instead of the
 * instance being stuck without a database.
 */
export async function ensureDbInitialized() {
  if (!pool) return false;
  if (isConnected) return true;
  if (!initPromise) {
    initPromise = initializeDatabase().then(ok => {
      if (!ok) initPromise = null;
      return ok;
    });
  }
  return initPromise;
}

export function isPgConfigured() {
  return pool !== null;
}

export function isPgConnected() {
  return isConnected && pool !== null;
}

export { pool };
