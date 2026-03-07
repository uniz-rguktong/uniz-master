import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ADMIN_RESET_PASS } from "../../../api/endpoints";
import { cn } from "../../../utils/cn";

function validateStrength(pwd: string) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ["", "Weak", "Moderate", "Strong"];
    const colors = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"];
    const texts = ["", "text-red-500", "text-amber-600", "text-emerald-600"];
    return { score, label: labels[score], barColor: colors[score], textColor: texts[score] };
}

export default function SecuritySection({ username }: { username: string }) {
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const strength = validateStrength(newPw);

    const handleSubmit = async () => {
        if (!oldPw || !newPw || !confirmPw) {
            toast.error("Please fill in all fields.");
            return;
        }
        if (newPw !== confirmPw) {
            toast.error("New passwords do not match.");
            return;
        }
        if (strength.score < 3) {
            toast.error("Password must be 8+ chars with a number and special character.");
            return;
        }
        const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
        try {
            setLoading(true);
            const res = await fetch(ADMIN_RESET_PASS, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, password: oldPw, new_password: newPw }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.msg || "Password changed! Signing you out…");
                localStorage.removeItem("admin_token");
                setTimeout(() => (window.location.href = "/admin/signin"), 2000);
            } else {
                toast.error(data.msg || "Failed to change password.");
            }
        } catch {
            toast.error("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto pb-20">
            {/* Header card */}
            <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-xl px-8 py-6 text-white shadow-none relative overflow-hidden">
                <div className="relative z-10 space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl border border-white/10 mb-2">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Security</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight leading-none">Change Password</h1>
                    <p className="text-slate-400 text-[13px] font-medium">
                        Keep your account secure with a strong, unique password.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-[0.04] translate-x-1/4 translate-y-1/4">
                    <Lock size={200} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Form */}
                <div className="md:col-span-3 bg-white rounded-xl border border-slate-100 shadow-none p-6 space-y-5">
                    <PasswordInput
                        label="Current Password"
                        value={oldPw}
                        show={showOld}
                        onToggle={() => setShowOld(!showOld)}
                        onChange={setOldPw}
                    />
                    <PasswordInput
                        label="New Password"
                        value={newPw}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                        onChange={setNewPw}
                    />

                    {/* Strength meter */}
                    {newPw && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span className="text-slate-400">Strength</span>
                                <span className={strength.textColor}>{strength.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-300", strength.barColor)}
                                    style={{ width: `${(strength.score / 3) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <PasswordInput
                        label="Confirm New Password"
                        value={confirmPw}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                        onChange={setConfirmPw}
                    />

                    {newPw && confirmPw && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            {newPw === confirmPw ? (
                                <><CheckCircle size={12} className="text-emerald-500" /><span className="text-emerald-600">Passwords match</span></>
                            ) : (
                                <><XCircle size={12} className="text-red-500" /><span className="text-red-500">Passwords don't match</span></>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-slate-900 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-none"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                        Change Password
                    </button>
                </div>

                {/* Requirements panel */}
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-none p-6 flex flex-col gap-5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ShieldCheck size={13} className="text-blue-500" /> Requirements
                    </h3>
                    <ul className="space-y-3">
                        {[
                            { met: newPw.length >= 8, text: "At least 8 characters" },
                            { met: /[0-9]/.test(newPw), text: "One number" },
                            { met: /[^A-Za-z0-9]/.test(newPw), text: "One special character" },
                        ].map(({ met, text }) => (
                            <li key={text} className="flex items-center gap-2.5">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                        met ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                    )}
                                >
                                    {met ? <CheckCircle size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                </div>
                                <span className={cn("text-[12px] font-medium transition-colors", met ? "text-slate-900" : "text-slate-400")}>
                                    {text}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-auto bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            You will be signed out automatically after a successful password change.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PasswordInput({
    label,
    value,
    show,
    onToggle,
    onChange,
}: {
    label: string;
    value: string;
    show: boolean;
    onToggle: () => void;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                {label}
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 text-[13px] font-medium text-slate-900 bg-transparent focus:outline-none"
                />
                <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
}
