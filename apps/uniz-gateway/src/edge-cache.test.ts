import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRIVATE_CACHE_CONTROL,
  PUBLIC_EDGE_CACHE_CONTROL,
  applyEdgeCacheToHeaderMap,
  decideEdgeCacheControl,
  pathOnly,
} from "./edge-cache.ts";

describe("decideEdgeCacheControl", () => {
  it("caches an anonymous public landing read", () => {
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: pathOnly("/api/v1/cms/api/home/?x=1"),
        status: 200,
      }),
      PUBLIC_EDGE_CACHE_CONTROL,
    );
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/cms/api/departments/CSE",
        status: 200,
      }),
      PUBLIC_EDGE_CACHE_CONTROL,
    );
  });

  it("does not cache authenticated, cookied, or personalized reads", () => {
    for (const extra of [
      { authorization: "Bearer token" },
      { cookie: "session=1" },
      { setCookie: "sid=1" },
    ]) {
      assert.equal(
        decideEdgeCacheControl({
          method: "GET",
          path: "/api/v1/cms/api/home/",
          status: 200,
          ...extra,
        }),
        PRIVATE_CACHE_CONTROL,
      );
    }
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/profile/me",
        status: 200,
      }),
      null,
    );
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/profile/me",
        authorization: "Bearer token",
        status: 200,
      }),
      PRIVATE_CACHE_CONTROL,
    );
  });

  it("does not cache writes, errors, admin, or preview", () => {
    assert.equal(
      decideEdgeCacheControl({
        method: "PUT",
        path: "/api/v1/cms/api/home/",
        status: 200,
      }),
      PRIVATE_CACHE_CONTROL,
    );
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/cms/api/institute/about",
        status: 404,
      }),
      PRIVATE_CACHE_CONTROL,
    );
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/cms/api/preview/session",
        status: 200,
      }),
      null,
    );
    assert.equal(
      decideEdgeCacheControl({
        method: "GET",
        path: "/api/v1/files/img/photo.webp",
        status: 200,
      }),
      null,
    );
  });

  it("sets Vary and replaces a shared cache header when the request is private", () => {
    const headers: Record<string, unknown> = {
      "Cache-Control": "public, s-maxage=60",
      Vary: "Accept-Encoding",
    };
    applyEdgeCacheToHeaderMap(headers, {
      method: "GET",
      path: "/api/v1/cms/api/home/",
      authorization: "Bearer token",
      status: 200,
    });
    assert.equal(headers["cache-control"], PRIVATE_CACHE_CONTROL);
    assert.equal(headers["Cache-Control"], undefined);
    assert.equal(headers["vary"], "Accept-Encoding, Authorization, Cookie");
  });
});
