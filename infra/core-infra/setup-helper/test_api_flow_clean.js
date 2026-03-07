const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

// Global state
const state = {
  tokens: {},
  data: {},
};

// Helper for nicely formatting JSON
const formatJSON = (data) => JSON.stringify(data, null, 2);

// Helper to run a test step
async function runStep(stepName, requestFn) {
  console.log(
    `\n${colors.bright}${colors.cyan}=== STEP: ${stepName} ===${colors.reset}`,
  );
  const start = process.hrtime();

  try {
    const result = await requestFn();

    const end = process.hrtime(start);
    const timeTaken = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

    console.log(
      `${colors.yellow}Request:${colors.reset} ${result.method.toUpperCase()} ${result.url}`,
    );
    console.log(`${colors.green}Time Taken:${colors.reset} ${timeTaken} ms`);
    console.log(`${colors.blue}Response Body:${colors.reset}`);
    console.log(formatJSON(result.data));

    return result.data;
  } catch (error) {
    const end = process.hrtime(start);
    const timeTaken = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

    console.log(`${colors.red}FAILED: ${stepName}${colors.reset}`);
    console.log(`${colors.yellow}Time Taken:${colors.reset} ${timeTaken} ms`);

    if (error.response) {
      console.log(
        `${colors.yellow}Request:${colors.reset} ${error.config.method.toUpperCase()} ${error.config.url}`,
      );
      console.log(
        `${colors.red}Status:${colors.reset} ${error.response.status}`,
      );
      console.log(`${colors.blue}Response Body:${colors.reset}`);
      console.log(formatJSON(error.response.data));
      return error.response.data; // Return data even on error for some checks
    } else {
      console.log(`${colors.red}Error:${colors.reset} ${error.message}`);
    }
    // Don't exit process, allow flow to continue if possible, or decide logic in main
    return null;
  }
}

async function main() {
  console.log(
    `${colors.bright}${colors.cyan}=== STARTING UNIZ API FLOW TEST ===${colors.reset}`,
  );
  const totalStart = process.hrtime();

  try {
    // 1. Student Login
    await runStep("Student Login (o210008)", async () => {
      const res = await axios.post("http://localhost:3001/login", {
        username: "o210008",
        password: "sree@2006",
      });
      state.tokens.student = res.data.token;
      return {
        method: "post",
        url: "http://localhost:3001/login",
        data: res.data,
      };
    });

    if (!state.tokens.student) {
      console.error("Stopping: Failed to get student token");
      return;
    }

    // 2. Get Profile
    await runStep("Get Student Profile", async () => {
      const res = await axios.get("http://localhost:3002/student/me", {
        headers: { Authorization: `Bearer ${state.tokens.student}` },
      });
      return {
        method: "get",
        url: "http://localhost:3002/student/me",
        data: res.data,
      };
    });

    // 3. Update Profile
    await runStep("Update Profile", async () => {
      const res = await axios.put(
        "http://localhost:3002/student/update",
        {
          phone: "9876543210",
        },
        {
          headers: { Authorization: `Bearer ${state.tokens.student}` },
        },
      );
      return {
        method: "put",
        url: "http://localhost:3002/student/update",
        data: res.data,
      };
    });

    // 4. Request OTP
    await runStep("Request OTP for password reset", async () => {
      const res = await axios.post("http://localhost:3001/otp/request", {
        username: "o210008",
      });
      return {
        method: "post",
        url: "http://localhost:3001/otp/request",
        data: res.data,
      };
    });

    // 5. Extract OTP
    console.log(
      `\n${colors.bright}${colors.cyan}=== STEP: Extract OTP from logs ===${colors.reset}`,
    );
    // Wait a bit for log to be written
    await new Promise((r) => setTimeout(r, 1000));

    try {
      const logContent = fs.readFileSync("auth.log", "utf8");
      const lines = logContent.split("\n");
      let otp = null;
      // Search from end
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes("OTP for o210008")) {
          const parts = lines[i].trim().split(" ");
          otp = parts[parts.length - 1];
          break;
        }
      }

      if (otp) {
        state.data.otp = otp;
        console.log(`${colors.green}✓ OTP extracted:${colors.reset} ${otp}`);
      } else {
        console.log(`${colors.red}✗ OTP not found in auth.log${colors.reset}`);
      }
    } catch (err) {
      console.log(
        `${colors.red}✗ Failed to read auth.log: ${err.message}${colors.reset}`,
      );
    }

    if (state.data.otp) {
      // 6. Reset Password
      await runStep("Reset password to sree@2006", async () => {
        const res = await axios.post("http://localhost:3001/password/reset", {
          username: "o210008",
          otp: state.data.otp,
          newPassword: "sree@2006",
        });
        return {
          method: "post",
          url: "http://localhost:3001/password/reset",
          data: res.data,
        };
      });

      // 7. Login with new password
      await runStep("Login with new password", async () => {
        const res = await axios.post("http://localhost:3001/login", {
          username: "o210008",
          password: "sree@2006",
        });
        state.tokens.student = res.data.token; // Update token
        return {
          method: "post",
          url: "http://localhost:3001/login",
          data: res.data,
        };
      });
    } else {
      console.log("Skipping password reset steps due to missing OTP");
    }

    // 8. Send first outpass request
    await runStep("Send first outpass request", async () => {
      const res = await axios.post(
        "http://localhost:3003/outpass",
        {
          reason: "Going home for festival",
          fromDay: "2026-02-01T00:00:00Z",
          toDay: "2026-02-05T00:00:00Z",
          studentGender: "M",
        },
        {
          headers: { Authorization: `Bearer ${state.tokens.student}` },
        },
      );
      if (res.data.data && res.data.data.id) {
        state.data.outpassId = res.data.data.id;
      }
      return {
        method: "post",
        url: "http://localhost:3003/outpass",
        data: res.data,
      };
    });

    // 9. Try second request (should fail)
    await runStep("Try second outpass request (should fail)", async () => {
      // We expect this to fail with 400 or similar
      // Axios throws on non-2xx by default, handled in runStep catch block
      const res = await axios.post(
        "http://localhost:3003/outpass",
        {
          reason: "Another reason",
          fromDay: "2026-02-10T00:00:00Z",
          toDay: "2026-02-15T00:00:00Z",
          studentGender: "M",
        },
        {
          headers: { Authorization: `Bearer ${state.tokens.student}` },
        },
      );
      return {
        method: "post",
        url: "http://localhost:3003/outpass",
        data: res.data,
      };
    });

    if (state.data.outpassId) {
      // 10. Caretaker approves
      await runStep("Caretaker Login", async () => {
        const res = await axios.post("http://localhost:3001/login", {
          username: "caretaker_male",
          password: "caretaker@uniz",
        });
        state.tokens.caretaker = res.data.token;
        return {
          method: "post",
          url: "http://localhost:3001/login",
          data: res.data,
        };
      });

      if (state.tokens.caretaker) {
        await runStep("Caretaker approves", async () => {
          const res = await axios.post(
            `http://localhost:3003/${state.data.outpassId}/approve`,
            {
              comment: "Approved by caretaker",
            },
            {
              headers: { Authorization: `Bearer ${state.tokens.caretaker}` },
            },
          );
          return {
            method: "post",
            url: `http://localhost:3003/${state.data.outpassId}/approve`,
            data: res.data,
          };
        });
      }

      // 11. Warden approves
      await runStep("Warden Login", async () => {
        const res = await axios.post("http://localhost:3001/login", {
          username: "warden_male",
          password: "warden@uniz",
        });
        state.tokens.warden = res.data.token;
        return {
          method: "post",
          url: "http://localhost:3001/login",
          data: res.data,
        };
      });

      if (state.tokens.warden) {
        await runStep("Warden approves", async () => {
          const res = await axios.post(
            `http://localhost:3003/${state.data.outpassId}/approve`,
            {
              comment: "Approved by warden",
            },
            {
              headers: { Authorization: `Bearer ${state.tokens.warden}` },
            },
          );
          return {
            method: "post",
            url: `http://localhost:3003/${state.data.outpassId}/approve`,
            data: res.data,
          };
        });
      }

      // 12. SWO final approval
      await runStep("SWO Login", async () => {
        const res = await axios.post("http://localhost:3001/login", {
          username: "swo_admin",
          password: "swo@uniz",
        });
        state.tokens.swo = res.data.token;
        return {
          method: "post",
          url: "http://localhost:3001/login",
          data: res.data,
        };
      });

      if (state.tokens.swo) {
        await runStep("SWO gives final approval", async () => {
          const res = await axios.post(
            `http://localhost:3003/${state.data.outpassId}/approve`,
            {
              comment: "Final approval",
            },
            {
              headers: { Authorization: `Bearer ${state.tokens.swo}` },
            },
          );
          return {
            method: "post",
            url: `http://localhost:3003/${state.data.outpassId}/approve`,
            data: res.data,
          };
        });
      }
    }

    // 13. Student checks status
    await runStep("Student checks outpass status", async () => {
      const res = await axios.get("http://localhost:3003/history", {
        headers: { Authorization: `Bearer ${state.tokens.student}` },
      });
      return {
        method: "get",
        url: "http://localhost:3003/history",
        data: res.data,
      };
    });

    // 14. Warden updates presence
    if (state.tokens.warden) {
      await runStep(
        "Warden updates student presence (back in campus)",
        async () => {
          const res = await axios.put(
            "http://localhost:3002/student/status",
            {
              username: "o210008",
              isPresent: true,
            },
            {
              headers: { Authorization: `Bearer ${state.tokens.warden}` },
            },
          );
          return {
            method: "put",
            url: "http://localhost:3002/student/status",
            data: res.data,
          };
        },
      );
    }

    // 15. View grades
    await runStep("Student views grades", async () => {
      const res = await axios.get("http://localhost:3004/grades", {
        headers: { Authorization: `Bearer ${state.tokens.student}` },
      });
      return {
        method: "get",
        url: "http://localhost:3004/grades",
        data: res.data,
      };
    });

    // 16. View attendance
    await runStep("Student views attendance", async () => {
      const res = await axios.get("http://localhost:3004/attendance", {
        headers: { Authorization: `Bearer ${state.tokens.student}` },
      });
      return {
        method: "get",
        url: "http://localhost:3004/attendance",
        data: res.data,
      };
    });

    // 17. Director searches student
    await runStep("Director Login", async () => {
      const res = await axios.post("http://localhost:3001/login", {
        username: "director",
        password: "director@uniz",
      });
      state.tokens.director = res.data.token;
      return {
        method: "post",
        url: "http://localhost:3001/login",
        data: res.data,
      };
    });

    if (state.tokens.director) {
      await runStep("Director searches for student o210008", async () => {
        const res = await axios.post(
          "http://localhost:3002/student/search",
          {
            username: "o210008",
          },
          {
            headers: { Authorization: `Bearer ${state.tokens.director}` },
          },
        );
        return {
          method: "post",
          url: "http://localhost:3002/student/search",
          data: res.data,
        };
      });
    }

    // 18. Webmaster adds new student
    await runStep("Webmaster Login", async () => {
      const res = await axios.post("http://localhost:3001/login", {
        username: "webmaster",
        password: "webmaster@uniz",
      });
      state.tokens.webmaster = res.data.token;
      return {
        method: "post",
        url: "http://localhost:3001/login",
        data: res.data,
      };
    });

    if (state.tokens.webmaster) {
      await runStep("Webmaster adds new student o220002", async () => {
        // Should handle if user already exists
        try {
          const res = await axios.post("http://localhost:3001/signup", {
            username: "o220002",
            password: "password123",
            role: "student",
          });
          return {
            method: "post",
            url: "http://localhost:3001/signup",
            data: res.data,
          };
        } catch (e) {
          // If it fails because user exists, that's fine for re-runs
          // Check for 400 or 409
          if (
            e.response &&
            (e.response.status === 400 || e.response.status === 409) &&
            e.response.data &&
            (e.response.data.message || "").includes("exists")
          ) {
            return {
              method: "post",
              url: "http://localhost:3001/signup",
              data: {
                message: "User likely already exists (Expected on rerun)",
              },
            };
          }
          throw e;
        }
      });

      // 19. Webmaster publishes banner
      await runStep("Webmaster publishes banner", async () => {
        const res = await axios.post(
          "http://localhost:3002/admin/banners",
          {
            title: "Important Announcement",
            text: "Semester exams from Feb 15",
            imageUrl: "https://via.placeholder.com/800x400",
          },
          {
            headers: { Authorization: `Bearer ${state.tokens.webmaster}` },
          },
        );
        return {
          method: "post",
          url: "http://localhost:3002/admin/banners",
          data: res.data,
        };
      });

      // 20. Get banners
      await runStep("Get all banners", async () => {
        const res = await axios.get("http://localhost:3002/admin/banners", {
          headers: { Authorization: `Bearer ${state.tokens.webmaster}` },
        });
        return {
          method: "get",
          url: "http://localhost:3002/admin/banners",
          data: res.data,
        };
      });
    }

    const totalEnd = process.hrtime(totalStart);
    const totalTimeTaken = (totalEnd[0] * 1000 + totalEnd[1] / 1e6).toFixed(2);
    console.log(
      `\n${colors.bright}${colors.green}=== ALL TESTS COMPLETED ===${colors.reset}`,
    );
    console.log(
      `${colors.bright}${colors.magenta}Total Time Taken Everything: ${totalTimeTaken} ms${colors.reset}`,
    );
  } catch (err) {
    console.error("Unexpected error in main flow:", err);
  }
}

main();
