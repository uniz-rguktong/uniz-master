import { createHmac, timingSafeEqual } from "crypto";

type Env = Record<string, string | undefined>;

export interface CreateOrderInput {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export type CreateOrderResult =
  | { disabled: true; reason: string }
  | { disabled: false; orderId: string; amountPaise: number; currency: string; keyId: string };

export interface VerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export type WebhookResult =
  | { disabled: true; reason: string }
  | { disabled: false; valid: boolean; event?: string; payload?: unknown };

export interface PaymentProvider {
  readonly name: "razorpay-test" | "coming-soon";
  readonly enabled: boolean;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifySignature(input: VerifySignatureInput): boolean;
  handleWebhook(rawBody: string, signature: string | undefined): WebhookResult;
}

export const PAYMENTS_DISABLED_REASON = "Payments coming soon";

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export class ComingSoonProvider implements PaymentProvider {
  readonly name = "coming-soon" as const;
  readonly enabled = false;
  constructor(readonly reason: string = PAYMENTS_DISABLED_REASON) {}
  async createOrder(): Promise<CreateOrderResult> {
    return { disabled: true, reason: this.reason };
  }
  verifySignature(): boolean {
    return false;
  }
  handleWebhook(): WebhookResult {
    return { disabled: true, reason: this.reason };
  }
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

export class RazorpayTestProvider implements PaymentProvider {
  readonly name = "razorpay-test" as const;
  readonly enabled = true;
  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string | undefined,
    private readonly fetchImpl: FetchLike = (globalThis as any).fetch,
  ) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
      throw new Error("amountPaise must be a positive integer");
    }
    const currency = input.currency ?? "INR";
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await this.fetchImpl("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: input.amountPaise, currency, receipt: input.receipt, notes: input.notes }),
    });
    if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
    const body = await res.json();
    return { disabled: false, orderId: body.id, amountPaise: body.amount, currency: body.currency, keyId: this.keyId };
  }

  verifySignature({ orderId, paymentId, signature }: VerifySignatureInput): boolean {
    if (!orderId || !paymentId || !signature) return false;
    const expected = createHmac("sha256", this.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return safeEqualHex(expected, signature);
  }

  handleWebhook(rawBody: string, signature: string | undefined): WebhookResult {
    if (!this.webhookSecret) return { disabled: true, reason: "Payment webhook not configured" };
    if (!signature) return { disabled: false, valid: false };
    const expected = createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    if (!safeEqualHex(expected, signature)) return { disabled: false, valid: false };
    try {
      const payload = JSON.parse(rawBody);
      return { disabled: false, valid: true, event: payload?.event, payload };
    } catch {
      return { disabled: false, valid: false };
    }
  }
}

/** Picks Razorpay only when keys exist and PAYMENTS_MODE is test or live. */
export function getPaymentProvider(env: Env = process.env): PaymentProvider {
  const mode = (env.PAYMENTS_MODE ?? "").trim().toLowerCase();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || (mode !== "test" && mode !== "live")) {
    return new ComingSoonProvider();
  }
  return new RazorpayTestProvider(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET, env.RAZORPAY_WEBHOOK_SECRET);
}
