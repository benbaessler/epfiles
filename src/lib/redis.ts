import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TTL for trial keys: 30 days in seconds
export const TRIAL_TTL_SECONDS = 30 * 24 * 60 * 60;

// Rate limit: max anonymous requests per IP per hour
export const ANON_RATE_LIMIT_PER_HOUR = 5;
export const ANON_RATE_LIMIT_TTL_SECONDS = 60 * 60;

