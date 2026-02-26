import { exchangeCodeForToken } from "@/lib/hubspot";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    redirect("/?error=" + error);
  }

  if (!code) {
    redirect("/?error=no_code");
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const session = await getSession();

    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken;

    await session.save();

    redirect("/audit");
  } catch (error) {
    console.error("Error during callback:", error);
    redirect("/?error=callback_failed");
  }
}
