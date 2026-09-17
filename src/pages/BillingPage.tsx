import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { PaymentRequest, PlanType } from "../types/index.ts";
import { PLAN_CONFIGS, PLAN_PRICING } from "../constants/plans.ts";
import {
  Check,
  RotateCw,
  Sparkles,
  QrCode,
  Smartphone,
  Copy,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Receipt,
  HelpCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";

interface BillingPageProps {
  onNavigate: (route: string) => void;
}

interface UPIPaymentModalInfo {
  plan: PlanType;
  amount: number;
  currency: string;
  upiId: string;
  payeeName: string;
  upiUrl: string;
  qrData: string;
  qrImageUrl?: string;
  transactionNote: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onNavigate }) => {
  const { subscription, currency, setCurrency, addToast, refreshUserData, user } = useApp();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Manual UPI Payment Modal State
  const [activePaymentModal, setActivePaymentModal] = useState<UPIPaymentModalInfo | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [utrInput, setUtrInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>(user?.email || "");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<PaymentRequest | null>(null);

  const loadBillingInfo = async () => {
    setLoading(true);
    try {
      const res = await api.getMyPaymentRequests();
      setPaymentRequests(res.requests || []);
    } catch (err: any) {
      addToast({ type: "error", title: "Could not load billing data", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingInfo();
    if (user?.email) {
      setEmailInput(user.email);
    }
  }, [user]);

  // Generate QR Code whenever activePaymentModal is opened
  useEffect(() => {
    if (activePaymentModal?.qrData) {
      QRCode.toDataURL(activePaymentModal.qrData, {
        width: 240,
        margin: 1.5,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    } else {
      setQrCodeDataUrl("");
    }
  }, [activePaymentModal]);

  const handleOpenPaymentModal = async (plan: PlanType) => {
    setCheckoutLoading(plan);
    setSubmissionSuccess(null);
    try {
      const info = await api.getUPIPaymentInfo(plan);
      setActivePaymentModal(info);
      setUtrInput("");
      if (user?.email) {
        setEmailInput(user.email);
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Payment Info Error", message: err.message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSubmitPaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentModal) return;

    const trimmedUtr = utrInput.trim();
    if (!trimmedUtr) {
      addToast({ type: "warning", title: "UTR Required", message: "Please enter the 12-digit UTR / reference number from your UPI payment receipt." });
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.submitUPIPaymentRequest({
        plan: activePaymentModal.plan,
        utr: trimmedUtr,
        email: emailInput.trim(),
      });

      if (res.success) {
        setSubmissionSuccess(res.request);
        addToast({
          type: "success",
          title: "Payment Submitted For Verification",
          message: "Your payment request is now pending admin verification. Pro features will unlock as soon as approved.",
        });
        await loadBillingInfo();
        await refreshUserData();
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Submission Failed", message: err.message });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
    addToast({ type: "info", title: "Copied to Clipboard", message: text });
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription & Billing</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Manual UPI / Google Pay
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upgrade your plan using direct UPI payment (Google Pay, PhonePe, Paytm, BHIM) with admin UTR verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
            <button
              id="btn-currency-inr"
              onClick={() => setCurrency("INR")}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                currency === "INR" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>₹ INR (Manual UPI)</span>
            </button>
            <button
              id="btn-currency-usd"
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currency === "USD" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              $ USD (Ref)
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
              ? `Period ends / renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : "No expiration on Free tier"}
          </p>
          {subscription?.upi_ref_id && (
            <p className="text-[11px] text-slate-500 font-mono">
              Approved UPI UTR: <span className="text-slate-800 font-bold">{subscription.upi_ref_id}</span>
            </p>
          )}
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Available Subscription Tiers</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manual UPI Transfer with Admin Verification</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-1">Free Tier</h4>
                <p className="text-xs text-slate-500 mt-1">For testing competitive monitoring on a single page.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Competitor URL</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weekly crawl schedule</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Basic change alerts</span>
                </li>
              </ul>
            </div>

            <button
              disabled={currentPlan === "free"}
              className="mt-6 w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {currentPlan === "free" ? "Active Tier" : "Default Starter"}
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="p-6 bg-white rounded-2xl border-2 border-blue-600 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
              Recommended for Teams
            </span>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">SaaS Defense</span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-1">Pro Plan</h4>
                <p className="text-xs text-slate-500 mt-1">Defend market share with daily scanning and AI insights.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {currency === "INR" ? `₹${PLAN_PRICING.pro.inr}` : `$${PLAN_PRICING.pro.usd}`}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">3 Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">10 Competitors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Daily automated scans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>AI Impact & Strategic Advice</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Instant Email & Digest Notifications</span>
                </li>
              </ul>
            </div>

            <button
              id="btn-upgrade-pro"
              disabled={checkoutLoading === "pro" || currentPlan === "pro"}
              onClick={() => handleOpenPaymentModal("pro")}
              className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                currentPlan === "pro"
                  ? "bg-slate-100 text-slate-400 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {checkoutLoading === "pro" ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing UPI Details...</span>
                </>
              ) : currentPlan === "pro" ? (
                <span>Current Active Plan</span>
              ) : (
                <>
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Business Tier */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High Growth</span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-1">Business Plan</h4>
                <p className="text-xs text-slate-500 mt-1">For multi-brand portfolios and aggressive marketing teams.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {currency === "INR" ? `₹${PLAN_PRICING.business.inr}` : `$${PLAN_PRICING.business.usd}`}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10 Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>50 Competitors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hourly & On-demand crawls</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority AI inference priority</span>
                </li>
              </ul>
            </div>

            <button
              id="btn-upgrade-business"
              disabled={checkoutLoading === "business" || currentPlan === "business"}
              onClick={() => handleOpenPaymentModal("business")}
              className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                currentPlan === "business"
                  ? "bg-slate-50 text-slate-400 border-slate-200"
                  : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
              }`}
            >
              {checkoutLoading === "business" ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : currentPlan === "business" ? (
                "Current Active Plan"
              ) : (
                "Upgrade to Business"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Manual UPI Payment Modal */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Manual UPI Payment ({activePaymentModal.plan.toUpperCase()} Plan)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pay using Google Pay, PhonePe, Paytm, or any UPI app
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePaymentModal(null);
                  setSubmissionSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {submissionSuccess ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Payment Request Submitted!</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                      We have received your payment submission for <span className="font-bold">₹{submissionSuccess.amount}</span> with UTR <span className="font-mono font-bold">{submissionSuccess.utr}</span>.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Status: Pending Admin Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      As per security standards, our admin manually verifies the transaction reference with our bank account. Your Pro plan will activate immediately upon approval.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePaymentModal(null);
                      setSubmissionSuccess(null);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Payment Details */}
                  <div className="text-center space-y-3">
                    <div className="inline-block bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm relative">
                      <img
                        src={activePaymentModal.qrImageUrl || "/gpay-qr.svg"}
                        alt="Google Pay UPI QR Code"
                        className="w-52 h-52 mx-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Official Google Pay UPI QR
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Scan with Google Pay, PhonePe, Paytm, or any UPI App
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Amount to transfer: <span className="text-base font-extrabold text-blue-600">₹{activePaymentModal.amount} INR</span>
                      </p>
                    </div>

                    {/* Mobile UPI Link */}
                    <div className="pt-1">
                      <a
                        href={activePaymentModal.upiUrl}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Open in Google Pay / UPI App</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  </div>

                  {/* Payment Coordinates Table */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs">
                    <div className="pb-2 flex items-center justify-between">
                      <span className="text-slate-500">Payee Name:</span>
                      <span className="font-semibold text-slate-900">{activePaymentModal.payeeName}</span>
                    </div>

                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-500">UPI ID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{activePaymentModal.upiId}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activePaymentModal.upiId, "upi")}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                          title="Copy UPI ID"
                        >
                          {copiedField === "upi" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-emerald-600">₹{activePaymentModal.amount} INR</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-slate-500">Note:</span>
                      <span className="font-mono text-slate-600 text-[11px]">{activePaymentModal.transactionNote}</span>
                    </div>
                  </div>

                  {/* Step 2: Post-Payment Submission Form */}
                  <form onSubmit={handleSubmitPaymentRequest} className="space-y-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Step 2: Submit Payment Reference (UTR)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        After sending ₹{activePaymentModal.amount}, enter your 12-digit UTR/transaction reference and your account email.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          UTR / UPI Transaction Reference Number *
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="input-upi-utr"
                            type="text"
                            required
                            placeholder="e.g. 429182049182 (12 digits)"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setUtrInput(`42${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700"
                            title="Generate a demo UTR for testing"
                          >
                            Demo UTR
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Account Email / Identifier *
                        </label>
                        <input
                          id="input-upi-email"
                          type="email"
                          required
                          placeholder="Your account email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-submit-payment-request"
                      type="submit"
                      disabled={submittingPayment}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {submittingPayment ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting for Verification...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Payment for Approval</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Requests & Invoices History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Payment Submissions & Invoices ({paymentRequests.length})
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Manual UPI Submissions</span>
          </span>
        </div>

        {paymentRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No payment requests submitted yet.</p>
            <p>Click "Upgrade to Pro" above to make a UPI transfer and submit your UTR.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Reference / UTR</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Admin Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-900 block font-bold">{req.utr}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{req.id}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 uppercase">
                    {req.plan}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    ₹{Number(req.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "rejected"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {req.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                      {req.status === "rejected" && <XCircle className="w-3 h-3" />}
                      {req.status === "pending" && <Clock className="w-3 h-3 animate-spin" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {req.admin_notes || (req.status === "pending" ? "Awaiting admin check" : "Verified")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Cancellation Safeguard */}
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
