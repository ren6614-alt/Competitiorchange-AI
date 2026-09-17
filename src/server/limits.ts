import { PlanType, PlanLimits } from "../types/index.ts";

/**
 * Free Development Mode Flag:
 * Active by default unless explicitly set to 'false' in environment.
 * Prevents paid resource provisioning, limits request frequency, and safeguards against unexpected API usage.
 */
export const IS_FREE_DEVELOPMENT_MODE: boolean = process.env.FREE_DEVELOPMENT_MODE !== "false";

/**
 * Configurable Application Cost Safeguards:
 * These limits prevent runaway loops, excessive scraping, or unmetered AI usage.
 * Note: These are application-level safeguards and do not promise zero charges from external providers.
 */
export const COST_SAFEGUARDS = {
  // Maximum Gemini AI calls per user per day in development
  maxAiRequestsPerUserDay: Number(process.env.MAX_AI_REQUESTS_PER_USER_DAY) || (IS_FREE_DEVELOPMENT_MODE ? 25 : 100),
  // Maximum page scans per user per day in development
  maxScansPerUserDay: Number(process.env.MAX_SCANS_PER_USER_DAY) || (IS_FREE_DEVELOPMENT_MODE ? 10 : 50),
  // Maximum pages extracted per scan
  maxPagesPerScan: Number(process.env.MAX_PAGES_PER_SCAN) || 3,
  // Maximum retry attempts for crawls and API calls
  maxRetryAttempts: 1,
  // Timeout for web crawling in milliseconds
  crawlTimeoutMs: 5000,
  // Timeout for Gemini API calls in milliseconds
  aiTimeoutMs: 12000,
  // Maximum input characters sent to Gemini prompt
  maxPromptInputChars: 4000,
};

// In-memory daily usage tracking
interface DailyUserUsage {
  date: string; // YYYY-MM-DD
  aiRequests: number;
  scans: number;
}

const userDailyUsageMap = new Map<string, DailyUserUsage>();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getUserUsage(userId: string): DailyUserUsage {
  const today = getTodayString();
  const existing = userDailyUsageMap.get(userId);
  if (!existing || existing.date !== today) {
    const fresh: DailyUserUsage = { date: today, aiRequests: 0, scans: 0 };
    userDailyUsageMap.set(userId, fresh);
    return fresh;
  }
  return existing;
}

/**
 * Checks whether user has exceeded daily AI request limits.
 * Increments usage on success or throws friendly error with cost safety message.
 */
export function checkAndIncrementAiUsage(userId: string): { allowed: boolean; remaining: number; reason?: string } {
  const usage = getUserUsage(userId);
  if (usage.aiRequests >= COST_SAFEGUARDS.maxAiRequestsPerUserDay) {
    return {
      allowed: false,
      remaining: 0,
      reason: "AI analysis is temporarily unavailable because the current free usage limit has been reached. No paid service has been activated.",
    };
  }
  usage.aiRequests += 1;
  return {
    allowed: true,
    remaining: COST_SAFEGUARDS.maxAiRequestsPerUserDay - usage.aiRequests,
  };
}

/**
 * Checks whether user has exceeded daily scan limits.
 */
export function checkAndIncrementScanUsage(userId: string): { allowed: boolean; remaining: number; reason?: string } {
  const usage = getUserUsage(userId);
  if (usage.scans >= COST_SAFEGUARDS.maxScansPerUserDay) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Daily scan limit reached (${COST_SAFEGUARDS.maxScansPerUserDay} scans/day). Please wait until tomorrow or review existing change insights.`,
    };
  }
  usage.scans += 1;
  return {
    allowed: true,
    remaining: COST_SAFEGUARDS.maxScansPerUserDay - usage.scans,
  };
}

export function getUserDailyUsageStats(userId: string): { aiRequests: number; maxAi: number; scans: number; maxScans: number } {
  const usage = getUserUsage(userId);
  return {
    aiRequests: usage.aiRequests,
    maxAi: COST_SAFEGUARDS.maxAiRequestsPerUserDay,
    scans: usage.scans,
    maxScans: COST_SAFEGUARDS.maxScansPerUserDay,
  };
}

export {
  PLAN_CONFIGS,
  canAddProject,
  canAddCompetitor,
  canRunScan,
} from "../constants/plans.ts";

