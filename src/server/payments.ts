import crypto from "crypto";
import { PlanType, PaymentOrder, PaymentEvent, Subscription } from "../types/index.ts";

export interface CreateOrderParams {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  plan: PlanType;
  currency: 'INR' | 'USD';
  returnUrl: string;
}

export interface CashfreeOrderResult {
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus: string;
  environment: 'sandbox' | 'production';
}

export interface IPaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CashfreeOrderResult>;
  verifyOrder(orderId: string): Promise<{ status: string; amount: number; paidAt?: string }>;
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean;
}

// Configurable pricing system (USD and INR)
export const PLAN_PRICING: Record<PlanType, { usd: number; inr: number }> = {
  free: { usd: 0, inr: 0 },
  pro: { usd: 29, inr: 2499 },
  business: { usd: 79, inr: 6699 },
  agency: { usd: 299, inr: 24999 },
};

export class CashfreePaymentProvider implements IPaymentProvider {
  private appId: string;
  private secretKey: string;
  private environment: 'sandbox' | 'production';
  private apiVersion: string = "2023-08-01";

  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    this.secretKey = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
    this.environment = (process.env.CASHFREE_ENVIRONMENT === "production") ? "production" : "sandbox";
  }

  private getBaseUrl(): string {
    return this.environment === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  private isConfigured(): boolean {
    return Boolean(
      process.env.CASHFREE_APP_ID &&
      process.env.CASHFREE_SECRET_KEY &&
      process.env.CASHFREE_APP_ID !== "TEST_APP_ID"
    );
  }

  async createOrder(params: CreateOrderParams): Promise<CashfreeOrderResult> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pricing = PLAN_PRICING[params.plan];
    const amount = params.currency === 'INR' ? pricing.inr : pricing.usd;

    if (!this.isConfigured()) {
      // Safe sandbox simulated order session for testing development environment
      return {
        orderId,
        paymentSessionId: `session_mock_${Date.now()}_${params.plan}`,
        orderAmount: amount,
        orderCurrency: params.currency,
        orderStatus: "ACTIVE",
        environment: this.environment,
      };
    }

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: params.currency,
      customer_details: {
        customer_id: params.userId,
        customer_email: params.userEmail,
        customer_phone: params.userPhone || "9999999999",
        customer_name: params.userName || "Subscriber",
      },
      order_meta: {
        return_url: params.returnUrl.replace("{order_id}", orderId),
      },
      order_note: `CompetitorChange AI - ${params.plan.toUpperCase()} Plan Subscription`,
    };

    const response = await fetch(`${this.getBaseUrl()}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": this.appId,
        "x-client-secret": this.secretKey,
        "x-api-version": this.apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cashfree Order Creation Failed (${response.status}): ${errText}`);
    }

    const data = await response.json();

    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderAmount: data.order_amount,
      orderCurrency: data.order_currency,
      orderStatus: data.order_status,
      environment: this.environment,
    };
  }

  async verifyOrder(orderId: string): Promise<{ status: string; amount: number; paidAt?: string }> {
    if (!this.isConfigured()) {
      // Simulated sandbox verification for mock orders
      return {
        status: "PAID",
        amount: 2499,
        paidAt: new Date().toISOString(),
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": this.appId,
        "x-client-secret": this.secretKey,
        "x-api-version": this.apiVersion,
      },
    });

    if (!response.ok) {
      throw new Error(`Cashfree Order Verification Failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.order_status,
      amount: data.order_amount,
      paidAt: data.order_expiry_time,
    };
  }

  /**
   * Cashfree Webhook Signature Verification:
   * Signature is computed as Base64 HMAC-SHA256 of: timestamp + rawBody using secretKey
   */
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    if (!this.isConfigured()) {
      // Allow testing webhook in test/dev environment
      return true;
    }

    try {
      const dataToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(dataToSign)
        .digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (e) {
      return false;
    }
  }
}

// Payment Service Abstraction allows swapping Cashfree with Stripe in the future
export class PaymentService {
  private provider: IPaymentProvider;

  constructor(provider?: IPaymentProvider) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  getProvider(): IPaymentProvider {
    return this.provider;
  }
}

export const paymentService = new PaymentService();
