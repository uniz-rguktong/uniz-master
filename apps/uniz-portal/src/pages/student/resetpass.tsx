import { useState, useCallback, useEffect } from "react";
import { Input } from "../../components/Input";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { is_authenticated } from "../../store";
import { useStudentData } from "../../hooks/student_info";
import { toast } from "react-toastify";
import { CHANGE_PASS_ENDPOINT } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";


export default function Resetpassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useNavigate();
  useStudentData();
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
        return { score, label: "Strong", color: "bg-blue-600" };
      default:
        return { score: 0, label: "", color: "" };
    }
  }, []);

  // Update password strength on new password change
  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password, validatePassword]);

  // Handle Reset Password (Now Change Password)
  const handleResetPassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (password !== repassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error("New password is too weak");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        CHANGE_PASS_ENDPOINT,
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: password,
          }),
        },
      );

      if (data?.success) {
        toast.success("Password updated successfully across all systems");

        // Log out for security
        localStorage.clear();
        setAuth({ is_authnticated: false, type: "" });
        navigateTo("/student/signin", { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex flex-col gap-1.5 md:mb-8 mb-4">
          <p className="text-slate-500 font-medium text-[13px]">
            Account Security Terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Reset Password
          </h1>
        </div>

        {/* Main Content */}
        <div className="md:bg-white md:rounded-xl md:overflow-hidden md:border md:border-slate-100 md:shadow-sm bg-transparent">
          <div className="md:flex">
            {/* Form Section */}
            {/* Form Section */}
            <div className="md:w-2/3 py-6 px-0 md:p-8 md:px-10">
              <div className="flex items-center gap-4 md:mb-8 mb-4">
                <div className="hidden md:block p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
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
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Current Password */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Current Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setCurrentPassword)}
                      placeholder="Enter current password"
                      className="focus:border-blue-600 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setPassword)}
                      placeholder="Enter new password"
                      className="focus:border-blue-600 focus:ring-blue-600"
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      onchangeFunction={handleInputChange(setRePassword)}
                      placeholder="Repeat new password"
                      className="focus:border-blue-600 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full h-[50px] bg-black text-white rounded-xl font-bold text-sm transition-all  flex items-center justify-center gap-2"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                  {!isLoading}
                </button>
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
                    className={`flex items-center gap-3 transition-colors duration-300 ${password.length >= 8 ? "text-blue-600" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${password.length >= 8 ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200"}`}
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
                    className={`flex items-center gap-3 transition-colors duration-300 ${/[0-9]/.test(password) ? "text-blue-600" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${/[0-9]/.test(password) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200"}`}
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
                    className={`flex items-center gap-3 transition-colors duration-300 ${/[^A-Za-z0-9]/.test(password) ? "text-blue-600" : "text-slate-400"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${/[^A-Za-z0-9]/.test(password) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200"}`}
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
                    className="h-5 w-5 text-blue-500 mt-0.5"
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
