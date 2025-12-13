import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  redis,
  TRIAL_TTL_SECONDS,
  ANON_RATE_LIMIT_PER_HOUR,
  ANON_RATE_LIMIT_TTL_SECONDS,
} from "@/lib/redis";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://jeffgpt-backend-production.up.railway.app";

function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback - this will likely be the proxy IP in production
  return "unknown";
}

function createTrialKey(ip: string, fingerprint?: string): string {
  const data = fingerprint ? `${ip}:${fingerprint}` : ip;
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 32);
  return `trial:${hash}`;
}

function createRateLimitKey(ip: string): string {
  return `ratelimit:anon:${ip}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limiting check
  const rateLimitKey = createRateLimitKey(ip);
  const currentRequests = await redis.get<number>(rateLimitKey);

  if (currentRequests && currentRequests >= ANON_RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests. Please try again later.",
      },
      { status: 429 }
    );
  }

  let body: { query: string; fingerprint?: string; top_k?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { query, fingerprint, top_k = 5 } = body;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  // Create trial key from IP + optional fingerprint
  const trialKey = createTrialKey(ip, fingerprint);

  // Check if trial has been used
  const trialUsed = await redis.exists(trialKey);

  if (trialUsed) {
    return NextResponse.json(
      {
        error: "trial_exhausted",
        message: "Sign up to continue using the service.",
      },
      { status: 403 }
    );
  }

  // Increment rate limit counter
  const pipeline = redis.pipeline();
  pipeline.incr(rateLimitKey);
  pipeline.expire(rateLimitKey, ANON_RATE_LIMIT_TTL_SECONDS);
  await pipeline.exec();

  try {
    // Forward query to backend with anonymous user identifier
    const response = await fetch(`${BACKEND_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": `anon:${trialKey}`,
        "X-User-Tier": "trial",
      },
      body: JSON.stringify({ query, top_k }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Mark trial as used only after successful response
    await redis.set(trialKey, Date.now(), { ex: TRIAL_TTL_SECONDS });

    return NextResponse.json({
      ...data,
      is_trial: true,
    });
  } catch (error) {
    console.error("Failed to process trial query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

