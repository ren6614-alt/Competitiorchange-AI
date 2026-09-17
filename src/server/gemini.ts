import { GoogleGenAI, Type } from "@google/genai";
import { ImportanceLevel, ChangeType } from "../types/index.ts";
import { checkAndIncrementAiUsage, COST_SAFEGUARDS } from "./limits.ts";

export interface AIAnalysisResult {
  summary: string;
  change_type: ChangeType;
  business_impact: string;
  recommended_action: string;
  priority: ImportanceLevel;
  confidence: number;
  provider?: "gemini_free_tier" | "deterministic_fallback";
  quota_notice?: string;
}

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!aiClient && apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'CompetitorChange-AI/1.0',
        },
      },
    });
  }
  return aiClient;
}

export async function analyzeCompetitorChange(params: {
  userId?: string;
  competitorName: string;
  competitorUrl: string;
  changeType: ChangeType;
  oldContent: string;
  newContent: string;
  pageUrl: string;
}): Promise<AIAnalysisResult> {
  // 1. Cost Safeguard: Check daily AI request quota per user
  if (params.userId) {
    const quotaCheck = checkAndIncrementAiUsage(params.userId);
    if (!quotaCheck.allowed) {
      console.warn(`[AI Cost Safeguard] User ${params.userId} reached free daily limit. Applying fallback without paid billing.`);
      const fallback = generateSmartMockAnalysis(params);
      fallback.quota_notice = quotaCheck.reason || "AI analysis is temporarily unavailable because the current free usage limit has been reached. No paid service has been activated.";
      fallback.provider = "deterministic_fallback";
      return fallback;
    }
  }

  const ai = getGenAI();

  // 2. Safe Prompt Construction with Input Token Truncation
  const maxChars = Math.floor(COST_SAFEGUARDS.maxPromptInputChars / 2);
  const truncatedOld = params.oldContent ? params.oldContent.slice(0, maxChars) : '[New page created, no previous content]';
  const truncatedNew = params.newContent.slice(0, maxChars);

  const prompt = `You are a competitive intelligence analyst for CompetitorChange AI.
Competitor Name: ${params.competitorName}
Website: ${params.competitorUrl}
Page URL: ${params.pageUrl}
Detected Change Type: ${params.changeType}

PREVIOUS CONTENT:
"""
${truncatedOld}
"""

NEW CONTENT:
"""
${truncatedNew}
"""

Instructions:
1. Analyze the change between the previous and current website content.
2. Clearly distinguish between:
   - FACT (What actually changed on the page)
   - INFERENCE (Why the change matters for business and potential customer impact)
   - RECOMMENDATION (Concrete, non-generic step the user's business should take next)
3. Rules:
   - Do not invent facts.
   - Only use information present in the supplied content.
   - If evidence is weak, state so.
   - Do not claim that a website change definitely caused rankings, revenue, or customer acquisition changes.
   - Priority must be one of: "low", "medium", "high", or "critical".
   - Confidence must be a float between 0.0 and 1.0.
   - Return valid JSON matching the schema.`;

  if (!ai) {
    // Deterministic intelligence fallback when API key is not configured
    const fallback = generateSmartMockAnalysis(params);
    fallback.provider = "deterministic_fallback";
    return fallback;
  }

  // Models to attempt in order of preference
  const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      // 3. Call Gemini model
      const responsePromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: "You are an objective competitive intelligence analyst. You distinguish facts from inferences and never make ungrounded marketing claims.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Fact-based summary of what specifically changed on the competitor's page.",
              },
              change_type: {
                type: Type.STRING,
                description: "The primary category of change: new_page, pricing_change, service_change, promotion_change, faq_change, heading_change, contact_change, hours_change, or cta_change.",
              },
              business_impact: {
                type: Type.STRING,
                description: "Why this change matters to competing businesses (inferred strategic intent).",
              },
              recommended_action: {
                type: Type.STRING,
                description: "Actionable next step for the customer's business.",
              },
              priority: {
                type: Type.STRING,
                description: "Importance level: low, medium, high, or critical.",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence score between 0 and 1.",
              },
            },
            required: ["summary", "change_type", "business_impact", "recommended_action", "priority", "confidence"],
          },
        },
      });

      // Enforce strict timeout to prevent hung connections (allocate up to half timeout per model)
      const perModelTimeout = Math.floor(COST_SAFEGUARDS.aiTimeoutMs / candidateModels.length);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT")), perModelTimeout)
      );

      const response = (await Promise.race([responsePromise, timeoutPromise])) as any;

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini model");
      }

      const parsed = JSON.parse(text) as AIAnalysisResult;

      // Validate and sanitize priority
      const validPriorities: ImportanceLevel[] = ["low", "medium", "high", "critical"];
      const priority: ImportanceLevel = validPriorities.includes(parsed.priority) ? parsed.priority : "medium";

      return {
        summary: parsed.summary || `Observed change in ${params.changeType.replace('_', ' ')}`,
        change_type: params.changeType,
        business_impact: parsed.business_impact || "Competitor adjusted their positioning or service offering.",
        recommended_action: parsed.recommended_action || "Review your corresponding page and highlight your unique value proposition.",
        priority,
        confidence: Math.max(0.1, Math.min(1.0, Number(parsed.confidence) || 0.85)),
        provider: "gemini_free_tier",
      };
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || String(error);
      const lower = errorMsg.toLowerCase();
      // If temporary 503 high demand or timeout, try next candidate model
      if (lower.includes("503") || lower.includes("unavailable") || lower.includes("high demand") || lower.includes("timeout")) {
        console.info(`[Gemini Resilience] ${modelName} encountered temporary load (${errorMsg.slice(0, 80)}). Attempting secondary model...`);
        continue;
      }
      // For quota or auth issues, no need to retry candidate models
      break;
    }
  }

  // If all models encounter issues, safely apply deterministic domain intelligence
  const errorMsg = lastError?.message || String(lastError || "Unknown error");
  console.info(`[Gemini Safe Fallback] Using deterministic domain intelligence (${errorMsg.slice(0, 100)}).`);

  const fallback = generateSmartMockAnalysis(params);
  fallback.provider = "deterministic_fallback";

  const lowerMsg = errorMsg.toLowerCase();
  if (
    lowerMsg.includes("429") ||
    lowerMsg.includes("quota") ||
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("billing") ||
    lowerMsg.includes("rate")
  ) {
    fallback.quota_notice = "AI analysis is temporarily unavailable because the current free usage limit has been reached. No paid service has been activated.";
  } else if (lowerMsg.includes("503") || lowerMsg.includes("demand") || lowerMsg.includes("unavailable")) {
    fallback.quota_notice = "AI model is currently experiencing peak demand. Real-time deterministic analysis was applied.";
  }

  return fallback;
}

function generateSmartMockAnalysis(params: {
  competitorName: string;
  changeType: ChangeType;
  oldContent: string;
  newContent: string;
}): AIAnalysisResult {
  const type = params.changeType;

  if (type === 'pricing_change') {
    return {
      summary: `Competitor modified their advertised pricing structure on the pricing page.`,
      change_type: 'pricing_change',
      business_impact: `This may shift price sensitivity among prospective buyers comparing options in your market segment.`,
      recommended_action: `Review your pricing packages and ensure your value-adds (e.g. guarantees, onboarding, free estimates) are prominently displayed.`,
      priority: 'high',
      confidence: 0.92,
    };
  }

  if (type === 'service_change') {
    return {
      summary: `Competitor introduced a new service offering: "${params.newContent.slice(0, 120)}..."`,
      change_type: 'service_change',
      business_impact: `The competitor is broadening their addressable market and targeting customer segments needing faster turnaround or specialized assistance.`,
      recommended_action: `Evaluate whether your team can offer a comparable service package and update your service navigation to maintain parity.`,
      priority: 'high',
      confidence: 0.89,
    };
  }

  if (type === 'promotion_change') {
    return {
      summary: `Competitor launched a new promotional banner offering seasonal discounts.`,
      change_type: 'promotion_change',
      business_impact: `Short-term conversion rates for competitor campaigns could increase during this campaign window.`,
      recommended_action: `Consider testing an introductory trial or seasonal bundle to avoid losing price-conscious prospects.`,
      priority: 'medium',
      confidence: 0.87,
    };
  }

  if (type === 'cta_change' || type === 'heading_change') {
    return {
      summary: `Competitor refreshed their hero headline and call-to-action messaging.`,
      change_type: type,
      business_impact: `Signals an active A/B test or repositioning toward higher intent prospects.`,
      recommended_action: `Audit your above-the-fold value proposition to ensure clear differentiation.`,
      priority: 'medium',
      confidence: 0.84,
    };
  }

  return {
    summary: `Detected content updates across key sections of ${params.competitorName}.`,
    change_type: type,
    business_impact: `Competitor is actively keeping their digital footprint and service catalog fresh.`,
    recommended_action: `Monitor user engagement on your matching pages and verify your contact forms are working smoothly.`,
    priority: 'low',
    confidence: 0.8,
  };
}
