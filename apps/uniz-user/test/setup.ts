import { beforeEach, vi } from "vitest";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
import os from "os";
import path from "path";
import { axiosMock, prismaMock, redisMock } from "./mocks";

process.env.NODE_ENV = "test";
process.env.JWT_SECURITY_KEY = "unit-test-jwt-secret";
process.env.INTERNAL_SECRET = "unit-test-internal";
process.env.CMS_PUBLIC_API_KEY = "unit-test-cms-key";
process.env.UPLOADS_DIR = path.join(os.tmpdir(), "uniz-user-unit-uploads");
process.env.PUBLIC_UPLOADS_BASE_URL = "http://uploads.test/files/img";
delete process.env.REDIS_URL;
delete process.env.DATABASE_URL;
delete process.env.USER_DATABASE_URL;
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_UPLOAD_PRESET;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;

function resetFns(target: Record<string, any>) {
  for (const value of Object.values(target)) {
    if (value && typeof value.mockReset === "function") value.mockReset();
    else if (value && typeof value === "object") resetFns(value);
  }
}

beforeEach(() => {
  resetFns(redisMock);
  resetFns(prismaMock);
  axiosMock.get.mockReset();
  axiosMock.post.mockReset();
  redisMock.del.mockResolvedValue(1);
  redisMock.setex.mockResolvedValue("OK");
  redisMock.lpop.mockResolvedValue(null);
  redisMock.llen.mockResolvedValue(0);
  redisMock.rpush.mockResolvedValue(1);
  redisMock.expire.mockResolvedValue(1);
  axiosMock.get.mockResolvedValue({ data: {} });
  axiosMock.post.mockResolvedValue({ data: {} });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
