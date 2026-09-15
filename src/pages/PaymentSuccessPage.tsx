import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { CheckCircle2, ArrowRight, RotateCw, AlertTriangle } from "lucide-react";

interface PaymentSuccessPageProps {
  onNavigate: (route: string) => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onNavigate }) => {
  const { addToast, refreshUserData } = useApp();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const oid = params.get("order_id") || `order_simulated_${Date.now()}`;
      setOrderId(oid);

      try {
        const res = await api.verifyPayment(oid);
        if (res.success) {
          setVerified(true);
          await refreshUserData();
          addToast({
            type: "success",
            title: "Subscription Activated",
            message: `Your payment was successfully verified with Cashfree PG. Plan unlocked!`,
          });
        } else {
          setError(res.message || "Payment status not verified.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, []);

  return (
    <div className="min-h-[calc(100vh-53px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        {loading ? (
          <div className="space-y-3 py-6">
            <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Verifying Payment with Cashfree...</h2>
            <p className="text-xs text-slate-500">Checking order signature and server response...</p>
          </div>
        ) : verified ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment Successful!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your Cashfree order <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{orderId}</code> has been processed and verified server-side. Your expanded competitive quota is now active.
            </p>
            <button
              onClick={() => onNavigate("/dashboard")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Payment Verification Issue</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {error || "We could not immediately verify payment status with Cashfree."}
            </p>
            <button
              onClick={() => onNavigate("/billing")}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              Return to Billing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
