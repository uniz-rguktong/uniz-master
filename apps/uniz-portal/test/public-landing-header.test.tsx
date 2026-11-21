import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layout } from "../src/layout";
import Home from "../src/pages/home";
import PrivacyPolicy from "../src/pages/PrivacyPolicy";
import SEOLanding from "../src/pages/seo-landing";

const mounts: Array<{ root: Root; host: HTMLElement }> = [];

function renderPublic(path: string, page: ReactNode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[path]}>
          <Layout>{page}</Layout>
        </MemoryRouter>
      </RecoilRoot>,
    );
  });
  mounts.push({ root, host });
  return host;
}

async function headerCount(path: string, page: ReactNode) {
  const host = renderPublic(path, page);
  // The shell Navbar is lazy. Wait for that import so a stacked bar cannot
  // sneak in after the first paint.
  await act(async () => {
    await vi.dynamicImportSettled();
  });
  return host.querySelectorAll("header");
}

describe("public headers", () => {
  afterEach(() => {
    localStorage.clear();
    for (const mount of mounts.splice(0)) {
      act(() => mount.root.unmount());
      mount.host.remove();
    }
  });

  it("renders a single header on the public landing", async () => {
    const headers = await headerCount("/", <Home />);
    expect(headers).toHaveLength(1);
    expect(headers[0]?.textContent).toMatch(/Sign in/);
    expect(headers[0]?.className).not.toContain("fixed");
  });

  it("renders a single header on the privacy page", async () => {
    expect(await headerCount("/privacy", <PrivacyPolicy />)).toHaveLength(1);
  });

  it("renders a single header on a public marketing page", async () => {
    const headers = await headerCount(
      "/student-project-management",
      <SEOLanding />,
    );
    expect(headers).toHaveLength(1);
    expect(headers[0]?.textContent).toMatch(/Sign in/);
  });
});
