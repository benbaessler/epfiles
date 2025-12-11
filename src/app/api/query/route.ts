import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://epfiles-backend-production.up.railway.app";

function getUserTier(has: (params: { plan: string }) => boolean): string {
  if (has({ plan: "research" })) return "research";
  if (has({ plan: "explore" })) return "explore";
  return "free";
}

export async function POST(request: NextRequest) {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = getUserTier(has);

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
        "X-User-Tier": tier,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to query:", error);
    return NextResponse.json({ error: "Failed to query" }, { status: 500 });
  }
}




