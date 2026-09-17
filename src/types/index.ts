export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  company_name?: string;
  role?: UserRole;
  created_at: string;
  updated_at: string;
}

export type PlanType = 'free' | 'pro' | 'business' | 'agency';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  cashfree_subscription_id?: string | null;
  gpay_transaction_id?: string | null;
  upi_ref_id?: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  business_name: string;
  business_url: string;
  industry: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type ScanFrequency = 'daily' | 'weekly' | 'manual';

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  website_url: string;
  description?: string;
  is_active: boolean;
  scan_frequency: ScanFrequency;
  last_scanned_at?: string | null;
  next_scan_at?: string | null;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export type ScanStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface Scan {
  id: string;
  competitor_id: string;
  status: ScanStatus;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  content_hash?: string;
  page_count: number;
  created_at: string;
}

export interface PageRecord {
  id: string;
  scan_id: string;
  url: string;
  title: string;
  content: string;
  content_hash: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type ChangeType =
  | 'new_page'
  | 'deleted_page'
  | 'content_change'
  | 'pricing_change'
  | 'service_change'
  | 'promotion_change'
  | 'faq_change'
  | 'heading_change'
  | 'contact_change'
  | 'hours_change'
  | 'cta_change';

export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedChange {
  id: string;
  competitor_id: string;
  scan_id: string;
  change_type: ChangeType;
  page_url: string;
  old_value: string;
  new_value: string;
  importance: ImportanceLevel;
  detected_at: string;
  created_at: string;
  is_demo?: boolean;
  dismissed?: boolean;
  status?: 'new' | 'reviewed' | 'task_created' | 'dismissed';
}

export interface AIInsight {
  id: string;
  change_id: string;
  summary: string;
  business_impact: string;
  recommendation: string;
  priority: ImportanceLevel;
  confidence: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  project_id?: string;
  type: 'change' | 'scan' | 'subscription' | 'system' | 'opportunity';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  score: number;
  report_data: {
    executive_summary: string;
    major_changes: Array<{
      competitor_name: string;
      change_type: string;
      summary: string;
      date: string;
    }>;
    pricing_changes: string[];
    new_services: string[];
    opportunities: string[];
    recommended_actions: string[];
  };
  created_at: string;
}

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  plan: PlanType;
  amount: number;
  currency: 'INR' | 'USD';
  utr: string;
  upi_id: string;
  payee_name: string;
  status: PaymentRequestStatus;
  admin_notes?: string;
  approved_at?: string;
  rejected_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  subscription_id?: string;
  provider: 'gpay_upi' | 'cashfree' | 'stripe';
  provider_order_id: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: PaymentOrderStatus;
  upi_id?: string;
  upi_url?: string;
  gpay_url?: string;
  utr?: string;
  metadata?: Record<string, any>;
  payment_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface PlanLimits {
  projects: number;
  competitors: number;
  scanFrequency: string;
  maxScansPerWeek: number;
  aiInsights: 'limited' | 'full' | 'advanced';
  teamMembers: number;
  whiteLabel: boolean;
  dailyMonitoring: boolean;
  priceUSD: number;
  priceINR: number;
}

export interface PlanFeatures {
  name: string;
  tagline: string;
  limits: PlanLimits;
  features: string[];
}

export interface OpportunityItem {
  id: string;
  competitor_id: string;
  competitor_name: string;
  competitor_action: string;
  your_status: string;
  recommendation: string;
  priority: ImportanceLevel;
  status: 'open' | 'done' | 'dismissed';
  detected_at: string;
}
