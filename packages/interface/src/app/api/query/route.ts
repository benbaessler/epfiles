import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Build headers to forward to backend
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward user-provided xAI API key if present
    const apiKey = request.headers.get("X-XAI-API-Key");
    if (apiKey) {
      headers["X-XAI-API-Key"] = apiKey;
    }

    // Forward message count for free tier validation
    const messageCount = request.headers.get("X-Message-Count");
    if (messageCount) {
      headers["X-Message-Count"] = messageCount;
    }

    const response = await fetch(`${BACKEND_URL}/api/query`, {
      method: "POST",
      headers,
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
