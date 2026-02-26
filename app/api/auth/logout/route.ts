import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears the user's session
 * Removes encrypted session cookie
 */
export async function POST() {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { error: "Logout failed", message: "Unable to clear session" },
      { status: 500 }
    );
  }
}
