import { getContacts, getDeals, getCompanies } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import { runAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * GET /api/audit
 * Performs a comprehensive health check audit of the HubSpot instance
 * Requires authenticated session with valid access token
 * Returns audit results with overall score and detailed analysis
 */
export async function GET() {
  try {
    // Get session
    const session = await getSession();

    // Check if user is authenticated
    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No valid session token found" },
        { status: 401 }
      );
    }

    // Fetch data from HubSpot in parallel (limit to 500 records per object)
    const [contactsData, dealsData, companiesData] = await Promise.all([
      getContacts(session.accessToken, 500),
      getDeals(session.accessToken, 500),
      getCompanies(session.accessToken, 500),
    ]);

    // Extract the contacts, deals, and companies arrays
    const contacts = contactsData.results || [];
    const deals = dealsData.results || [];
    const companies = companiesData.results || [];

    // Run the comprehensive audit logic
    const auditResult = runAudit(contacts, deals, companies);

    return NextResponse.json(auditResult);
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
