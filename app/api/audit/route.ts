import { getContacts, getDeals, getCompanies } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import { runAudit } from "@/lib/audit";
import { detectAllFixableIssues } from "@/lib/fixable-issues";
import { NextResponse } from "next/server";

/**
 * GET /api/audit
 * Performs a comprehensive health check audit of the HubSpot instance
 * Requires authenticated session with valid access token
 * Returns audit results with overall score and detailed analysis
 */
export async function GET(request: Request) {
  try {
    // Get authorization header for direct token access
    const authHeader = request.headers.get('Authorization');
    let accessToken = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      // Direct token from private app
      accessToken = authHeader.substring(7);
    } else {
      // Try to get from session (OAuth flow)
      const session = await getSession();
      accessToken = session.accessToken;
    }

    // Check if we have a token
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No valid token found" },
        { status: 401 }
      );
    }

    // Fetch data from HubSpot in parallel (limit to 500 records per object)
    const [contactsData, dealsData, companiesData] = await Promise.all([
      getContacts(accessToken, 500),
      getDeals(accessToken, 500),
      getCompanies(accessToken, 500),
    ]);

    // Extract the contacts, deals, and companies arrays
    const contacts = contactsData.results || [];
    const deals = dealsData.results || [];
    const companies = companiesData.results || [];

    // Run the comprehensive audit logic
    const auditResult = runAudit(contacts, deals, companies);
    
    // Also detect fixable issues for premium users
    const fixableIssues = detectAllFixableIssues(contacts, deals, companies);

    return NextResponse.json({
      ...auditResult,
      fixableIssues,
      fixableSummary: {
        total: fixableIssues.length,
        autoFixable: fixableIssues.filter(i => i.canAutoFix).length,
        highSeverity: fixableIssues.filter(i => i.severity === 'high').length,
      }
    });
  } catch (error) {
    console.error("Error performing audit:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Audit failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
