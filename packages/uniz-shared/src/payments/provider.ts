type Env = Record<string, string | undefined>;

export interface CreateOrderInput {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export type CreateOrderResult =
  | { disabled: true; reason: string }
  | {
      disabled: false;
      orderId: string;
      amountPaise: number;
      currency: string;
      keyId: string;
    };

export interface VerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export type WebhookResult =
  | { disabled: true; reason: string }
  | { disabled: false; valid: boolean; event?: string; payload?: unknown };

export interface PaymentProvider {
  readonly name: string;
  readonly enabled: boolean;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifySignature(input: VerifySignatureInput): boolean;
  handleWebhook(rawBody: string, signature: string | undefined): WebhookResult;
}

export const PAYMENTS_DISABLED_REASON = "Payments coming soon";

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

/**
 * No live gateway yet. Every caller gets ComingSoonProvider until a real
 * provider is added in its own PR behind PAYMENTS_MODE.
 */
export function getPaymentProvider(_env: Env = process.env): PaymentProvider {
  return new ComingSoonProvider();
}
