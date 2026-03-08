import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 },
      );
    }

    const emailLower = (email as string).toLowerCase().trim();
    const submittedOtp = (otp as string).trim();

    const storedOtp = redis ? await redis.get(`otp:${emailLower}`) : null;

    console.log(`[OTP_VERIFY] Attempt for: ${emailLower}`);
    console.log(
      `[OTP_VERIFY] Stored: "${storedOtp}" (type: ${typeof storedOtp})`,
    );
    console.log(
      `[OTP_VERIFY] Received: "${submittedOtp}" (type: ${typeof submittedOtp})`,
    );

    if (!storedOtp) {
      return NextResponse.json(
        { error: "Code expired or not found. Please request a new one." },
        { status: 400 },
      );
    }

    // Use loose comparison or cast both to string to be safe
    if (String(storedOtp).trim() !== String(submittedOtp).trim()) {
      return NextResponse.json(
        {
          error:
            "Invalid verification code. Please check your email and try again.",
        },
        { status: 400 },
      );
    }

    // Mark email as verified for 30 minutes in Redis
    if (redis) {
      await redis.set(`verified:${emailLower}`, "true", { ex: 1800 });
      await redis.del(`otp:${emailLower}`);
    }

    return NextResponse.json({ message: "Identity verified." });
  } catch (error: any) {
    console.error("[OTP_VERIFY]", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
