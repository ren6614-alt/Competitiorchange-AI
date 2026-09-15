import {
  Profile,
  Subscription,
  Project,
  Competitor,
  Scan,
  DetectedChange,
  AIInsight,
  NotificationItem,
  Report,
  OpportunityItem,
  PlanType,
  PaymentOrder
} from "../types/index.ts";

const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // Include user ID header if present in localStorage
  const savedUser = localStorage.getItem("cc_user_id");
  if (savedUser) {
    headers.set("x-user-id", savedUser);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; app: string; ai_configured: boolean; cashfree_configured: boolean; crawler_mode: string }>("/health"),

  // Auth
  getCurrentUser: () => request<{ user: Profile; subscription: Subscription }>("/auth/me"),
  login: (credentials: { email: string; password?: string }) =>
    request<{ user: Profile; subscription: Subscription; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  signup: (payload: { full_name: string; email: string; company_name?: string; password?: string }) =>
    request<{ user: Profile; subscription: Subscription; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ success: boolean }>("/auth/logout", { method: "POST" }),
  switchRole: () => request<{ success: boolean; profile: Profile }>("/auth/switch-role", { method: "POST" }),

  // Projects
  getProjects: () => request<{ projects: Project[] }>("/projects"),
  getProject: (id: string) => request<{ project: Project; competitors: Competitor[] }>(`/projects/${id}`),
  createProject: (data: { name: string; business_name: string; business_url: string; industry: string; description?: string }) =>
    request<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) => request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  // Competitors
  getCompetitors: (projectId: string) => request<{ competitors: Competitor[] }>(`/projects/${projectId}/competitors`),
  getCompetitorDetail: (id: string) =>
    request<{ competitor: Competitor; project: Project; scans: Scan[]; changes: any[]; pages: any[] }>(`/competitors/${id}`),
  addCompetitor: (projectId: string, data: { name: string; website_url: string; description?: string; scan_frequency?: string }) =>
    request<{ competitor: Competitor }>(`/projects/${projectId}/competitors`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleCompetitor: (id: string) => request<{ competitor: Competitor }>(`/competitors/${id}/toggle`, { method: "PATCH" }),
  deleteCompetitor: (id: string) => request<{ success: boolean }>(`/competitors/${id}`, { method: "DELETE" }),
  scanCompetitor: (id: string) =>
    request<{ scan: Scan; changes: DetectedChange[]; insights: AIInsight[] }>(`/competitors/${id}/scan`, { method: "POST" }),

  // Changes
  getChanges: () => request<{ changes: (DetectedChange & { competitor_name: string; ai_insight?: AIInsight })[] }>("/changes"),
  updateChangeStatus: (id: string, status: string) =>
    request<{ change: DetectedChange }>(`/changes/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Opportunities
  getOpportunities: () => request<{ opportunities: OpportunityItem[] }>("/opportunities"),
  updateOpportunity: (id: string, status: string) =>
    request<{ opportunity: OpportunityItem }>(`/opportunities/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Reports
  getReports: () => request<{ reports: Report[] }>("/reports"),
  getReport: (id: string) => request<{ report: Report }>(`/reports/${id}`),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>("/notifications"),
  markAllNotificationsRead: () => request<{ success: boolean }>("/notifications/mark-all-read", { method: "PATCH" }),

  // Payments & Cashfree
  createPaymentOrder: (plan: PlanType, currency: "INR" | "USD" = "INR") =>
    request<{
      orderId: string;
      paymentSessionId: string;
      orderAmount: number;
      orderCurrency: string;
      environment: string;
    }>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ plan, currency }),
    }),
  verifyPayment: (orderId: string) =>
    request<{ success: boolean; status: string; plan?: string; message?: string }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),
  getSubscriptionInfo: () => request<{ subscription: Subscription; orders: PaymentOrder[] }>("/subscriptions/current"),
  cancelSubscription: () => request<{ success: boolean; subscription: Subscription }>("/subscriptions/cancel", { method: "POST" }),

  // Admin
  getAdminMetrics: () => request<any>("/admin/metrics"),

  // Test Suite
  runAutomatedTests: () =>
    request<{ allPassed: boolean; total: number; passed: number; results: Array<{ test: string; status: "PASSED" | "FAILED"; details: string }> }>(
      "/tests/run",
      { method: "POST" }
    ),
};
