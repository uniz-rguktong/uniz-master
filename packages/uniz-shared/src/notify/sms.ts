type Env = Record<string, string | undefined>;

export const SMS_DISABLED_REASON = "SMS alerts not configured";

export interface SmsMessage {
  to: string;
  templateId?: string;
  text: string;
}

export type SmsResult =
  | { disabled: true; reason: string }
  | { disabled: false; sent: boolean; providerId?: string; error?: string };

export type SmsTransport = (msg: SmsMessage, cfg: { provider: string; apiKey: string; senderId?: string }) => Promise<{ id?: string }>;

const PHONE = /^\+?\d{10,15}$/;

export class SmsSender {
  private readonly apiKey: string | undefined;
  private readonly provider: string;
  private readonly senderId: string | undefined;

  constructor(env: Env = process.env, private readonly transport?: SmsTransport) {
    this.apiKey = env.SMS_API_KEY || undefined;
    this.provider = env.SMS_PROVIDER || "msg91";
    this.senderId = env.SMS_SENDER_ID || undefined;
  }

  get enabled(): boolean {
    return Boolean(this.apiKey && this.transport);
  }

  async send(msg: SmsMessage): Promise<SmsResult> {
    if (!this.apiKey || !this.transport) return { disabled: true, reason: SMS_DISABLED_REASON };
    if (!PHONE.test(msg.to) || !msg.text) return { disabled: false, sent: false, error: "invalid message" };
    try {
      const r = await this.transport(msg, { provider: this.provider, apiKey: this.apiKey, senderId: this.senderId });
      return { disabled: false, sent: true, providerId: r.id };
    } catch (e) {
      return { disabled: false, sent: false, error: e instanceof Error ? e.message : "send failed" };
    }
  }
}
