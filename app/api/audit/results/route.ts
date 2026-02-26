import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const data = await request.json();

    session.auditResults = data;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving results:", error);
    return NextResponse.json(
      { error: "Failed to save results" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session.auditResults) {
      return NextResponse.json(
        { error: "No audit results found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session.auditResults);
  } catch (error) {
    console.error("Error retrieving results:", error);
    return NextResponse.json(
      { error: "Failed to retrieve results" },
      { status: 500 }
    );
  }
}
