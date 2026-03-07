import prisma from "@/lib/prisma";
import { apiResponse, apiHandler } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { Prisma } from "@/lib/generated/client";

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build filter query
  const where: Prisma.EventWhereInput = {};
  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }
  if (date) {
    // Filter for specific date (start of day to end of day)
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = {
      gte: start,
      lte: end,
    };
  }

  // Fetch events
  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" }, // Upcoming events first
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,
      date: true,
      time: true,
      venue: true,
      category: true,
      posterUrl: true,
      maxCapacity: true,
      price: true,
      fee: true,
      registrationOpen: true,
      eventType: true,
      teamSizeMin: true,
      teamSizeMax: true,
    },
  });

  return apiResponse(true, events);
});
