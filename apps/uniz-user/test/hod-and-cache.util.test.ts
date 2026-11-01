import { describe, expect, it } from "vitest";
import { resolveHodBranch } from "../src/utils/hod.util";
import {
  CMS_PUBLIC_CACHE_TTL_SEC,
  publicBannersCacheKey,
  publicNotificationsCacheKey,
} from "../src/utils/cms-cache.util";
import {
  bootstrapCacheKey,
  invalidateAllStudentProfileCaches,
  invalidateStudentProfileCaches,
  profileCacheKey,
} from "../src/utils/student-cache.util";
import { UserReferenceSchema } from "../src/shared/user-ref.schema";
import { redisMock } from "./mocks";

describe("resolveHodBranch", () => {
  it("returns an empty string when there is no user", () => {
    expect(resolveHodBranch(undefined)).toBe("");
  });

  it("prefers a real department over the username suffix", () => {
    expect(
      resolveHodBranch({
        username: "hod_cse",
        role: "hod",
        department: "eee",
      }),
    ).toBe("EEE");
  });

  it("falls back to the username segment when department is GENERAL", () => {
    expect(
      resolveHodBranch({
        username: "hod-mech",
        role: "hod",
        department: "GENERAL",
      }),
    ).toBe("MECH");
  });

  it("returns empty when neither source has a branch", () => {
    expect(resolveHodBranch({ username: "faculty", role: "faculty" })).toBe(
      "",
    );
  });
});

describe("cache keys", () => {
  it("uses stable public CMS keys and a 45s ttl", () => {
    expect(CMS_PUBLIC_CACHE_TTL_SEC).toBe(45);
    expect(publicBannersCacheKey()).toBe("cms:public:banners:v1");
    expect(publicNotificationsCacheKey()).toBe("cms:public:notifications:v1");
  });

  it("uppercases student profile and bootstrap keys", () => {
    expect(profileCacheKey("o240001")).toBe("profile:v2:O240001");
    expect(bootstrapCacheKey("o240001")).toBe("bootstrap:v1:O240001");
  });
});

describe("student cache invalidation", () => {
  it("deletes both keys for one student", async () => {
    await invalidateStudentProfileCaches("o240001");
    expect(redisMock.del).toHaveBeenCalledWith(
      "profile:v2:O240001",
      "bootstrap:v1:O240001",
    );
  });

  it("scans both patterns and sums deleted keys", async () => {
    redisMock.scan
      .mockResolvedValueOnce(["12", ["profile:v2:A"]])
      .mockResolvedValueOnce(["0", ["profile:v2:B"]])
      .mockResolvedValueOnce(["0", []]);
    redisMock.del.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const deleted = await invalidateAllStudentProfileCaches();

    expect(deleted).toBe(2);
    expect(redisMock.scan).toHaveBeenCalledWith(
      "0",
      "MATCH",
      "profile:v2:*",
      "COUNT",
      500,
    );
    expect(redisMock.scan).toHaveBeenCalledWith(
      "12",
      "MATCH",
      "profile:v2:*",
      "COUNT",
      500,
    );
    expect(redisMock.scan).toHaveBeenCalledWith(
      "0",
      "MATCH",
      "bootstrap:v1:*",
      "COUNT",
      500,
    );
  });
});

describe("UserReferenceSchema", () => {
  it("requires userId and username and checks email", () => {
    expect(
      UserReferenceSchema.safeParse({
        userId: "1",
        username: "O240001",
        email: "ada@rguktong.ac.in",
      }).success,
    ).toBe(true);
    expect(
      UserReferenceSchema.safeParse({ userId: "1", email: "ada" }).success,
    ).toBe(false);
  });
});
