import axios from "axios";
import { describe, expect, it } from "vitest";
import { invalidateStudentAcademicCaches } from "../src/utils/student-cache.util";
import { redis } from "../src/utils/redis.util";

describe("invalidateStudentAcademicCaches", () => {
  it("deletes the grade and attendance keys, then tells the user service", async () => {
    axios.post.mockResolvedValue({ data: {} });
    await invalidateStudentAcademicCaches("o210008");
    expect(redis.del).toHaveBeenCalledWith(
      "grades_v3:O210008",
      "grades:O210008",
      "attendance_v1:O210008",
    );
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/internal/invalidate-student-cache"),
      { username: "O210008" },
      expect.objectContaining({
        headers: { "x-internal-secret": "unit-test-internal" },
        timeout: 2000,
      }),
    );
  });

  it("still calls the user service when Redis is down", async () => {
    redis.del.mockRejectedValue(new Error("redis down"));
    axios.post.mockResolvedValue({ data: {} });
    await expect(
      invalidateStudentAcademicCaches("O210008"),
    ).resolves.toBeUndefined();
    expect(axios.post).toHaveBeenCalled();
  });

  it("swallows a user-service failure", async () => {
    axios.post.mockRejectedValue(new Error("offline"));
    await expect(
      invalidateStudentAcademicCaches("O210008"),
    ).resolves.toBeUndefined();
  });
});
