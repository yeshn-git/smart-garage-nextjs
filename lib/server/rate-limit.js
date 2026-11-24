/* =========================================================================
   lib/server/rate-limit.js - limits AI usage per user
   - Daily limit stored in the database (ai_usage table) -> shared by all
     Vercel serverless instances.
   - Short burst limit (per minute) kept in memory (best-effort).
   - Login attempt limit (in memory) slows down password guessing.
   ========================================================================= */
import { ApiError } from "./errors.js";
import { query } from "./db.js";

export const AI_PER_MINUTE = 5;
export const AI_PER_DAY = 30;
const minuteBuckets = new Map();
const loginBuckets = new Map();

function bump(map, key, windowMs, limit, now) {
  const w = Math.floor(now / windowMs);
  const b = map.get(key);
  const entry = b && b.w === w ? b : { w, n: 0 };
  entry.n++;
  map.set(key, entry);
  if (map.size > 5000) map.clear();
  return entry.n > limit;
}

/** Per-minute burst check (pure, unit-tested). */
export function checkBurst(userId, now = Date.now()) {
  if (bump(minuteBuckets, userId, 60000, AI_PER_MINUTE, now)) {
    throw new ApiError(429, "rate_limited", "Too many AI requests. Please wait a minute.");
  }
}

export async function checkAiLimit(userId) {
  checkBurst(userId);
  const rows = await query(
    `INSERT INTO ai_usage (user_id, day, count) VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET count = ai_usage.count + 1
     RETURNING count`,
    [userId]
  );
  if (rows[0]?.count > AI_PER_DAY) {
    throw new ApiError(429, "rate_limited", `Daily AI limit of ${AI_PER_DAY} analyses reached. Try again tomorrow.`);
  }
}

export function checkLoginAttempts(key, now = Date.now()) {
  if (bump(loginBuckets, key, 5 * 60000, 10, now)) {
    throw new ApiError(429, "rate_limited", "Too many login attempts. Please wait 5 minutes.");
  }
}
