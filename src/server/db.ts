import {
  Profile,
  Subscription,
  Project,
  Competitor,
  Scan,
  PageRecord,
  DetectedChange,
  AIInsight,
  NotificationItem,
  Report,
  PaymentOrder,
  PaymentEvent,
  PaymentRequest,
  PlanType,
  OpportunityItem
} from "../types/index.ts";
import { analyzeCompetitorChange } from "./gemini.ts";
import { getCrawlerProvider, detectPageChanges, CrawledPage } from "./crawler.ts";
import { emailService } from "./email.ts";
import { canAddProject, canAddCompetitor, canRunScan, PLAN_CONFIGS, checkAndIncrementScanUsage, COST_SAFEGUARDS } from "./limits.ts";

/**
 * Server database state store with full relational consistency and RLS-equivalent isolation
 */
class ServerDatabase {
  public profiles: Map<string, Profile> = new Map();
  public subscriptions: Map<string, Subscription> = new Map();
  public projects: Map<string, Project> = new Map();
  public competitors: Map<string, Competitor> = new Map();
  public scans: Map<string, Scan> = new Map();
  public pages: Map<string, PageRecord> = new Map();
  public changes: Map<string, DetectedChange> = new Map();
  public aiInsights: Map<string, AIInsight> = new Map();
  public notifications: Map<string, NotificationItem> = new Map();
  public reports: Map<string, Report> = new Map();
  public paymentOrders: Map<string, PaymentOrder> = new Map();
  public paymentEvents: Map<string, PaymentEvent> = new Map();
  public opportunities: Map<string, OpportunityItem> = new Map();
  public paymentRequests: Map<string, PaymentRequest> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // 1. Demo User Profile
    const userId = "usr_demo_founder_101";
    const adminId = "usr_admin_master_001";

    this.profiles.set(userId, {
      id: userId,
      full_name: "Alex Vance",
      email: "founder@metrodental.com",
      company_name: "Metro Dental Group",
      role: "user",
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.profiles.set(adminId, {
      id: adminId,
      full_name: "Platform Administrator",
      email: "admin@competitorchange.ai",
      company_name: "CompetitorChange AI Operations",
      role: "admin",
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Default Subscriptions
    this.subscriptions.set(userId, {
      id: "sub_pro_101",
      user_id: userId,
      plan: "pro",
      status: "active",
      gpay_transaction_id: "gpay_ord_sample_88",
      upi_ref_id: "UTR491028371923",
      current_period_start: new Date(Date.now() - 5 * 86400000).toISOString(),
      current_period_end: new Date(Date.now() + 25 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 3. Demo Project
    const projId = "proj_dental_metro_1";
    this.projects.set(projId, {
      id: projId,
      user_id: userId,
      name: "Metro Dental Competitive Defense",
      business_name: "Metro Dental Clinic",
      business_url: "https://metrodentalclinic.com",
      industry: "Healthcare & Dental",
      description: "Monitoring prime local competitors for dental cosmetic, emergency, and Invisalign pricing shifts.",
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 4. Demo Competitor ("SmileCare Dental")
    const compId = "comp_smilecare_01";
    this.competitors.set(compId, {
      id: compId,
      project_id: projId,
      name: "SmileCare Dental",
      website_url: "https://smilecaredental.com",
      description: "Direct downtown competitor specializing in cosmetic dentistry & aligners.",
      is_active: true,
      scan_frequency: "daily",
      last_scanned_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      next_scan_at: new Date(Date.now() + 22 * 3600000).toISOString(),
      is_demo: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 5. Historical Scan
    const scanId = "scan_init_01";
    this.scans.set(scanId, {
      id: scanId,
      competitor_id: compId,
      status: "completed",
      started_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 3600000 + 45000).toISOString(),
      content_hash: "hash_smilecare_v2_f839a",
      page_count: 3,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    // 6. Demo Detected Changes (as requested: Invisalign page, pricing change, emergency service, FAQ, promotion)
    const change1Id = "chg_promo_invisalign";
    this.changes.set(change1Id, {
      id: change1Id,
      competitor_id: compId,
      scan_id: scanId,
      change_type: "promotion_change",
      page_url: "https://smilecaredental.com/pricing",
      old_value: "Invisalign Full Treatment: $4,200",
      new_value: "Invisalign Full Treatment now starting at $3,499 (Save $700) with 0% financing for 12 months.",
      importance: "high",
      detected_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      is_demo: true,
      status: "new",
    });

    this.aiInsights.set("ai_insight_1", {
      id: "ai_insight_1",
      change_id: change1Id,
      summary: "SmileCare Dental lowered Invisalign prices by $700 and introduced 12-month 0% financing.",
      business_impact: "SmileCare is actively bidding on local search keywords for orthodontic aligners; this price point makes them 15% cheaper than typical regional averages.",
      recommendation: "Review your pricing page and prominently highlight your comprehensive inclusions (e.g., complimentary retainers, teeth whitening post-treatment) to justify premium positioning.",
      priority: "high",
      confidence: 0.94,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    const change2Id = "chg_service_emergency";
    this.changes.set(change2Id, {
      id: change2Id,
      competitor_id: compId,
      scan_id: scanId,
      change_type: "service_change",
      page_url: "https://smilecaredental.com/emergency",
      old_value: "[Page did not exist in previous scan]",
      new_value: "Emergency Dental Clinic open 24/7. Guaranteed response within 60 minutes for severe toothaches and dental trauma.",
      importance: "critical",
      detected_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      is_demo: true,
      status: "new",
    });

    this.aiInsights.set("ai_insight_2", {
      id: "ai_insight_2",
      change_id: change2Id,
      summary: "Competitor launched a brand-new dedicated 24/7 Emergency Dentistry department.",
      business_impact: "The competitor explicitly targets high-urgency, high-value emergency dentistry patients who often convert into lifelong routine care patients.",
      recommendation: "Publish an emergency triage phone line or same-day appointment badge on your website hero banner.",
      priority: "critical",
      confidence: 0.96,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    });

    const change3Id = "chg_faq_insurance";
    this.changes.set(change3Id, {
      id: change3Id,
      competitor_id: compId,
      scan_id: scanId,
      change_type: "faq_change",
      page_url: "https://smilecaredental.com/",
      old_value: "Accepted Insurance: Delta Dental, Cigna.",
      new_value: "Accepted Insurance: Delta Dental, Cigna, MetLife, Aetna, Guardian, and in-house uninsured wellness plans.",
      importance: "medium",
      detected_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      is_demo: true,
      status: "reviewed",
    });

    this.aiInsights.set("ai_insight_3", {
      id: "ai_insight_3",
      change_id: change3Id,
      summary: "Competitor expanded accepted insurance providers to 4 additional major networks and added in-house wellness plans.",
      business_impact: "Broadens their eligibility pool and eliminates out-of-pocket hesitation for uninsured patients.",
      recommendation: "Ensure your accepted insurance list is indexed on your footer and Google Business Profile.",
      priority: "medium",
      confidence: 0.91,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    });

    // 7. Demo Opportunities
    this.opportunities.set("opp_1", {
      id: "opp_1",
      competitor_id: compId,
      competitor_name: "SmileCare Dental",
      competitor_action: "Launched 24/7 Emergency Dental Department",
      your_status: "No dedicated 24/7 or same-day emergency landing page detected on your website.",
      recommendation: "Create a dedicated Emergency Dentistry page highlighting same-day appointment availability.",
      priority: "critical",
      status: "open",
      detected_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    });

    this.opportunities.set("opp_2", {
      id: "opp_2",
      competitor_id: compId,
      competitor_name: "SmileCare Dental",
      competitor_action: "Advertised 0% interest 12-month financing on Invisalign",
      your_status: "Your website only mentions lump-sum insurance co-pays.",
      recommendation: "Highlight monthly payment plans (e.g. 'From $99/month') next to cosmetic and aligner services.",
      priority: "high",
      status: "open",
      detected_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    // 8. Notifications
    this.notifications.set("notif_1", {
      id: "notif_1",
      user_id: userId,
      project_id: projId,
      type: "change",
      title: "Critical Competitor Move",
      message: "SmileCare Dental launched 24/7 Emergency Dentistry page.",
      is_read: false,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    });

    this.notifications.set("notif_2", {
      id: "notif_2",
      user_id: userId,
      project_id: projId,
      type: "scan",
      title: "Daily Scan Completed",
      message: "Scanned SmileCare Dental: 3 pages checked, 3 changes detected.",
      is_read: true,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    // 9. Demo Monthly Intelligence Report
    this.reports.set("rep_metro_month", {
      id: "rep_metro_month",
      project_id: projId,
      title: "September 2026 Competitive Intelligence Dossier",
      summary: "Major movement in cosmetic aligner pricing (-15%) and new emergency service footprint by key regional competitor.",
      score: 88,
      report_data: {
        executive_summary: "SmileCare Dental has pivoted aggressively into emergency care and discounted aligners. Their price drop is supported by 0% financing terms. Your clinic retains the advantage in clinical experience and doctor tenure.",
        major_changes: [
          {
            competitor_name: "SmileCare Dental",
            change_type: "pricing_change",
            summary: "Lowered Invisalign starting price from $4,200 to $3,499",
            date: "2026-09-14",
          },
          {
            competitor_name: "SmileCare Dental",
            change_type: "service_change",
            summary: "Opened 24/7 Emergency Dental clinic with 60-min response",
            date: "2026-09-14",
          },
        ],
        pricing_changes: ["SmileCare Dental: -16.7% discount on clear aligners ($3,499 vs $4,200)"],
        new_services: ["SmileCare Dental: 24/7 Emergency Dental Care with on-call surgical team"],
        opportunities: [
          "Deploy same-day emergency appointment banner",
          "Package free teeth whitening with aligner consultations",
        ],
        recommended_actions: [
          "Launch dedicated Emergency Dental triage landing page",
          "Promote patient testimonial videos demonstrating superior cosmetic results",
        ],
      },
      created_at: new Date(Date.now() - 86400000).toISOString(),
    });

    // 10. Sample Payment Order & Payment Requests
    this.paymentOrders.set("ord_sample_01", {
      id: "ord_sample_01",
      user_id: userId,
      provider: "gpay_upi",
      provider_order_id: "gpay_ord_918237912",
      amount: 2499,
      currency: "INR",
      status: "PAID",
      upi_id: "competitorchange@oksbi",
      utr: "429182049182",
      metadata: { plan: "pro", billingCycle: "monthly" },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    this.paymentRequests.set("req_sample_01", {
      id: "req_sample_01",
      user_id: userId,
      user_email: "founder@metrodental.com",
      user_name: "Alex Vance",
      plan: "pro",
      amount: 2499,
      currency: "INR",
      utr: "429182049182",
      upi_id: "competitorchange@oksbi",
      payee_name: "CompetitorChange AI",
      status: "approved",
      approved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      reviewed_by: "usr_admin_master_001",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    this.paymentRequests.set("req_sample_pending", {
      id: "req_sample_pending",
      user_id: "usr_demo_founder_102",
      user_email: "contact@rivalsoftware.io",
      user_name: "Sarah Lin",
      plan: "pro",
      amount: 2499,
      currency: "INR",
      utr: "518392019482",
      upi_id: "competitorchange@oksbi",
      payee_name: "CompetitorChange AI",
      status: "pending",
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });
  }

  // --- CRUD Operations with RLS simulation ---

  getUserProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.user_id === userId);
  }

  createProject(userId: string, data: { name: string; business_name: string; business_url: string; industry: string; description: string }): Project {
    const userSub = this.subscriptions.get(userId) || { plan: 'free' };
    const existingCount = this.getUserProjects(userId).length;

    if (!canAddProject(userSub.plan as PlanType, existingCount)) {
      throw new Error(`You've reached your plan limit (${PLAN_CONFIGS[userSub.plan as PlanType].projects} projects). Upgrade to continue monitoring.`);
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const project: Project = {
      id,
      user_id: userId,
      name: data.name,
      business_name: data.business_name,
      business_url: data.business_url,
      industry: data.industry || 'General',
      description: data.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.projects.set(id, project);
    return project;
  }

  getProjectCompetitors(projectId: string, userId: string): Competitor[] {
    const project = this.projects.get(projectId);
    if (!project || project.user_id !== userId) {
      return [];
    }
    return Array.from(this.competitors.values()).filter(c => c.project_id === projectId);
  }

  addCompetitor(userId: string, projectId: string, data: { name: string; website_url: string; description?: string; scan_frequency?: any }): Competitor {
    const project = this.projects.get(projectId);
    if (!project || project.user_id !== userId) {
      throw new Error("Unauthorized or project not found");
    }

    // Check plan limit
    const userSub = this.subscriptions.get(userId) || { plan: 'free' };
    const allUserComps = Array.from(this.competitors.values()).filter(c => {
      const p = this.projects.get(c.project_id);
      return p && p.user_id === userId;
    });

    if (!canAddCompetitor(userSub.plan as PlanType, allUserComps.length)) {
      throw new Error(`You've reached your plan limit (${PLAN_CONFIGS[userSub.plan as PlanType].competitors} competitors). Upgrade to continue monitoring.`);
    }

    // Validate URL
    let normalizedUrl = data.website_url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new Error("Please enter a valid website URL.");
    }

    // Prevent duplicate competitors within same project
    const existing = Array.from(this.competitors.values()).find(
      c => c.project_id === projectId && c.website_url.toLowerCase() === normalizedUrl.toLowerCase()
    );
    if (existing) {
      throw new Error("This competitor website is already registered in this project.");
    }

    const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const competitor: Competitor = {
      id,
      project_id: projectId,
      name: data.name,
      website_url: normalizedUrl,
      description: data.description || '',
      is_active: true,
      scan_frequency: data.scan_frequency || 'daily',
      last_scanned_at: null,
      next_scan_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.competitors.set(id, competitor);
    return competitor;
  }

  async runScan(userId: string, competitorId: string): Promise<{ scan: Scan; changes: DetectedChange[]; insights: AIInsight[] }> {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) {
      throw new Error("Competitor not found");
    }

    const project = this.projects.get(competitor.project_id);
    if (!project || project.user_id !== userId) {
      throw new Error("Unauthorized: you do not own this competitor.");
    }

    // Cost Safeguard: Check daily scan limits per user
    const scanQuota = checkAndIncrementScanUsage(userId);
    if (!scanQuota.allowed) {
      throw new Error(scanQuota.reason || "Daily scan limit reached for free tier.");
    }

    // 1. Create scan record
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const scan: Scan = {
      id: scanId,
      competitor_id: competitorId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      page_count: 0,
      created_at: new Date().toISOString(),
    };
    this.scans.set(scanId, scan);

    // 2. Fetch previous pages for this competitor
    const previousScans = Array.from(this.scans.values())
      .filter(s => s.competitor_id === competitorId && s.status === 'completed' && s.id !== scanId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let previousPages: CrawledPage[] = [];
    if (previousScans.length > 0) {
      const lastScanId = previousScans[0].id;
      previousPages = Array.from(this.pages.values())
        .filter(p => p.scan_id === lastScanId)
        .map(p => ({
          url: p.url,
          title: p.title,
          content: p.content,
          content_hash: p.content_hash,
        }));
    }

    // 3. Run crawler
    const crawler = getCrawlerProvider();
    const crawlResult = await crawler.crawl(competitor.website_url);

    // Cost Safeguard: Cap pages saved per scan
    const pagesToSave = crawlResult.pages.slice(0, COST_SAFEGUARDS.maxPagesPerScan);

    // 4. Save crawled pages
    for (const p of pagesToSave) {
      const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      this.pages.set(pageId, {
        id: pageId,
        scan_id: scanId,
        url: p.url,
        title: p.title,
        content: p.content,
        content_hash: p.content_hash,
        metadata: p.metadata,
        created_at: new Date().toISOString(),
      });
    }

    // 5. Detect semantic changes
    const diffs = detectPageChanges(previousPages, pagesToSave);

    const detectedChanges: DetectedChange[] = [];
    const generatedInsights: AIInsight[] = [];

    // If first scan or diffs detected, process them
    const diffList = diffs.length > 0 ? diffs : [
      {
        change_type: 'content_change' as const,
        page_url: competitor.website_url,
        old_value: 'Baseline snapshot established.',
        new_value: pagesToSave[0]?.content.slice(0, 300) || 'Baseline content captured.',
        importance: 'low' as const,
      }
    ];

    for (const diff of diffList) {
      const changeId = `chg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const changeRecord: DetectedChange = {
        id: changeId,
        competitor_id: competitorId,
        scan_id: scanId,
        change_type: diff.change_type,
        page_url: diff.page_url,
        old_value: diff.old_value,
        new_value: diff.new_value,
        importance: diff.importance,
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        status: 'new',
      };
      this.changes.set(changeId, changeRecord);
      detectedChanges.push(changeRecord);

      // 6. Gemini AI Analysis for meaningful changes (guarded with cost controls & fallback)
      try {
        const aiResult = await analyzeCompetitorChange({
          userId,
          competitorName: competitor.name,
          competitorUrl: competitor.website_url,
          changeType: diff.change_type,
          oldContent: diff.old_value,
          newContent: diff.new_value,
          pageUrl: diff.page_url,
        });

        const insightId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const insight: AIInsight = {
          id: insightId,
          change_id: changeId,
          summary: aiResult.summary,
          business_impact: aiResult.business_impact,
          recommendation: aiResult.recommended_action,
          priority: aiResult.priority,
          confidence: aiResult.confidence,
          created_at: new Date().toISOString(),
        };
        this.aiInsights.set(insightId, insight);
        generatedInsights.push(insight);

        // If High or Critical, generate opportunity and email alert
        if (aiResult.priority === 'high' || aiResult.priority === 'critical') {
          const oppId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          this.opportunities.set(oppId, {
            id: oppId,
            competitor_id: competitorId,
            competitor_name: competitor.name,
            competitor_action: aiResult.summary,
            your_status: "Potential competitive gap identified.",
            recommendation: aiResult.recommended_action,
            priority: aiResult.priority,
            status: "open",
            detected_at: new Date().toISOString(),
          });

          // Email notification
          const profile = this.profiles.get(userId);
          if (profile?.email) {
            await emailService.sendHighPriorityChangeAlert({
              to: profile.email,
              competitorName: competitor.name,
              changeTitle: aiResult.summary,
              importance: aiResult.priority,
              whyItMatters: aiResult.business_impact,
              recommendedAction: aiResult.recommended_action,
              dashboardUrl: `${(process.env.APP_URL || "https://competitorchangeai.netlify.app/").replace(/\/$/, "")}/dashboard`,
            });
          }
        }
      } catch (err: any) {
        console.error("AI Insight Generation error:", err.message);
      }
    }

    // 7. Update scan status
    scan.status = "completed";
    scan.completed_at = new Date().toISOString();
    scan.content_hash = crawlResult.overallHash;
    scan.page_count = crawlResult.pageCount;
    this.scans.set(scanId, scan);

    // Update competitor last scanned timestamp
    competitor.last_scanned_at = new Date().toISOString();
    this.competitors.set(competitorId, competitor);

    // 8. Add notification
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.notifications.set(notifId, {
      id: notifId,
      user_id: userId,
      project_id: project.id,
      type: "scan",
      title: `Scan Completed: ${competitor.name}`,
      message: `Detected ${detectedChanges.length} changes and generated AI recommendations.`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      scan,
      changes: detectedChanges,
      insights: generatedInsights,
    };
  }

  // --- Manual UPI Payment Requests & Entitlement Activation ---

  createPaymentRequest(data: {
    userId: string;
    email: string;
    name?: string;
    plan: PlanType;
    amount: number;
    currency?: 'INR' | 'USD';
    utr: string;
    upiId: string;
    payeeName: string;
  }): PaymentRequest {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRequest: PaymentRequest = {
      id,
      user_id: data.userId,
      user_email: data.email,
      user_name: data.name || "Founder",
      plan: data.plan,
      amount: data.amount,
      currency: data.currency || "INR",
      utr: data.utr.trim(),
      upi_id: data.upiId,
      payee_name: data.payeeName,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.paymentRequests.set(id, newRequest);

    // Also record in payment orders history as PENDING
    const poId = `po_${id}`;
    this.paymentOrders.set(poId, {
      id: poId,
      user_id: data.userId,
      provider: "gpay_upi",
      provider_order_id: id,
      amount: data.amount,
      currency: "INR",
      status: "PENDING",
      upi_id: data.upiId,
      utr: data.utr.trim(),
      metadata: {
        plan: data.plan,
        user_email: data.email,
        type: "manual_upi",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return newRequest;
  }

  getUserPaymentRequests(userId: string): PaymentRequest[] {
    return Array.from(this.paymentRequests.values())
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllPaymentRequests(): PaymentRequest[] {
    return Array.from(this.paymentRequests.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  updatePaymentRequestStatus(
    requestId: string,
    adminUserId: string,
    status: "approved" | "rejected",
    adminNotes?: string
  ): { success: boolean; request?: PaymentRequest; error?: string } {
    const req = this.paymentRequests.get(requestId);
    if (!req) {
      return { success: false, error: "Payment request not found" };
    }

    req.status = status;
    req.admin_notes = adminNotes;
    req.reviewed_by = adminUserId;
    req.updated_at = new Date().toISOString();

    if (status === "approved") {
      req.approved_at = new Date().toISOString();

      // ACTIVATE Entitlement/Subscription for user
      const now = new Date().toISOString();
      const existingSub: Subscription = this.subscriptions.get(req.user_id) || {
        id: `sub_${req.user_id}`,
        user_id: req.user_id,
        plan: "free",
        status: "active",
        current_period_start: now,
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: now,
        updated_at: now,
      };

      existingSub.plan = req.plan;
      existingSub.status = "active";
      existingSub.gpay_transaction_id = req.id;
      existingSub.upi_ref_id = req.utr;
      existingSub.current_period_start = now;
      existingSub.current_period_end = new Date(Date.now() + 30 * 86400000).toISOString();
      existingSub.updated_at = now;
      this.subscriptions.set(req.user_id, existingSub);

      // Update associated payment order
      const po = Array.from(this.paymentOrders.values()).find(
        (o) => o.provider_order_id === req.id || o.utr === req.utr
      );
      if (po) {
        po.status = "PAID";
        po.updated_at = new Date().toISOString();
        this.paymentOrders.set(po.id, po);
      }

      // Add user notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      this.notifications.set(notifId, {
        id: notifId,
        user_id: req.user_id,
        type: "system",
        title: `Payment Approved: ${req.plan.toUpperCase()} Plan Activated!`,
        message: `Your manual UPI payment (UTR: ${req.utr}) of ₹${req.amount} has been verified and approved by the admin. Your Pro limits are active!`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else if (status === "rejected") {
      req.rejected_at = new Date().toISOString();
      const po = Array.from(this.paymentOrders.values()).find(
        (o) => o.provider_order_id === req.id || o.utr === req.utr
      );
      if (po) {
        po.status = "FAILED";
        po.updated_at = new Date().toISOString();
        this.paymentOrders.set(po.id, po);
      }

      // Add user notification
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      this.notifications.set(notifId, {
        id: notifId,
        user_id: req.user_id,
        type: "system",
        title: `Payment Verification Unsuccessful`,
        message: `Your payment request for ₹${req.amount} (UTR: ${req.utr}) could not be verified. Reason: ${adminNotes || "Transaction could not be matched with bank statement."}`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    this.paymentRequests.set(requestId, req);
    return { success: true, request: req };
  }

  // Row-Level Security Equivalent Isolation Helpers
  getUserCompetitorIds(userId: string): Set<string> {
    const userProjects = this.getUserProjects(userId);
    const userProjectIds = new Set(userProjects.map((p) => p.id));
    const competitorIds = new Set<string>();
    for (const comp of this.competitors.values()) {
      if (userProjectIds.has(comp.project_id)) {
        competitorIds.add(comp.id);
      }
    }
    return competitorIds;
  }

  userOwnsCompetitor(userId: string, competitorId: string): boolean {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) return false;
    const project = this.projects.get(competitor.project_id);
    return project?.user_id === userId;
  }

  userOwnsChange(userId: string, changeId: string): boolean {
    const change = this.changes.get(changeId);
    if (!change) return false;
    return this.userOwnsCompetitor(userId, change.competitor_id);
  }

  getUserOpportunities(userId: string): OpportunityItem[] {
    const competitorIds = this.getUserCompetitorIds(userId);
    return Array.from(this.opportunities.values()).filter((o) =>
      competitorIds.has(o.competitor_id)
    );
  }

  getUserReports(userId: string): Report[] {
    const userProjects = this.getUserProjects(userId);
    const userProjectIds = new Set(userProjects.map((p) => p.id));
    return Array.from(this.reports.values()).filter((r) =>
      userProjectIds.has(r.project_id)
    );
  }
}

export const db = new ServerDatabase();

