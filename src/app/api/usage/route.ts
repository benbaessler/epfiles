import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://jeffgpt-backend-production.up.railway.app";

function getUserTier(has?: (params: { plan: string }) => boolean): string {
  if (!has) return "free";
  if (has({ plan: "research" })) return "research";
  if (has({ plan: "explore" })) return "explore";
  return "free";
}

export async function GET() {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = getUserTier(has);

  try {
    const response = await fetch(`${BACKEND_URL}/api/usage`, {
      headers: {
        "X-User-Id": userId,
        "X-User-Tier": tier,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}


