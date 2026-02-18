const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1/auth";

async function testPasswordResetFlow() {
  console.log("\n🔐 Testing New Password Reset Flow\n");
  console.log("=".repeat(50));

  const username = "o210008";

  // Step 1: Request OTP
  console.log("\n📧 Step 1: Requesting OTP for username:", username);
  console.log("-".repeat(50));

  try {
    const otpResponse = await fetch(`${BASE_URL}/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const otpData = await otpResponse.json();
    console.log("Response:", JSON.stringify(otpData, null, 2));

    if (!otpResponse.ok) {
      console.error("❌ Failed to request OTP");
      process.exit(1);
    }

    console.log("✅ OTP sent successfully!");

    // Step 2: Get OTP from user
    const otp = await new Promise((resolve) => {
      rl.question("\n🔢 Enter the OTP you received in email: ", (answer) => {
        resolve(answer.trim());
      });
    });

    // Step 3: Verify OTP
    console.log("\n🔍 Step 2: Verifying OTP...");
    console.log("-".repeat(50));

    const verifyResponse = await fetch(`${BASE_URL}/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, otp }),
    });

    const verifyData = await verifyResponse.json();
    console.log("Response:", JSON.stringify(verifyData, null, 2));

    if (!verifyResponse.ok) {
      console.error("❌ Failed to verify OTP");
      rl.close();
      process.exit(1);
    }

    if (!verifyData.resetToken) {
      console.error("❌ No reset token received!");
      rl.close();
      process.exit(1);
    }

    console.log("✅ OTP verified! Reset token received.");
    const resetToken = verifyData.resetToken;

    // Step 4: Reset Password
    const newPassword = await new Promise((resolve) => {
      rl.question("\n🔑 Enter new password: ", (answer) => {
        resolve(answer.trim());
      });
    });

    console.log("\n🔄 Step 3: Resetting password...");
    console.log("-".repeat(50));

    const resetResponse = await fetch(`${BASE_URL}/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, resetToken, newPassword }),
    });

    const resetData = await resetResponse.json();
    console.log("Response:", JSON.stringify(resetData, null, 2));

    if (!resetResponse.ok) {
      console.error("❌ Failed to reset password");
      rl.close();
      process.exit(1);
    }

    console.log("✅ Password reset successfully!");

    // Step 5: Test login with new password
    console.log("\n🔐 Step 4: Testing login with new password...");
    console.log("-".repeat(50));

    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: newPassword }),
    });

    const loginData = await loginResponse.json();
    console.log("Response:", JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.error("❌ Login failed with new password");
      rl.close();
      process.exit(1);
    }

    console.log("✅ Login successful with new password!");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 All tests passed! Password reset flow works correctly.");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

testPasswordResetFlow();
