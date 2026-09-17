import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { PaymentRequest } from "../types/index.ts";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Users,
  Layers,
  TrendingUp,
  CreditCard,
  FileCheck,
  Server,
  Terminal,
  Clock,
  Check,
  X,
  AlertCircle,
  QrCode,
} from "lucide-react";

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, addToast, refreshUserData } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Pending Payments Management
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, requestsData] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminPaymentRequests(),
      ]);
      setMetrics(metricsData);
      setPaymentRequests(requestsData.requests || []);
    } catch (err: any) {
      addToast({ type: "error", title: "Admin Access Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewPayment = async (requestId: string, status: "approved" | "rejected") => {
    setReviewingId(requestId);
    const notes = actionNotes[requestId] || "";
    try {
      const res = await api.reviewPaymentRequest({
        requestId,
        status,
        adminNotes: notes || (status === "approved" ? "Verified against bank statement." : "Payment could not be verified."),
      });

      if (res.success) {
        addToast({
          type: status === "approved" ? "success" : "info",
          title: status === "approved" ? "Payment Approved!" : "Payment Rejected",
          message: status === "approved"
            ? `User entitlement activated for ${res.request.plan.toUpperCase()} plan.`
            : `Payment request marked as rejected.`,
        });
        await loadData();
        await refreshUserData();
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Review Error", message: err.message });
    } finally {
      setReviewingId(null);
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    addToast({
      type: "info",
      title: "Running Automated Test Suite",
      message: "Verifying 13 critical system paths: Free Dev Mode, Zero Autopay, RLS isolation, IDOR prevention, crawler hashing, manual UPI, UTR verification...",
    });

    try {
      const results = await api.runAutomatedTests();
      setTestResults(results);
      if (results.allPassed) {
        addToast({
          type: "success",
          title: "All 13 Tests Passed!",
          message: `${results.passed} / ${results.total} critical system paths verified.`,
        });
      } else {
        addToast({
          type: "warning",
          title: "Some Tests Failed",
          message: `Passed ${results.passed} of ${results.total} tests.`,
        });
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Test Execution Error", message: err.message });
    } finally {
      setRunningTests(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Restricted Administration Area</h2>
        <p className="text-xs text-slate-500">
          This area is restricted to system administrators. Use the top menu "Toggle Admin View" to switch permissions.
        </p>
      </div>
    );
  }

  const filteredRequests = paymentRequests.filter((r) => {
    if (paymentFilter === "all") return true;
    return r.status === paymentFilter;
  });

  const pendingCount = paymentRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Admin Telemetry & Approvals
            </span>
            <span className="text-xs text-slate-400">Environment: Production Sandbox</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Platform Operations Control</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-run-admin-tests"
            disabled={runningTests}
            onClick={handleRunTests}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${runningTests ? "animate-spin text-indigo-200" : ""}`} />
            <span>{runningTests ? "Executing 13 System Tests..." : "Run System Test Suite (13 Tests)"}</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-2xs"
            title="Refresh data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Free Development Mode & Security Status Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-900">FREE_DEVELOPMENT_MODE: ACTIVE</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Zero Cloud Billing
              </span>
            </div>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              Strict cost safeguards enforced: Gemini Free Tier API (capped 25 reqs/day), max 10 scans/day, zero UPI autopay, no recurring mandates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 font-semibold text-[11px]">
            No Google Cloud Mandates
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 font-semibold text-[11px]">
            Manual UPI Verification Only
          </span>
        </div>
      </div>

      {/* 1. Global Metrics */}
      {metrics?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Total Users</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.metrics.users}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Projects</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.metrics.projects}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Competitors</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.metrics.competitors}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Total Scans</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.metrics.scans}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Pending Approvals</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">{pendingCount}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Paid Subs</span>
            <span className="text-xl font-bold text-indigo-600 mt-1 block">{metrics.metrics.paidSubscriptions}</span>
          </div>
        </div>
      )}

      {/* 2. MANUAL UPI PAYMENTS MANAGEMENT TABLE (User requested prompt item 7, 8, 9, 10) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Manual UPI Payments & UTR Verification</h2>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  {pendingCount} Pending Action
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify the user-supplied UTR with bank records before approving. Approving instantly activates the Pro subscription entitlement.
            </p>
          </div>

          {/* Filter tabs and QR Preview button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Active QR Code</span>
            </button>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setPaymentFilter("pending")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  paymentFilter === "pending" ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setPaymentFilter("approved")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  paymentFilter === "approved" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setPaymentFilter("rejected")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  paymentFilter === "rejected" ? "bg-red-50 text-red-800" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setPaymentFilter("all")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  paymentFilter === "all" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({paymentRequests.length})
              </button>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No payment requests match this filter.</p>
            <p>All incoming UPI transactions are up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">User / Account</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">UTR / Ref #</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 min-w-[200px]">Admin Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isProcessing = reviewingId === req.id;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{req.user_name || "User"}</span>
                        <span className="text-slate-500 text-[11px] block">{req.user_email}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{req.user_id}</span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 uppercase">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {req.plan}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        ₹{Number(req.amount).toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-800 font-bold text-xs select-all">
                          {req.utr}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}{" "}
                        <span className="text-[10px] block text-slate-400">
                          {new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
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

                      <td className="px-4 py-3">
                        {req.status === "pending" ? (
                          <input
                            type="text"
                            placeholder="Verification note (optional)"
                            value={actionNotes[req.id] || ""}
                            onChange={(e) => setActionNotes({ ...actionNotes, [req.id]: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-slate-600 text-[11px]">
                            {req.admin_notes || "Verified by admin"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-approve-${req.id}`}
                              disabled={isProcessing}
                              onClick={() => handleReviewPayment(req.id, "approved")}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Verify UTR and activate Pro subscription"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`btn-reject-${req.id}`}
                              disabled={isProcessing}
                              onClick={() => handleReviewPayment(req.id, "rejected")}
                              className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Reject payment"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Automated Test Suite Results */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Automated Critical-Path Verification Suite (13 System Tests)
            </h3>
          </div>
          {testResults && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                testResults.allPassed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {testResults.passed} / {testResults.total} Verified
            </span>
          )}
        </div>

        {!testResults ? (
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-2">
            <Terminal className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Test suite ready to run</p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Click "Run System Test Suite" to execute all 13 automated tests covering auth, RLS isolation, IDOR prevention, Free Development Mode, zero recurring autopay mandates, manual UPI URI validation, and admin approval workflows.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {testResults.results.map((t: any, idx: number) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {t.status === "PASSED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-slate-900">{t.test}</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{t.details}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    t.status === "PASSED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Registered Users Directory */}
      {metrics?.users && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registered Accounts ({metrics.users.length})
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.full_name || "Unnamed"}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active QR Code Preview Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Active Google Pay QR Code</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs inline-block mx-auto">
              <img
                src="/gpay-qr.svg"
                alt="Google Pay UPI QR Code"
                className="w-56 h-56 mx-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-900">Gugan</div>
              <div className="font-mono text-slate-500 font-medium">gugankousi5124@okaxis</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Official Google Pay UPI Barcode
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href="/gpay-qr.png"
                download="gpay-upi-qr.png"
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors text-center"
              >
                Download PNG
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
