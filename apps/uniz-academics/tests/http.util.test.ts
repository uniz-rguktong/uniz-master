import { describe, expect, it } from "vitest";
import { setNoStore } from "../src/utils/http.util";
import { mockResponse } from "./http";

describe("setNoStore", () => {
  it("marks a response so shared caches will not keep it", () => {
    const res = mockResponse();
    setNoStore(res as any);
    expect(res.headers["Cache-Control"]).toBe(
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    expect(res.headers.Pragma).toBe("no-cache");
    expect(res.headers.Expires).toBe("0");
  });
});
