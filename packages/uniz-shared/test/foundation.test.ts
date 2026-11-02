import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { isFeatureEnabled, getFeatureFlags } from "../src/flags";
import { getPaymentProvider, ComingSoonProvider, RazorpayTestProvider } from "../src/payments/provider";
import { SmsSender } from "../src/notify/sms";

describe("flags", () => {
  it("defaults on", () => expect(isFeatureEnabled("FEATURE_FEES", {})).toBe(true));
  it("can be turned off", () => expect(isFeatureEnabled("FEATURE_FEES", { FEATURE_FEES: "false" })).toBe(false));
  it("keeps outpass parked even if set", () => {
    expect(isFeatureEnabled("FEATURE_OUTPASS", { FEATURE_OUTPASS: "true" })).toBe(false);
    expect(getFeatureFlags({}).FEATURE_OUTPASS).toBe(false);
  });
});

describe("payment provider", () => {
  it("is coming soon without keys", async () => {
    const p = getPaymentProvider({});
    expect(p).toBeInstanceOf(ComingSoonProvider);
    expect(await p.createOrder({ amountPaise: 100, receipt: "r" })).toEqual({ disabled: true, reason: "Payments coming soon" });
    expect(p.verifySignature({ orderId: "a", paymentId: "b", signature: "c" })).toBe(false);
  });
  it("is coming soon with keys but bad mode", () => {
    expect(getPaymentProvider({ RAZORPAY_KEY_ID: "k", RAZORPAY_KEY_SECRET: "s", PAYMENTS_MODE: "off" })).toBeInstanceOf(ComingSoonProvider);
  });
  it("uses razorpay in test mode and verifies signatures", () => {
    const p = getPaymentProvider({ RAZORPAY_KEY_ID: "k", RAZORPAY_KEY_SECRET: "s", PAYMENTS_MODE: "test", RAZORPAY_WEBHOOK_SECRET: "w" });
    expect(p).toBeInstanceOf(RazorpayTestProvider);
    const sig = createHmac("sha256", "s").update("o|p").digest("hex");
    expect(p.verifySignature({ orderId: "o", paymentId: "p", signature: sig })).toBe(true);
    expect(p.verifySignature({ orderId: "o", paymentId: "p", signature: "bad" })).toBe(false);
    const body = JSON.stringify({ event: "payment.captured" });
    const wsig = createHmac("sha256", "w").update(body).digest("hex");
    expect(p.handleWebhook(body, wsig)).toMatchObject({ valid: true, event: "payment.captured" });
    expect(p.handleWebhook(body, "x")).toMatchObject({ valid: false });
  });
  it("creates an order through fetch", async () => {
    const p = new RazorpayTestProvider("k", "s", undefined, async () => ({ ok: true, status: 200, json: async () => ({ id: "order_1", amount: 500, currency: "INR" }) }));
    expect(await p.createOrder({ amountPaise: 500, receipt: "r" })).toMatchObject({ disabled: false, orderId: "order_1" });
    await expect(p.createOrder({ amountPaise: 0, receipt: "r" })).rejects.toThrow();
  });
});

describe("sms", () => {
  it("is disabled without key", async () => {
    expect(await new SmsSender({}).send({ to: "+919999999999", text: "hi" })).toEqual({ disabled: true, reason: "SMS alerts not configured" });
  });
  it("sends with key and transport", async () => {
    const s = new SmsSender({ SMS_API_KEY: "k" }, async () => ({ id: "m1" }));
    expect(await s.send({ to: "+919999999999", text: "hi" })).toEqual({ disabled: false, sent: true, providerId: "m1" });
    expect(await s.send({ to: "abc", text: "hi" })).toMatchObject({ sent: false });
  });
});
