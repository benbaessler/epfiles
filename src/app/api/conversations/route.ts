import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://jeffgpt-backend-production.up.railway.app";

export async function GET() {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      headers: {
        "X-User-Id": userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend doesn't support GET for conversations yet - return empty array
      if (response.status === 405) {
        return NextResponse.json([]);
      }
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
