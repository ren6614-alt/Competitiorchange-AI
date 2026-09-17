import { PlanType } from "../types/index.ts";
import { PLAN_PRICING } from "../constants/plans.ts";
export { PLAN_PRICING };

export interface CreateManualUPIParams {
  userId: string;
  userEmail: string;
  plan: PlanType;
}

export interface ManualUPIInfo {
  upiId: string;
  payeeName: string;
  plan: PlanType;
  amount: number;
  currency: 'INR';
  upiUrl: string;
  qrData: string;
  qrImageUrl: string;
  transactionNote: string;
}

/**
 * Standard UPI URI Scheme generator without external payment gateways.
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
export function getManualUPIPaymentDetails(plan: PlanType = "pro"): ManualUPIInfo {
  const upiId = process.env.GPAY_UPI_ID || "gugankousi5124@okaxis";
  const payeeName = process.env.GPAY_PAYEE_NAME || "Gugan";
  const pricing = PLAN_PRICING[plan] || PLAN_PRICING.pro;
  const amount = pricing.inr;
  const transactionNote = `CompetitorChange AI ${plan.toUpperCase()} Plan`;

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: transactionNote,
  });

  const upiUrl = `upi://pay?${params.toString()}`;

  return {
    upiId,
    payeeName,
    plan,
    amount,
    currency: "INR",
    upiUrl,
    qrData: upiUrl,
    qrImageUrl: "/gpay-qr.svg",
    transactionNote,
  };
}
