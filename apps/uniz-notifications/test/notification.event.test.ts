import { describe, expect, it } from "vitest";
import { ErrorCode } from "../src/shared/error-codes";
import { ADMIN_ROLES } from "../src/shared/roles.enum";
import {
  NotificationEventSchema,
  NotificationType,
} from "../src/shared/notification.event";

describe("notification event schema", () => {
  it("accepts an email or any other recipient string", () => {
    expect(
      NotificationEventSchema.parse({
        type: NotificationType.EMAIL,
        recipient: "ada@example.com",
        subject: "Hello",
        body: "World",
        metadata: { ticket: 1 },
      }),
    ).toMatchObject({ type: "EMAIL", subject: "Hello" });

    expect(
      NotificationEventSchema.parse({
        type: "PUSH",
        recipient: "device-token",
        body: "Ping",
      }).type,
    ).toBe("PUSH");
  });

  it("rejects an unknown type and an empty payload", () => {
    expect(
      NotificationEventSchema.safeParse({
        type: "FAX",
        recipient: "ada@example.com",
        body: "x",
      }).success,
    ).toBe(false);
    expect(NotificationEventSchema.safeParse({}).success).toBe(false);
  });
});

describe("shared re-exports", () => {
  it("re-exports error codes and admin roles from the shared package", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ADMIN_ROLES).toContain("webadmin");
    expect(ADMIN_ROLES).not.toContain("student");
  });
});
