import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 10-minute expiry
    if (redis) {
      await redis.set(`otp:${emailLower}`, otp, "EX", 600);
    } else {
      console.error("[OTP_SEND] Redis client not initialized");
      return NextResponse.json(
        { error: "Internal server error (Storage)." },
        { status: 500 },
      );
    }

    // Send Email
    await sendOTPEmail(emailLower, otp);

    return NextResponse.json({ message: "Verification code sent." });
  } catch (error: any) {
    console.error("[OTP_SEND]", error);
    return NextResponse.json(
      { error: error.message || "Failed to send verification code." },
      { status: 500 },
    );
  }
}
