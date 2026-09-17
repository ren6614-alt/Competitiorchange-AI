import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { CheckCircle2, ArrowRight, RotateCw, Clock } from "lucide-react";

interface PaymentSuccessPageProps {
  onNavigate: (route: string) => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onNavigate }) => {
  const { addToast, refreshUserData } = useApp();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const oid = params.get("order_id") || `upi_req_${Date.now()}`;
      setOrderId(oid);

      try {
        await refreshUserData();
      } catch (err: any) {
        console.error("Refresh user error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="min-h-[calc(100vh-53px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        {loading ? (
          <div className="space-y-3 py-6">
            <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Checking Payment Status...</h2>
            <p className="text-xs text-slate-500">Refreshing your subscription state...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment Request Received!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your UPI payment reference <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{orderId}</code> has been logged for manual verification. Our team verifies transaction records promptly to activate your Pro plan.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => onNavigate("/billing")}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Billing & Invoices</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("/dashboard")}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
