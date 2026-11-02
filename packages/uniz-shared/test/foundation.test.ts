import { describe, it, expect } from "vitest";
import { isFeatureEnabled, getFeatureFlags } from "../src/flags";
import {
  getPaymentProvider,
  ComingSoonProvider,
} from "../src/payments/provider";
import { SmsSender } from "../src/notify/sms";

describe("flags", () => {
  it("defaults on", () =>
    expect(isFeatureEnabled("FEATURE_FEES", {})).toBe(true));
  it("can be turned off", () =>
    expect(isFeatureEnabled("FEATURE_FEES", { FEATURE_FEES: "false" })).toBe(
      false,
    ));
  it("keeps outpass parked even if set", () => {
    expect(
      isFeatureEnabled("FEATURE_OUTPASS", { FEATURE_OUTPASS: "true" }),
    ).toBe(false);
    expect(getFeatureFlags({}).FEATURE_OUTPASS).toBe(false);
  });
});

describe("payment provider", () => {
  it("is coming soon without keys", async () => {
    const p = getPaymentProvider({});
    expect(p).toBeInstanceOf(ComingSoonProvider);
    expect(await p.createOrder({ amountPaise: 100, receipt: "r" })).toEqual({
      disabled: true,
      reason: "Payments coming soon",
    });
    expect(
      p.verifySignature({ orderId: "a", paymentId: "b", signature: "c" }),
    ).toBe(false);
  });
  it("stays coming soon even with keys set", () => {
    expect(
      getPaymentProvider({
        RAZORPAY_KEY_ID: "k",
        RAZORPAY_KEY_SECRET: "s",
        PAYMENTS_MODE: "test",
      }),
    ).toBeInstanceOf(ComingSoonProvider);
    expect(getPaymentProvider({}).handleWebhook("{}", "x")).toMatchObject({
      disabled: true,
    });
  });
});

describe("sms", () => {
  it("is disabled without key", async () => {
    expect(
      await new SmsSender({}).send({ to: "+919999999999", text: "hi" }),
    ).toEqual({ disabled: true, reason: "SMS alerts not configured" });
  });
  it("sends with key and transport", async () => {
    const s = new SmsSender({ SMS_API_KEY: "k" }, async () => ({ id: "m1" }));
    expect(await s.send({ to: "+919999999999", text: "hi" })).toEqual({
      disabled: false,
      sent: true,
      providerId: "m1",
    });
    expect(await s.send({ to: "abc", text: "hi" })).toMatchObject({
      sent: false,
    });
  });
});
