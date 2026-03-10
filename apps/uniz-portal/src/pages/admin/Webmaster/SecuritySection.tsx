import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
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
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
            {/* Standard Header */}
            <div className="flex flex-col gap-1.5">
                <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
                    Security & Authentication
                </h2>
                <p className="text-slate-500 font-medium text-[15px]">
                    Update your access credentials to maintain account integrity.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-none p-8 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-24 -mt-24 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <PasswordInput
                        label="Current Access Key"
                        value={oldPw}
                        show={showOld}
                        onToggle={() => setShowOld(!showOld)}
                        onChange={setOldPw}
                    />

                    <div className="space-y-4">
                        <PasswordInput
                            label="New Security Password"
                            value={newPw}
                            show={showNew}
                            onToggle={() => setShowNew(!showNew)}
                            onChange={setNewPw}
                        />

                        {/* Refined Strength Meter */}
                        {newPw && (
                            <div className="px-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((step) => (
                                            <div
                                                key={step}
                                                className={cn(
                                                    "h-1 w-8 rounded-full transition-all duration-300",
                                                    step <= strength.score ? strength.barColor : "bg-slate-100"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", strength.textColor)}>
                                        {strength.label} Profile
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <PasswordInput
                        label="Verify New Password"
                        value={confirmPw}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                        onChange={setConfirmPw}
                    />

                    {newPw && confirmPw && (
                        <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest">
                            {newPw === confirmPw ? (
                                <><CheckCircle size={14} className="text-emerald-500" /><span className="text-emerald-600">Protocol Validated</span></>
                            ) : (
                                <><XCircle size={14} className="text-red-500" /><span className="text-red-500">Mismatch Detected</span></>
                            )}
                        </div>
                    )}

                    <div className="pt-4 space-y-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-none active:scale-[0.98]"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            Update Credentials
                        </button>

                        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 flex gap-3">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                                System protocol: You will be automatically decommissioned from the current session upon successful update.
                            </p>
                        </div>
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
