import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import {
  Shield,
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
} from "lucide-react";

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, addToast } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMetrics();
      setMetrics(data);
    } catch (err: any) {
      addToast({ type: "error", title: "Admin Access Denied", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRunTests = async () => {
    setRunningTests(true);
    addToast({
      type: "info",
      title: "Running Automated Test Suite",
      message: "Verifying 10 critical paths: RLS isolation, crawler hashing, Cashfree order, idempotent webhooks...",
    });

    try {
      const results = await api.runAutomatedTests();
      setTestResults(results);
      if (results.allPassed) {
        addToast({
          type: "success",
          title: "All Tests Passed!",
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Admin Telemetry
            </span>
            <span className="text-xs text-slate-400">Environment: Production Sandbox</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Platform Operations Control</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={runningTests}
            onClick={handleRunTests}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${runningTests ? "animate-spin text-indigo-200" : ""}`} />
            <span>{runningTests ? "Executing 10 Critical Tests..." : "Run System Test Suite"}</span>
          </button>
          <button
            onClick={loadMetrics}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-2xs"
          >
            <RotateCw className="w-4 h-4" />
          </button>
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
            <span className="text-xs text-slate-400 font-semibold block">Paid Subs</span>
            <span className="text-xl font-bold text-indigo-600 mt-1 block">{metrics.metrics.paidSubscriptions}</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold block">Revenue (INR)</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              ₹{Number(metrics.metrics.totalRevenueINR).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* 2. Automated Test Suite Results (Prompt critical requirement) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Automated Critical-Path Verification Suite (10 Test Vectors)
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
              Click "Run System Test Suite" to execute automated tests covering auth, project isolation, duplicate prevention, HTML normalization, AI JSON schema verification, Cashfree order creation, and idempotent webhook processing.
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

      {/* 3. Registered Users Directory */}
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
    </div>
  );
};
