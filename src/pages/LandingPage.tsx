import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Search,
  Eye,
  CheckCircle2,
  HelpCircle,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  CreditCard,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { PriorityBadge, ChangeTypeBadge } from "../components/PriorityBadge.tsx";
import { PLAN_PRICING } from "../server/payments.ts";

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { currency, setCurrency, login } = useApp();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const discountMultiplier = billingPeriod === "yearly" ? 0.8 : 1.0;

  const getPrice = (plan: "free" | "pro" | "business" | "agency") => {
    const p = PLAN_PRICING[plan];
    if (plan === "free") return { symbol: currency === "INR" ? "₹" : "$", amount: "0", period: "/forever" };

    if (currency === "INR") {
      const price = Math.round(p.inr * discountMultiplier);
      return { symbol: "₹", amount: price.toLocaleString("en-IN"), period: "/month" };
    } else {
      const price = Math.round(p.usd * discountMultiplier);
      return { symbol: "$", amount: price.toString(), period: "/month" };
    }
  };

  const handleDemoLogin = async () => {
    await login("founder@metrodental.com");
    onNavigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Gen Competitive Intelligence for Businesses & Agencies</span>
          </div>

          {/* Tagline & Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
            Know what your competitors changed. <br className="hidden sm:inline" />
            <span className="text-blue-600">Know what you should do next.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CompetitorChange AI continuously monitors competitor websites, strips HTML noise, and uses AI to explain what changed, why it matters, and the exact strategic actions you should take.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate("/signup")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Monitoring Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDemoLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Explore Live Demo Project</span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Automated daily crawls
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Cashfree India & Global billing
            </span>
          </div>
        </div>

        {/* 4. EXAMPLE COMPETITOR ALERT PREVIEW (HERO CARD) */}
        <div className="max-w-4xl mx-auto px-4 mt-12">
          <div className="p-1.5 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-100 shadow-xl border border-slate-200">
            <div className="bg-white rounded-xl p-6 text-left border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                    SC
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">SmileCare Dental vs. Metro Dental</h3>
                    <p className="text-xs text-slate-500">https://smilecaredental.com/pricing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge priority="high" />
                  <ChangeTypeBadge type="pricing_change" />
                </div>
              </div>

              {/* Fact */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1. What Changed? (Observed Fact)
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  SmileCare Dental dropped Invisalign pricing from $4,200 to $3,499 and added 12-month 0% financing.
                </p>
              </div>

              {/* Comparison Box */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs font-mono">
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                  <span className="font-bold">- OLD:</span> Invisalign Full Treatment: $4,200 (Lump-sum)
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  <span className="font-bold">+ NEW:</span> Invisalign starting at $3,499 (Save $700) + 0% Financing
                </div>
              </div>

              {/* Why it matters & Recommended Action */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    2. Why Does This Matter? (Inference)
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    This undercut makes SmileCare 15% cheaper than the local market. Prospective patients researching clear aligners may bounce from your pricing page due to sticker shock.
                  </p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                  <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    3. Recommended Next Step
                  </div>
                  <p className="text-blue-900 leading-relaxed font-medium">
                    Do not start a race to the bottom. Add a "Free Teeth Whitening + 2 Complimentary Retainers" bundle to your aligner package ($600 value) to justify your premium price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">The Problem</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              You are flying blind to your competitor's marketing moves
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Hours Wasted on Manual Checks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Opening 20 competitor tabs every week is tedious and subjective. Teams forget to check, allowing crucial shifts to go completely unnoticed for months.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Price & Offer Blind Spots</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Competitors quietly tweak pricing tiers, adjust packaging, and launch seasonal incentives that erode your margins before your sales team even knows.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Data Without Direction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Raw HTML diffing tools dump thousands of meaningless code lines (timestamps, cookies, tracking tags) with zero business context or strategic guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Workflow</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How CompetitorChange AI works in 3 steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="text-left space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Add Competitor URLs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add competitor domain names or specific landing pages. Configure scan frequency from daily to weekly based on your plan.
              </p>
            </div>

            <div className="text-left space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated Content Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our crawler strips tracking tags, scripts, and layout noise, computing clean cryptographic hashes to isolate genuine business shifts.
              </p>
            </div>

            <div className="text-left space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Intelligence & Action</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gemini analyzes the business impact, determines urgency, and produces concrete recommendations you can turn into actionable tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURES */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Engineered specifically for business strategy
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Semantic Change Detection",
                desc: "Filters out irrelevant code noise, focusing strictly on pricing, services, CTA copy, and new page additions.",
                icon: Zap,
              },
              {
                title: "Strategic Impact Scoring",
                desc: "Every detected change is classified as Critical, High, Medium, or Low to prevent alert fatigue.",
                icon: ShieldCheck,
              },
              {
                title: "Actionable Recommendations",
                desc: "Provides clear guidance on counter-offers, positioning tweaks, and campaign opportunities.",
                icon: Sparkles,
              },
              {
                title: "Cashfree Billing Engine",
                desc: "Seamless, secure subscription checkout with support for UPI, Cards, Netbanking in INR and global USD.",
                icon: CreditCard,
              },
              {
                title: "White-Label Client Dossiers",
                desc: "Generate branded PDF and web summaries for clients with executive takeaways.",
                icon: FileText,
              },
              {
                title: "Multi-Client Agency Portfolios",
                desc: "Organize hundreds of competitors across distinct client projects from one unified workspace.",
                icon: Building2,
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section className="py-20 border-b border-slate-100" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Pricing</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Transparent, predictable pricing
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Start free. Upgrade as your competitive monitoring expands.
            </p>

            {/* Currency & Billing Toggles */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setCurrency("INR")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    currency === "INR" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ₹ Indian Rupee (INR)
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    currency === "USD" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  $ US Dollar (USD)
                </button>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    billingPeriod === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                    billingPeriod === "yearly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">20% OFF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Free</h3>
                <p className="text-xs text-slate-500 mt-1">For single small businesses testing the waters.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">{getPrice("free").symbol}0</span>
                  <span className="text-xs text-slate-500">{getPrice("free").period}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 1 Project
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 1 Competitor
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Weekly Scans
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Basic Change Alerts
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/signup")}
                className="mt-8 w-full py-2 px-3 rounded-lg border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 bg-white rounded-xl border-2 border-blue-600 shadow-md relative flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pro</h3>
                <p className="text-xs text-slate-500 mt-1">For growing businesses defending market share.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {getPrice("pro").symbol}{getPrice("pro").amount}
                  </span>
                  <span className="text-xs text-slate-500">{getPrice("pro").period}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 3 Projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 10 Competitors
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Daily Automated Scans
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Full Gemini AI Impact Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> High Priority Email Alerts
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/signup")}
                className="mt-8 w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Business */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Business</h3>
                <p className="text-xs text-slate-500 mt-1">For multi-location or high-velocity teams.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {getPrice("business").symbol}{getPrice("business").amount}
                  </span>
                  <span className="text-xs text-slate-500">{getPrice("business").period}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 10 Projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 50 Competitors
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Daily Scanning + On-demand
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 5 Team Seats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Monthly Dossier Generator
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/signup")}
                className="mt-8 w-full py-2 px-3 rounded-lg border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Choose Business
              </button>
            </div>

            {/* Agency */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Agency</h3>
                <p className="text-xs text-slate-500 mt-1">For marketing, SEO, and consulting firms.</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {getPrice("agency").symbol}{getPrice("agency").amount}
                  </span>
                  <span className="text-xs text-slate-500">{getPrice("agency").period}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Unlimited Client Projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 250 Competitors
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> White-Label Reports (Your Brand)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 20 Team Seats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Dedicated Account Manager
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/signup")}
                className="mt-8 w-full py-2 px-3 rounded-lg border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Contact Agency Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. AGENCY USE CASE */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Agency & Consultant Tier</span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-2 leading-tight">
                Turn competitor intelligence into recurring monthly retainers
              </h2>
              <p className="text-slate-300 text-sm mt-4 leading-relaxed">
                Agencies use CompetitorChange AI to deliver white-labeled monthly competitive intelligence dossiers to clients. Instead of just delivering reports on what your client did, show them what their competitors are doing—and recommend higher-value campaigns.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>White-label monthly PDFs with your agency branding and custom logo</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Client-by-client project segregation with team permissions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Executive summaries ready to send directly to CMOs and business owners</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Client Dossier Sample</div>
                <span className="text-[10px] text-slate-400">PDF Ready</span>
              </div>
              <div className="text-sm font-semibold text-white">
                Monthly Competitive Move Analysis: Healthcare Vertical
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "During September, direct competitor SmileCare Dental reduced clear aligner pricing by 16.7% and launched an emergency surgical division. We recommend updating your ad copy to emphasize doctor tenure and post-treatment perks."
              </p>
              <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                <span>Prepared by: Vanguard Digital Agency</span>
                <span className="text-blue-400 font-semibold">Client Score: 88/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">FAQ</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What types of competitor changes can CompetitorChange AI detect?",
                a: "We monitor pricing updates, new service or product launches, promotional banners, headline & value proposition shifts, FAQ changes, and newly published or deleted pages.",
              },
              {
                q: "How does the AI avoid false alerts on trivial HTML changes?",
                a: "Our crawler strips tracking pixels, scripts, stylesheets, and timestamps before diffing. The AI evaluates semantic importance, discarding minor formatting noise and highlighting only commercial shifts.",
              },
              {
                q: "Can I pay in Indian Rupees (INR)?",
                a: "Yes. We support direct Indian Rupee payments via Cashfree Payments with UPI, Netbanking, and domestic debit/credit cards, as well as USD payments worldwide.",
              },
              {
                q: "Does CompetitorChange AI guarantee higher Google rankings?",
                a: "No. We strictly analyze public competitor changes to guide your marketing decisions. We do not make unsupported claims or guarantee search rankings or customer acquisition.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel your subscription directly inside the Billing settings with one click at any time.",
              },
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop guessing what your competitors are doing
          </h2>
          <p className="mt-4 text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Join hundreds of proactive business owners and marketing agencies who turn competitor moves into immediate growth opportunities.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate("/signup")}
              className="px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 shadow-lg transition-all"
            >
              Start Monitoring Free
            </button>
            <button
              onClick={handleDemoLogin}
              className="px-6 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all"
            >
              Launch Live Demo Project
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="py-12 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
                C
              </div>
              <span className="text-white font-bold text-sm">CompetitorChange AI</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => onNavigate("/login")} className="hover:text-white">
                Sign In
              </button>
              <button onClick={() => onNavigate("/billing")} className="hover:text-white">
                Pricing
              </button>
              <button onClick={() => onNavigate("/admin")} className="hover:text-white">
                Admin Panel
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 CompetitorChange AI. All rights reserved.</p>
            <p className="max-w-md text-center sm:text-right">
              Disclaimer: CompetitorChange AI analyzes publicly available website changes for informational and strategic purposes. We do not guarantee Google search rankings, competitor behavior, or customer acquisition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
