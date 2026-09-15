import { PlanType, PlanLimits } from "../types/index.ts";

export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  free: {
    projects: 1,
    competitors: 1,
    scanFrequency: 'weekly',
    maxScansPerWeek: 1,
    aiInsights: 'limited',
    teamMembers: 1,
    whiteLabel: false,
    dailyMonitoring: false,
    priceUSD: 0,
    priceINR: 0,
  },
  pro: {
    projects: 3,
    competitors: 10,
    scanFrequency: 'daily',
    maxScansPerWeek: 70,
    aiInsights: 'full',
    teamMembers: 1,
    whiteLabel: false,
    dailyMonitoring: true,
    priceUSD: 29,
    priceINR: 2499,
  },
  business: {
    projects: 10,
    competitors: 50,
    scanFrequency: 'daily',
    maxScansPerWeek: 350,
    aiInsights: 'advanced',
    teamMembers: 5,
    whiteLabel: false,
    dailyMonitoring: true,
    priceUSD: 79,
    priceINR: 6699,
  },
  agency: {
    projects: 100, // Unlimited client projects within fair use
    competitors: 250,
    scanFrequency: 'daily',
    maxScansPerWeek: 1750,
    aiInsights: 'advanced',
    teamMembers: 20,
    whiteLabel: true,
    dailyMonitoring: true,
    priceUSD: 299,
    priceINR: 24999,
  },
};

export function canAddProject(plan: PlanType, currentProjectCount: number): boolean {
  const limit = PLAN_CONFIGS[plan].projects;
  return currentProjectCount < limit;
}

export function canAddCompetitor(plan: PlanType, currentCompetitorCount: number): boolean {
  const limit = PLAN_CONFIGS[plan].competitors;
  return currentCompetitorCount < limit;
}

export function canRunScan(plan: PlanType, scansThisWeek: number): boolean {
  const limit = PLAN_CONFIGS[plan].maxScansPerWeek;
  return scansThisWeek < limit;
}
