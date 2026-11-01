import axios from "axios";
import prisma from "../src/utils/prisma.util";
import {
  createRedisPipeline,
  notificationQueue,
  redis,
} from "../src/utils/redis.util";

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

  for (const fn of [redis.rpush, redis.lpop, redis.llen, redis.pipeline]) {
    fn.mockReset();
  }
  redis.rpush.mockResolvedValue(1);
  redis.lpop.mockResolvedValue(null);
  redis.llen.mockResolvedValue(0);
  redis.pipeline.mockImplementation(() => createRedisPipeline());

  notificationQueue.add.mockReset();
  notificationQueue.add.mockResolvedValue({
    id: "notification-job",
    opts: { attempts: 5 },
  });

  axios.get.mockReset();
  axios.post.mockReset();
  axios.put.mockReset();
  axios.patch.mockReset();
  axios.delete.mockReset();
}
