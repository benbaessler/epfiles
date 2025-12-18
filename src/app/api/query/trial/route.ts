import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  redis,
  TRIAL_TTL_SECONDS,
  TRIAL_QUERY_LIMIT,
  ANON_RATE_LIMIT_PER_HOUR,
  ANON_RATE_LIMIT_TTL_SECONDS,
} from "@/lib/redis";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://jeffgpt-backend-production.up.railway.app";

const LIMITS_DISABLED = process.env.DISABLE_LIMITS === "true";

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

  let remaining = TRIAL_QUERY_LIMIT;
  const rateLimitKey = createRateLimitKey(ip);

  if (!LIMITS_DISABLED) {
    // Check current trial usage count BEFORE rate limiting to avoid consuming
    // rate limit budget for users whose trial is already exhausted
    const currentCount = await redis.get<number>(trialKey);
    if (currentCount !== null && currentCount >= TRIAL_QUERY_LIMIT) {
      return NextResponse.json(
        {
          error: "trial_exhausted",
          message: "Sign up to continue using the service.",
          remaining: 0,
        },
        { status: 403 }
      );
    }

    // Rate limit only after confirming trial is available
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

    // Increment trial usage counter atomically
    const newCount = await redis.incr(trialKey);

    // Set TTL only when key is first created (30-day rolling window)
    if (newCount === 1) {
      await redis.expire(trialKey, TRIAL_TTL_SECONDS);
    }

    // Handle race condition: another request pushed count over limit between GET and INCR
    if (newCount > TRIAL_QUERY_LIMIT) {
      // Reverse the rate limit increment since we didn't actually process the request
      await redis.decr(rateLimitKey);
      return NextResponse.json(
        {
          error: "trial_exhausted",
          message: "Sign up to continue using the service.",
          remaining: 0,
        },
        { status: 403 }
      );
    }

    remaining = TRIAL_QUERY_LIMIT - newCount;
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
      // Backend error - decrement the trial counter so user can retry
      if (!LIMITS_DISABLED) {
        await redis.decr(trialKey);
      }
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ...data,
      is_trial: true,
      remaining,
    });
  } catch (error) {
    console.error("Failed to process trial query:", error);
    // Network/fetch error - decrement the trial counter so user can retry
    if (!LIMITS_DISABLED) {
      await redis.decr(trialKey);
    }
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
