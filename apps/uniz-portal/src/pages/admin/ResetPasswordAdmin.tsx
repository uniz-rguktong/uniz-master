import { useState, useCallback, useEffect } from "react";
import { Input } from "../../components/Input";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../../store";
import { useStudentData } from "../../hooks/student_info";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../api/endpoints";

export default function Resetpassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useNavigate();
  useStudentData();
  const Student = useRecoilValue(student);
  const [_isAuth, setAuth] = useRecoilState(is_authenticated);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  // Handle input change
  const handleInputChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
      },
    [],
  );

  // Validate password strength
  const validatePassword = useCallback((pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-slate-200" };
      case 2:
        return { score, label: "Moderate", color: "bg-slate-400" };
      case 3:
        return { score, label: "Strong", color: "bg-navy-900" };
      default:
        return { score: 0, label: "", color: "" };
    }
  }, []);

  // Update password strength on new password change
  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password, validatePassword]);

  // Handle form submission
  const sendDataToBackend = async () => {
    // Input validation
    if (!oldPassword || !password || !repassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== repassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error(
        "Password must be at least 8 characters long, include a number, and a special character.",
      );
      return;
    }
    if (!Student?.username) {
      toast.error("User data not available. Please try again.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("student_token");

    if (!token) {
      toast.error("Authentication token missing. Please sign in again.");
      setIsLoading(false);
      navigateTo("/student/signin");
      return;
    }

    const tokenValue = JSON.parse(token);

    const bodyData = JSON.stringify({
      username: Student.username,
      resetToken: tokenValue,
      currentPassword: oldPassword,
      newPassword: password,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${BASE_URL}/auth/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenValue}`,
        },
        body: bodyData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If response is plain text, wrap it or handle accordingly
        data = { success: res.ok, msg: responseText };
      }

      if (res.ok) {
        toast.success("Password reset successfully!");

        // Signout implementation
        localStorage.removeItem("student_token");
        localStorage.removeItem("username");
        localStorage.removeItem("admin_token");

        setAuth({
          is_authnticated: false,
          type: "",
        });

        setTimeout(() => {
          navigateTo("/student/signin");
        }, 2000);
      } else {
        // Handle error based on parsed data or status
        toast.error(data.msg || data.message || "Failed to reset password.");
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.error("Request timed out. Please try again.");
      } else {
        console.error("Error resetting password:", error);
        toast.error("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex flex-col gap-1.5 mb-8">
          <p className="text-slate-500 font-medium text-[13px]">
            Account Security Terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Reset Password
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="md:flex">
            {/* Form Section */}
            {/* Form Section */}
            <div className="md:w-2/3 p-6 md:p-8 md:px-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-navy-900 text-white rounded-xl shadow-lg shadow-navy-100">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                    Credential Update
                  </h3>
                  <p className="text-[13px] font-medium text-slate-400">
                    Verify and update your access terminal credentials
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Current Password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
                    Current Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setOldPassword)}
                      placeholder="Enter current password"
                      className="focus:border-navy-100 focus:ring-navy-900"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setPassword)}
                      placeholder="Enter new password"
                      className="focus:border-navy-100 focus:ring-navy-900"
                    />
                  </div>
                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{
                              width: `${(passwordStrength.score / 3) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider w-20 text-right ${
                            passwordStrength.score === 3
                              ? "text-navy-900"
                              : passwordStrength.score === 2
                                ? "text-slate-600"
                                : "text-slate-400"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setRePassword)}
                      placeholder="Confirm new password"
                      className="focus:border-navy-100 focus:ring-navy-900"
                    />
                  </div>
                  {password && repassword && (
                    <div className="mt-2 ml-1">
                      {password === repassword ? (
                        <p className="text-xs font-bold text-navy-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Passwords match
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 md:pt-4 space-y-3">
                  <button
                    onClick={sendDataToBackend}
                    disabled={isLoading}
                    className="w-full h-[46px] bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm"
                  >
                    {isLoading ? "Processing..." : "Update Credentials"}
                  </button>
                  <button
                    onClick={() => navigateTo("/student")}
                    className="w-full h-[46px] text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                    disabled={isLoading}
                  >
                    Back to Terminal
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="hidden md:flex md:w-1/3 bg-slate-50/50 p-6 md:p-8 border-l border-slate-100 flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  Password Strength
                </h3>

                <div className="space-y-6">
                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${password.length >= 8 ? "text-navy-900" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${password.length >= 8 ? "border-navy-100 bg-navy-900 text-white" : "border-slate-200"}`}
                    >
                      {password.length >= 8 && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="font-medium text-sm">8+ Characters</p>
                  </div>

                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${/[0-9]/.test(password) ? "text-navy-900" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${/[0-9]/.test(password) ? "border-navy-100 bg-navy-900 text-white" : "border-slate-200"}`}
                    >
                      {/[0-9]/.test(password) && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="font-medium text-sm">One Number</p>
                  </div>

                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${/[^A-Za-z0-9]/.test(password) ? "text-navy-900" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${/[^A-Za-z0-9]/.test(password) ? "border-navy-100 bg-navy-900 text-white" : "border-slate-200"}`}
                    >
                      {/[^A-Za-z0-9]/.test(password) && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="font-medium text-sm">Special Character</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-slate-50/50 rounded-xl border border-slate-100 hidden md:block">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-navy-900 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                    Terminal security protocol will automatically log out all
                    sessions after successful credential update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
