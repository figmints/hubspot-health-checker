/**
 * SQLite Database for HubSpot Health Checker
 * Tracks: workspaces, health scores over time, fix logs, user tiers
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Lazy initialization - only create database when needed (at runtime)
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(path.join(dataDir, 'hubspot-health.db'));

  // Enable WAL mode for better performance
  _db.pragma('journal_mode = WAL');

  // Initialize database schema
  _db.exec(`
    -- Workspaces table (HubSpot portals)
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portal_id TEXT UNIQUE NOT NULL,
      name TEXT,
      tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Health score history
    CREATE TABLE IF NOT EXISTS health_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      contact_quality_score INTEGER,
      deal_pipeline_score INTEGER,
      company_quality_score INTEGER,
      engagement_score INTEGER,
      hygiene_score INTEGER,
      contacts_count INTEGER,
      deals_count INTEGER,
      companies_count INTEGER,
      issues_count INTEGER,
      auto_fixable_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    -- Fix audit log
    CREATE TABLE IF NOT EXISTS fix_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      issue_title TEXT NOT NULL,
      fixed_count INTEGER NOT NULL,
      error_count INTEGER DEFAULT 0,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    -- Alerts/Notifications
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_health_scores_workspace ON health_scores(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_health_scores_date ON health_scores(created_at);
    CREATE INDEX IF NOT EXISTS idx_fix_logs_workspace ON fix_logs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_workspace ON alerts(workspace_id);
  `);
  
  return _db;
}

// ============================================================
// WORKSPACE FUNCTIONS
// ============================================================

export interface Workspace {
  id: number;
  portal_id: string;
  name: string | null;
  tier: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export function getOrCreateWorkspace(portalId: string, name?: string): Workspace {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM workspaces WHERE portal_id = ?').get(portalId) as Workspace | undefined;
  
  if (existing) {
    if (name && name !== existing.name) {
      db.prepare('UPDATE workspaces SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(name, existing.id);
    }
    return existing;
  }
  
  const result = db.prepare('INSERT INTO workspaces (portal_id, name) VALUES (?, ?)').run(portalId, name || null);
  return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(result.lastInsertRowid) as Workspace;
}

export function updateWorkspaceTier(workspaceId: number, tier: 'free' | 'premium' | 'enterprise'): void {
  const db = getDb();
  db.prepare('UPDATE workspaces SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(tier, workspaceId);
}

export function getWorkspace(portalId: string): Workspace | null {
  const db = getDb();
  return db.prepare('SELECT * FROM workspaces WHERE portal_id = ?').get(portalId) as Workspace | undefined || null;
}

// ============================================================
// HEALTH SCORE FUNCTIONS
// ============================================================

export interface HealthScore {
  id: number;
  workspace_id: number;
  overall_score: number;
  contact_quality_score: number | null;
  deal_pipeline_score: number | null;
  company_quality_score: number | null;
  engagement_score: number | null;
  hygiene_score: number | null;
  contacts_count: number | null;
  deals_count: number | null;
  companies_count: number | null;
  issues_count: number | null;
  auto_fixable_count: number | null;
  created_at: string;
}

export function recordHealthScore(
  workspaceId: number,
  overallScore: number,
  categoryScores: {
    contactQuality?: number;
    dealPipeline?: number;
    companyQuality?: number;
    engagement?: number;
    hygiene?: number;
  },
  counts: {
    contacts?: number;
    deals?: number;
    companies?: number;
    issues?: number;
    autoFixable?: number;
  }
): HealthScore {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO health_scores (
      workspace_id, overall_score,
      contact_quality_score, deal_pipeline_score, company_quality_score,
      engagement_score, hygiene_score,
      contacts_count, deals_count, companies_count,
      issues_count, auto_fixable_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    workspaceId,
    overallScore,
    categoryScores.contactQuality ?? null,
    categoryScores.dealPipeline ?? null,
    categoryScores.companyQuality ?? null,
    categoryScores.engagement ?? null,
    categoryScores.hygiene ?? null,
    counts.contacts ?? null,
    counts.deals ?? null,
    counts.companies ?? null,
    counts.issues ?? null,
    counts.autoFixable ?? null
  );
  
  return db.prepare('SELECT * FROM health_scores WHERE id = ?').get(result.lastInsertRowid) as HealthScore;
}

export function getHealthScoreHistory(workspaceId: number, limit = 30): HealthScore[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM health_scores 
    WHERE workspace_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(workspaceId, limit) as HealthScore[];
}

export function getLatestHealthScore(workspaceId: number): HealthScore | null {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM health_scores 
    WHERE workspace_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(workspaceId) as HealthScore | undefined || null;
}

export function getScoreTrend(workspaceId: number, days = 30): Array<{ date: string; score: number }> {
  const db = getDb();
  return db.prepare(`
    SELECT DATE(created_at) as date, AVG(overall_score) as score
    FROM health_scores
    WHERE workspace_id = ? AND created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(workspaceId, days) as Array<{ date: string; score: number }>;
}

// ============================================================
// FIX LOG FUNCTIONS
// ============================================================

export interface FixLog {
  id: number;
  workspace_id: number;
  issue_type: string;
  issue_title: string;
  fixed_count: number;
  error_count: number;
  details: string | null;
  created_at: string;
}

export function recordFix(
  workspaceId: number,
  issueType: string,
  issueTitle: string,
  fixedCount: number,
  errorCount = 0,
  details?: string[]
): FixLog {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO fix_logs (workspace_id, issue_type, issue_title, fixed_count, error_count, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    workspaceId,
    issueType,
    issueTitle,
    fixedCount,
    errorCount,
    details ? JSON.stringify(details) : null
  );
  
  return db.prepare('SELECT * FROM fix_logs WHERE id = ?').get(result.lastInsertRowid) as FixLog;
}

export function getFixLogs(workspaceId: number, limit = 50): FixLog[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM fix_logs 
    WHERE workspace_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(workspaceId, limit) as FixLog[];
}

export function getFixStats(workspaceId: number): { totalFixed: number; totalErrors: number; fixCount: number } {
  const db = getDb();
  const result = db.prepare(`
    SELECT 
      COALESCE(SUM(fixed_count), 0) as totalFixed,
      COALESCE(SUM(error_count), 0) as totalErrors,
      COUNT(*) as fixCount
    FROM fix_logs
    WHERE workspace_id = ?
  `).get(workspaceId) as { totalFixed: number; totalErrors: number; fixCount: number };
  
  return result;
}

// ============================================================
// ALERT FUNCTIONS
// ============================================================

export interface Alert {
  id: number;
  workspace_id: number;
  type: string;
  title: string;
  message: string | null;
  severity: 'info' | 'warning' | 'critical';
  is_read: number;
  created_at: string;
}

export function createAlert(
  workspaceId: number,
  type: string,
  title: string,
  message?: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
): Alert {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO alerts (workspace_id, type, title, message, severity)
    VALUES (?, ?, ?, ?, ?)
  `).run(workspaceId, type, title, message || null, severity);
  
  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid) as Alert;
}

export function getUnreadAlerts(workspaceId: number): Alert[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM alerts 
    WHERE workspace_id = ? AND is_read = 0
    ORDER BY created_at DESC
  `).all(workspaceId) as Alert[];
}

export function markAlertRead(alertId: number): void {
  const db = getDb();
  db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(alertId);
}

export function markAllAlertsRead(workspaceId: number): void {
  const db = getDb();
  db.prepare('UPDATE alerts SET is_read = 1 WHERE workspace_id = ?').run(workspaceId);
}

// Export getter for advanced queries (only at runtime)
export function getDatabase(): Database.Database {
  return getDb();
}
