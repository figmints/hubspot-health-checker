import { getOAuthUrl } from "@/lib/hubspot";
import { redirect } from "next/navigation";

/**
 * GET /api/auth/hubspot
 * Initiates the HubSpot OAuth 2.0 flow
 * Redirects user to HubSpot's authorization page
 */
export async function GET() {
  const oauthUrl = getOAuthUrl();
  redirect(oauthUrl);
}
