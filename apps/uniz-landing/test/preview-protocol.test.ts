import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as landing from "../src/lib/preview-protocol.ts";
import * as portal from "../../uniz-portal/src/lib/preview-protocol.ts";
import type { SiteDraft } from "../src/lib/preview-protocol.ts";

const modules = [
  ["landing", landing],
  ["portal", portal],
] as const;

const draft: SiteDraft = {
  hero: { eyebrow: "Ongole Campus", title: "Campus title", subtitle: "Campus subtitle" },
  contact: { address: "Campus address", phone: "08592-223133", email: "director@rguktong.ac.in" },
  announcements: [{ text: "First", link: null }, { text: "Second", link: "https://rguktong.in" }],
  banners: [],
  notices: [],
  updates: [],
  stats: [],
  images: [],
};

describe("preview origins", () => {
  for (const [name, protocol] of modules) {
    it(`${name} accepts the portal and rejects everyone else in production`, () => {
      assert.equal(protocol.isAllowedPortalOrigin("https://uniz.rguktong.in", false), true);
      assert.equal(protocol.isAllowedPortalOrigin("https://rguktong.in", false), false);
      assert.equal(protocol.isAllowedPortalOrigin("http://localhost:5173", false), false);
      assert.equal(protocol.isAllowedPortalOrigin("https://evil.example", false), false);
      assert.equal(protocol.isAllowedPortalOrigin("http://localhost:5173", true), true);
      assert.equal(protocol.isAllowedPortalOrigin("http://127.0.0.1:4173", true), true);
      assert.equal(protocol.isAllowedPortalOrigin("https://localhost:5173", true), false);
    });

    it(`${name} accepts the public site and a dev landing port`, () => {
      assert.equal(protocol.isAllowedLandingOrigin("https://rguktong.in", false), true);
      assert.equal(protocol.isAllowedLandingOrigin("https://www.rguktong.in", false), true);
      assert.equal(protocol.isAllowedLandingOrigin("https://uniz.rguktong.in", false), false);
      assert.equal(protocol.isAllowedLandingOrigin("http://127.0.0.1:5174", false), false);
      assert.equal(protocol.isAllowedLandingOrigin("http://127.0.0.1:5174", true), true);
    });

    it(`${name} shows edit chrome only for an authorized preview`, () => {
      assert.equal(protocol.previewChromeEnabled(false, false), false);
      assert.equal(protocol.previewChromeEnabled(true, false), false);
      assert.equal(protocol.previewChromeEnabled(false, true), false);
      assert.equal(protocol.previewChromeEnabled(true, true), true);
    });

    it(`${name} ignores messages from the wrong window`, () => {
      assert.equal(protocol.readPreviewMessage(null, protocol.ADMIN_SOURCE), null);
      assert.equal(protocol.readPreviewMessage("auth", protocol.ADMIN_SOURCE), null);
      assert.equal(
        protocol.readPreviewMessage({ source: protocol.LANDING_SOURCE, type: "ready" }, protocol.ADMIN_SOURCE),
        null,
      );
      assert.equal(
        protocol.readPreviewMessage({ source: protocol.ADMIN_SOURCE, type: "" }, protocol.ADMIN_SOURCE),
        null,
      );
      const message = protocol.readPreviewMessage(
        { source: protocol.ADMIN_SOURCE, type: "auth", token: "secret" },
        protocol.ADMIN_SOURCE,
      );
      assert.equal(message?.type, "auth");
    });

    it(`${name} patches the draft field that was edited`, () => {
      const next = protocol.applyPreviewPatch(draft, "hero-title", "Edited title");
      assert.equal(next.hero.title, "Edited title");
      assert.equal(next.hero.subtitle, draft.hero.subtitle);
      const item = protocol.applyPreviewPatch(draft, "ticker-item", { index: 1, text: "Updated" });
      assert.equal(item.announcements[0].text, "First");
      assert.equal(item.announcements[1].text, "Updated");
      assert.equal(protocol.applyPreviewPatch(draft, "hero-title", 12), draft);
      assert.equal(protocol.applyPreviewPatch(draft, "unknown", "x"), draft);
    });
  }
});
