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

function createTrialKeyFromIP(ip: string): string {
  const hash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return `trial:ip:${hash}`;
}

function createTrialKeyFromFingerprint(fingerprint: string): string {
  const hash = createHash("sha256").update(fingerprint).digest("hex").slice(0, 32);
  return `trial:fp:${hash}`;
}

function createRateLimitKey(ip: string): string {
  const hash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return `ratelimit:anon:${hash}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Parse and validate body first (needed for fingerprint before trial check)
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

  // Single trial key: fingerprint-preferred, IP as fallback
  // This avoids the partial-claim bug and improves shared-network UX
  const trialKey = fingerprint
    ? createTrialKeyFromFingerprint(fingerprint)
    : createTrialKeyFromIP(ip);

  // Check trial status BEFORE rate limiting to avoid consuming rate limit
  // budget for users whose trial is already exhausted
  const trialExists = await redis.exists(trialKey);
  if (trialExists) {
    return NextResponse.json(
      {
        error: "trial_exhausted",
        message: "Sign up to continue using the service.",
      },
      { status: 403 }
    );
  }

  // Rate limit only after confirming trial is available
  const rateLimitKey = createRateLimitKey(ip);
  const requestCount = await redis.incr(rateLimitKey);

  // Set TTL only when key is first created (fixed window, not sliding)
  if (requestCount === 1) {
    await redis.expire(rateLimitKey, ANON_RATE_LIMIT_TTL_SECONDS);
  }

  if (requestCount > ANON_RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests. Please try again later.",
      },
      { status: 429 }
    );
  }

  // Atomically claim trial slot using SETNX to prevent TOCTOU race condition
  const claimed = await redis.set(trialKey, Date.now(), {
    nx: true,
    ex: TRIAL_TTL_SECONDS,
  });

  // Handle race condition: another request claimed the trial between EXISTS and SET
  if (claimed === null) {
    // Reverse the rate limit increment since we didn't actually process the request
    await redis.decr(rateLimitKey);
    return NextResponse.json(
      {
        error: "trial_exhausted",
        message: "Sign up to continue using the service.",
      },
      { status: 403 }
    );
  }

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
      // Backend error - release the trial slot so user can retry
      await redis.del(trialKey);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ...data,
      is_trial: true,
    });
  } catch (error) {
    console.error("Failed to process trial query:", error);
    // Network/fetch error - release the trial slot so user can retry
    await redis.del(trialKey);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
