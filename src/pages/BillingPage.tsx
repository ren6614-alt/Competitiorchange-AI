import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { PaymentOrder, PlanType } from "../types/index.ts";
import { PLAN_CONFIGS } from "../server/limits.ts";
import { PLAN_PRICING } from "../server/payments.ts";
import {
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck,
  RotateCw,
  ExternalLink,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface BillingPageProps {
  onNavigate: (route: string) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onNavigate }) => {
  const { subscription, currency, setCurrency, addToast, refreshUserData } = useApp();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadBillingInfo = async () => {
    setLoading(true);
    try {
      const res = await api.getSubscriptionInfo();
      setOrders(res.orders);
    } catch (err: any) {
      addToast({ type: "error", title: "Could not load billing", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const handleUpgradeWithCashfree = async (plan: PlanType) => {
    setCheckoutLoading(plan);
    try {
      const orderRes = await api.createPaymentOrder(plan, currency);
      addToast({
        type: "info",
        title: "Cashfree Order Initialized",
        message: `Order ID: ${orderRes.orderId}. Verifying transaction with gateway...`,
      });

      // Execute server-side verification
      const verifyRes = await api.verifyPayment(orderRes.orderId);
      if (verifyRes.success) {
        addToast({
          type: "success",
          title: "Payment Verified!",
          message: `Your account is now upgraded to ${plan.toUpperCase()} plan.`,
        });
        await refreshUserData();
        await loadBillingInfo();
      } else {
        addToast({
          type: "warning",
          title: "Payment Processing",
          message: "Payment order is pending completion.",
        });
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Checkout Error", message: err.message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your billing cycle.")) {
      return;
    }
    try {
      await api.cancelSubscription();
      await refreshUserData();
      await loadBillingInfo();
      addToast({ type: "info", title: "Subscription Cancelled", message: "Your plan will downgrade to Free at period end." });
    } catch (err: any) {
      addToast({ type: "error", title: "Cancellation failed", message: err.message });
    }
  };

  const currentPlan = subscription?.plan || "free";
  const currentLimits = PLAN_CONFIGS[currentPlan];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your competitive monitoring capacity, invoices, and payment methods
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setCurrency("INR")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currency === "INR" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ₹ INR (Cashfree India)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currency === "USD" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              $ USD (Global)
            </button>
          </div>
        </div>
      </div>

      {/* 1. Active Plan Overview Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentPlan}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {subscription?.status === "active" ? "Active" : "Cancelled"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 capitalize">{currentPlan} Membership</h2>
          <p className="text-xs text-slate-500">
            {subscription?.current_period_end
              ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : "No expiration on Free tier"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[110px]">
            <span className="text-slate-400 font-semibold block text-[11px]">Projects</span>
            <span className="text-lg font-bold text-slate-900">{currentLimits.projects}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[110px]">
            <span className="text-slate-400 font-semibold block text-[11px]">Competitors</span>
            <span className="text-lg font-bold text-slate-900">{currentLimits.competitors}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[110px]">
            <span className="text-slate-400 font-semibold block text-[11px]">Crawl Rate</span>
            <span className="text-lg font-bold text-slate-900 capitalize">{currentLimits.scanFrequency}</span>
          </div>
        </div>
      </div>

      {/* 2. Upgrade Plans Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Available Subscription Tiers</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["pro", "business", "agency"] as PlanType[]).map((plan) => {
            const pricing = PLAN_PRICING[plan];
            const displayPrice = currency === "INR" ? `₹${pricing.inr.toLocaleString("en-IN")}` : `$${pricing.usd}`;
            const isCurrent = currentPlan === plan;

            return (
              <div
                key={plan}
                className={`p-6 rounded-2xl border bg-white shadow-2xs flex flex-col justify-between transition-all ${
                  isCurrent ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-900 uppercase">{plan}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">{displayPrice}</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>

                  <ul className="mt-5 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{PLAN_CONFIGS[plan].projects} Projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{PLAN_CONFIGS[plan].competitors} Competitors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Daily Automated Scans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Gemini AI Business Insights</span>
                    </li>
                    {plan === "agency" && (
                      <li className="flex items-center gap-2 font-semibold text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>White-Label Client Dossiers</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed"
                    >
                      Active Tier
                    </button>
                  ) : (
                    <button
                      disabled={checkoutLoading !== null}
                      onClick={() => handleUpgradeWithCashfree(plan)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        {checkoutLoading === plan
                          ? "Processing..."
                          : `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Payment Orders History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Billing History & Receipts
          </h3>
          <span className="text-[11px] text-slate-400">Cashfree PG Gateway</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No previous billing invoices recorded.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-slate-600">{o.provider_order_id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 uppercase">
                    {o.metadata?.plan || "PRO"}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {o.currency === "INR" ? `₹${Number(o.amount).toLocaleString()}` : `$${o.amount}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        o.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Cancellation Safeguard */}
      {currentPlan !== "free" && subscription?.status === "active" && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800">Need to pause or cancel?</span>
            <p className="text-slate-500 mt-0.5">
              You can cancel anytime. You will retain access until the end of your billing cycle.
            </p>
          </div>
          <button
            onClick={handleCancelSubscription}
            className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold border border-red-200 transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
};
