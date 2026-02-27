import { NextResponse } from "next/server";
import { 
  getOrCreateWorkspace, 
  getHealthScoreHistory, 
  getScoreTrend, 
  getFixLogs,
  getFixStats,
  getUnreadAlerts 
} from "@/lib/db";

/**
 * GET /api/history
 * Returns historical health scores, fix logs, and alerts for a workspace
 * Query params: portalId (required), days (optional, default 30)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portalId = searchParams.get('portalId');
    const days = parseInt(searchParams.get('days') || '30');
    
    if (!portalId) {
      return NextResponse.json(
        { error: "Missing portalId parameter" },
        { status: 400 }
      );
    }
    
    // Get or create workspace
    const workspace = getOrCreateWorkspace(portalId);
    
    // Get historical data
    const healthScores = getHealthScoreHistory(workspace.id, 100);
    const scoreTrend = getScoreTrend(workspace.id, days);
    const fixLogs = getFixLogs(workspace.id, 50);
    const fixStats = getFixStats(workspace.id);
    const alerts = getUnreadAlerts(workspace.id);
    
    // Calculate score improvement
    let scoreImprovement = 0;
    if (healthScores.length >= 2) {
      const latest = healthScores[0];
      const oldest = healthScores[healthScores.length - 1];
      scoreImprovement = latest.overall_score - oldest.overall_score;
    }
    
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        portalId: workspace.portal_id,
        name: workspace.name,
        tier: workspace.tier,
        createdAt: workspace.created_at,
      },
      healthScores: healthScores.map(hs => ({
        score: hs.overall_score,
        contactQuality: hs.contact_quality_score,
        dealPipeline: hs.deal_pipeline_score,
        companyQuality: hs.company_quality_score,
        engagement: hs.engagement_score,
        hygiene: hs.hygiene_score,
        counts: {
          contacts: hs.contacts_count,
          deals: hs.deals_count,
          companies: hs.companies_count,
        },
        issues: hs.issues_count,
        autoFixable: hs.auto_fixable_count,
        date: hs.created_at,
      })),
      scoreTrend,
      scoreImprovement,
      fixLogs: fixLogs.map(fl => ({
        id: fl.id,
        type: fl.issue_type,
        title: fl.issue_title,
        fixedCount: fl.fixed_count,
        errorCount: fl.error_count,
        details: fl.details ? JSON.parse(fl.details) : [],
        date: fl.created_at,
      })),
      fixStats: {
        totalRecordsFixed: fixStats.totalFixed,
        totalErrors: fixStats.totalErrors,
        totalFixOperations: fixStats.fixCount,
      },
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        message: a.message,
        severity: a.severity,
        date: a.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history", message: String(error) },
      { status: 500 }
    );
  }
}
