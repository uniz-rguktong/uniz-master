import { NextRequest } from "next/server";
import { apiHandler, apiResponse } from "@/lib/api-utils";

export const GET = apiHandler(async (_request: NextRequest) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return apiResponse(false, null, "VAPID public key is not configured", 500);
  }

  return apiResponse(true, { publicKey });
});
