import axios from "axios";
import prisma from "../src/utils/prisma.util";
import { redis } from "../src/utils/redis.util";

export function resetInfraMocks() {
  prisma.academicSemester.findUnique.mockReset();
  prisma.academicSemester.findFirst.mockReset();
  prisma.academicSemester.findMany.mockReset();
  prisma.branchAllocation.findMany.mockReset();
  prisma.subject.findMany.mockReset();

  prisma.academicSemester.findUnique.mockResolvedValue(null);
  prisma.academicSemester.findFirst.mockResolvedValue(null);
  prisma.academicSemester.findMany.mockResolvedValue([]);
  prisma.branchAllocation.findMany.mockResolvedValue([]);
  prisma.subject.findMany.mockResolvedValue([]);

  for (const fn of [
    redis.get,
    redis.getBuffer,
    redis.set,
    redis.setex,
    redis.del,
    redis.incr,
    redis.expire,
  ]) {
    fn.mockReset();
  }
  redis.get.mockResolvedValue(null);
  redis.getBuffer.mockResolvedValue(null);
  redis.set.mockResolvedValue("OK");
  redis.setex.mockResolvedValue("OK");
  redis.del.mockResolvedValue(1);
  redis.incr.mockResolvedValue(1);
  redis.expire.mockResolvedValue(1);

  axios.get.mockReset();
  axios.post.mockReset();
}
