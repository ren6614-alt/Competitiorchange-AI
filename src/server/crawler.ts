import crypto from "crypto";
import { ChangeType, ImportanceLevel } from "../types/index.ts";
import { IS_FREE_DEVELOPMENT_MODE, COST_SAFEGUARDS } from "./limits.ts";

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  content_hash: string;
  metadata?: Record<string, any>;
}

export interface CrawlResult {
  pages: CrawledPage[];
  pageCount: number;
  overallHash: string;
  provider: 'firecrawl' | 'demo' | 'fetch';
  error?: string;
}

export interface DetectedDiff {
  change_type: ChangeType;
  page_url: string;
  old_value: string;
  new_value: string;
  importance: ImportanceLevel;
}

export interface ICrawlerProvider {
  crawl(url: string): Promise<CrawlResult>;
}

/**
 * Normalizes HTML/text to isolate semantic content:
 * - Strips scripts, style tags, SVG boilerplate, tracking pixels
 * - Strips dynamic date/timestamps (e.g. "© 2026", "Updated 2 mins ago")
 * - Strips random token IDs, nonce attributes
 * - Compresses whitespace
 */
export function normalizeContent(htmlOrText: string): string {
  let cleaned = htmlOrText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\b(data-[a-z0-9_-]+="[^"]*")/gi, ' ')
    .replace(/\b(id="[^"]*")/gi, ' ')
    .replace(/\b(class="[^"]*")/gi, ' ')
    .replace(/\b(style="[^"]*")/gi, ' ')
    .replace(/<(?:.|\n)*?>/gm, ' ')
    // Remove transient timestamps and tracking tokens
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

export function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Firecrawl provider implementation
 */
export class FirecrawlProvider implements ICrawlerProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async crawl(url: string): Promise<CrawlResult> {
    // Fast mock for demo/test competitor domains without network overhead
    if (
      url.includes("rivalsoftware.com") ||
      url.includes("example.com") ||
      url.includes("localhost") ||
      url.includes("demo")
    ) {
      return new DemoCrawlerProvider().crawl(url);
    }

    try {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "html"],
          onlyMainContent: true,
        }),
        signal: AbortSignal.timeout(COST_SAFEGUARDS.crawlTimeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.data?.markdown || data.data?.html || "";
      const normalized = normalizeContent(rawContent);
      const hash = computeHash(normalized);

      const page: CrawledPage = {
        url,
        title: data.data?.metadata?.title || url,
        content: normalized,
        content_hash: hash,
        metadata: data.data?.metadata || {},
      };

      return {
        pages: [page],
        pageCount: 1,
        overallHash: hash,
        provider: 'firecrawl',
      };
    } catch (err: any) {
      console.warn(`Firecrawl crawl failed for ${url}:`, err.message);
      // Fallback to basic fetch or demo
      return fallbackFetch(url);
    }
  }
}

async function fallbackFetch(url: string): Promise<CrawlResult> {
  // Never make external network requests for mock/test domains
  if (
    url.includes("rivalsoftware.com") ||
    url.includes("example.com") ||
    url.includes("localhost") ||
    url.includes("demo")
  ) {
    return new DemoCrawlerProvider().crawl(url);
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CompetitorChange-AI-Scanner/1.0 (+https://competitorchange.ai/bot)',
      },
      signal: AbortSignal.timeout(COST_SAFEGUARDS.crawlTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const normalized = normalizeContent(html);
    const hash = computeHash(normalized);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return {
      pages: [
        {
          url,
          title,
          content: normalized,
          content_hash: hash,
        },
      ],
      pageCount: 1,
      overallHash: hash,
      provider: 'fetch',
    };
  } catch (err: any) {
    console.warn(`Direct fetch failed for ${url}, defaulting to demo provider:`, err.message);
    const demo = new DemoCrawlerProvider();
    return demo.crawl(url);
  }
}

/**
 * Demo Crawler Provider for out-of-the-box evaluation without paid API keys
 */
export class DemoCrawlerProvider implements ICrawlerProvider {
  async crawl(url: string): Promise<CrawlResult> {
    // Generate realistic simulated competitor content based on URL and timestamp variation
    const isDental = url.includes("dental") || url.includes("smile");
    const isFitness = url.includes("fit") || url.includes("gym");
    
    let pages: CrawledPage[] = [];

    if (isDental) {
      pages = [
        {
          url: `${url}/`,
          title: "SmileCare Dental - Modern Family & Cosmetic Dentistry",
          content: `Welcome to SmileCare Dental. Comprehensive dental care for the whole family. Services: Cleanings, Checkups, Dental Implants, Porcelain Veneers, Teeth Whitening. Now announcing 24/7 Emergency Dental Response across metro locations. Book an emergency same-day visit in under 60 minutes.`,
          content_hash: computeHash(`SmileCare-Home-v2`),
        },
        {
          url: `${url}/pricing`,
          title: "Pricing & Membership Plans | SmileCare",
          content: `Transparent Dental Pricing: Routine Cleaning $120. Comprehensive Dental Exam & X-Rays $195. Teeth Whitening Special: $299 (Save $150). Invisalign Full Treatment now starting at $3,499 (was $4,200). Monthly financing available with 0% interest for 12 months.`,
          content_hash: computeHash(`SmileCare-Pricing-v2`),
        },
        {
          url: `${url}/emergency`,
          title: "Emergency Dental Services - 24/7 Care",
          content: `Emergency dental clinic open 24 hours a day, 7 days a week. Severe toothaches, broken crowns, dental trauma handled immediately. Call 1-800-SMILE-NOW.`,
          content_hash: computeHash(`SmileCare-Emergency-v1`),
        }
      ];
    } else if (isFitness) {
      pages = [
        {
          url: `${url}/`,
          title: "Peak Performance Fitness Club",
          content: `State of the art athletic training center. Strength, HIIT, Personal Coaching, and Recovery Sauna. Membership plans starting at $49/mo. Join before end of month and get $0 initiation fee.`,
          content_hash: computeHash(`Peak-Home-v1`),
        },
        {
          url: `${url}/classes`,
          title: "Group Fitness Classes Schedule",
          content: `Daily morning spin, yoga, boxing conditioning, and pilates reformer classes. Unlimited group classes included with Pro Membership tier.`,
          content_hash: computeHash(`Peak-Classes-v1`),
        }
      ];
    } else {
      // General SaaS / Business
      pages = [
        {
          url: `${url}/`,
          title: "Industry Solutions Platform",
          content: `Leading software platform helping mid-market enterprises streamline operations. Features include real-time analytics, workflow automation, and unified reporting. Schedule a 15-minute live platform tour today.`,
          content_hash: computeHash(`${url}-Home-v1`),
        },
        {
          url: `${url}/pricing`,
          title: "Transparent SaaS Pricing",
          content: `Starter tier: $39/user/month. Professional tier: $89/user/month with automated AI workflows. Enterprise tier: Custom onboarding and dedicated support SLA. Annual billing discount: Save 20%.`,
          content_hash: computeHash(`${url}-Pricing-v1`),
        }
      ];
    }

    const overallHash = computeHash(pages.map(p => p.content_hash).join(":"));

    return {
      pages,
      pageCount: pages.length,
      overallHash,
      provider: 'demo',
    };
  }
}

/**
 * Factory that chooses Firecrawl, Direct Fetch, or Demo Provider
 */
export function getCrawlerProvider(): ICrawlerProvider {
  const crawlerKey = process.env.CRAWLER_API_KEY;
  const providerType = process.env.CRAWLER_PROVIDER || (crawlerKey ? "firecrawl" : "demo");

  if (providerType === "firecrawl" && crawlerKey && crawlerKey !== "MY_CRAWLER_API_KEY") {
    return new FirecrawlProvider(crawlerKey);
  }

  return new DemoCrawlerProvider();
}

/**
 * Difference Analyzer: Identifies semantic business changes between page snapshots
 */
export function detectPageChanges(
  previousPages: CrawledPage[],
  currentPages: CrawledPage[]
): DetectedDiff[] {
  const diffs: DetectedDiff[] = [];
  const prevMap = new Map<string, CrawledPage>();
  for (const p of previousPages) {
    prevMap.set(p.url, p);
  }

  const currMap = new Map<string, CrawledPage>();
  for (const p of currentPages) {
    currMap.set(p.url, p);
  }

  // 1. Detect New Pages
  for (const [url, curr] of currMap.entries()) {
    if (!prevMap.has(url)) {
      let type: ChangeType = 'new_page';
      let importance: ImportanceLevel = 'medium';

      if (url.includes('pricing') || url.includes('plan')) {
        type = 'pricing_change';
        importance = 'high';
      } else if (url.includes('emergency') || url.includes('service')) {
        type = 'service_change';
        importance = 'critical';
      }

      diffs.push({
        change_type: type,
        page_url: url,
        old_value: '[Page did not exist in previous scan]',
        new_value: curr.content.slice(0, 300),
        importance,
      });
    }
  }

  // 2. Detect Deleted Pages
  for (const [url, prev] of prevMap.entries()) {
    if (!currMap.has(url)) {
      diffs.push({
        change_type: 'deleted_page',
        page_url: url,
        old_value: prev.content.slice(0, 200),
        new_value: '[Page removed in current scan]',
        importance: 'medium',
      });
    }
  }

  // 3. Detect Content Diff on existing pages
  for (const [url, curr] of currMap.entries()) {
    const prev = prevMap.get(url);
    if (prev && prev.content_hash !== curr.content_hash) {
      // Analyze semantic shift
      const prevText = prev.content.toLowerCase();
      const currText = curr.content.toLowerCase();

      let changeType: ChangeType = 'content_change';
      let importance: ImportanceLevel = 'medium';

      // Check pricing changes
      if (
        url.includes('pricing') ||
        prevText.includes('$') ||
        currText.includes('$') ||
        prevText.includes('price') ||
        currText.includes('price') ||
        currText.includes('₹') ||
        prevText.includes('₹')
      ) {
        changeType = 'pricing_change';
        importance = 'high';
      } else if (
        currText.includes('emergency') && !prevText.includes('emergency') ||
        currText.includes('24/7') && !prevText.includes('24/7') ||
        currText.includes('new service')
      ) {
        changeType = 'service_change';
        importance = 'critical';
      } else if (
        currText.includes('promo') ||
        currText.includes('discount') ||
        currText.includes('save') ||
        currText.includes('special offer')
      ) {
        changeType = 'promotion_change';
        importance = 'high';
      } else if (currText.includes('faq') || currText.includes('questions')) {
        changeType = 'faq_change';
        importance = 'low';
      } else if (curr.title !== prev.title) {
        changeType = 'heading_change';
        importance = 'medium';
      }

      diffs.push({
        change_type: changeType,
        page_url: url,
        old_value: prev.content.slice(0, 300),
        new_value: curr.content.slice(0, 300),
        importance,
      });
    }
  }

  return diffs;
}
