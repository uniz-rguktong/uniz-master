import { beforeEach, vi } from "vitest";
import { resetInfraMocks } from "./reset-mocks";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  resetInfraMocks();
});
