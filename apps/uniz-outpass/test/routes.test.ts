import { describe, expect, it } from "vitest";
import "./mocks";
import requestRouter from "../src/routes/request.routes";

describe("request routes", () => {
  it("registers the student, approval, security, and purge routes behind auth", () => {
    const routes = requestRouter.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => {
        const method = Object.keys(layer.route.methods)[0].toUpperCase();
        return `${method} ${layer.route.path}`;
      });

    expect(routes).toEqual([
      "DELETE /internal/student/:studentId",
      "POST /outpass",
      "POST /outing",
      "GET /history",
      "GET /history/:id",
      "GET /outside",
      "GET /outing/all",
      "GET /outpass/all",
      "POST /:id/approve",
      "POST /:id/forward",
      "POST /:id/reject",
      "GET /security/summary",
      "POST /:id/checkout",
      "POST /:id/checkin",
    ]);

    const outpass = requestRouter.stack.find(
      (layer: any) => layer.route?.path === "/outpass",
    );
    expect(outpass.route.stack.length).toBeGreaterThan(1);
  });
});
