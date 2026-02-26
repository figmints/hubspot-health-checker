import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  portalId?: string;
  email?: string;
  auditResults?: any;
}

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    {
      password: process.env.SESSION_SECRET || "default-secret-key-change-this",
      cookieName: "hubspot-health-checker",
    }
  );
  return session;
}
