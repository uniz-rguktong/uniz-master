'use client';

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Animated Eye Toggle ──────────────────────────────────────────── */
function EyeToggle({ open, id: clipId }: { open: boolean; id: string }) {
    const lid: React.CSSProperties = {
        transition: 'transform 340ms cubic-bezier(0.4, 0, 0.2, 1)',
        transformBox: 'fill-box' as React.CSSProperties['transformBox'],
    };
    return (
        <svg viewBox="0 0 24 16" width="20" height="14" fill="none" aria-hidden="true"
            style={{ overflow: 'visible' }}>
            <defs>
                <clipPath id={clipId}>
                    <ellipse cx="12" cy="8" rx="11.5" ry="7" />
                </clipPath>
            </defs>
            <ellipse cx="12" cy="8" rx="11.5" ry="7" stroke="currentColor" strokeWidth="1.5" />
            <g clipPath={`url(#${clipId})`}>
                <rect x="-1" y="-1" width="26" height="18" fill="#060606" />
                <circle cx="12" cy="8" r="5.5" fill="currentColor" opacity="0.15" />
                <circle cx="12" cy="8" r="4.5" fill="currentColor" opacity="0.88" />
                <circle cx="12" cy="8" r="2" fill="#060606" />
                <circle cx="14" cy="6" r="0.9" fill="white" opacity="0.85" />
                <circle cx="10.5" cy="10" r="0.45" fill="white" opacity="0.35" />
                <rect x="-1" y="-1" width="26" height="10" fill="#060606"
                    style={{ ...lid, transformOrigin: 'center top', transform: open ? 'translateY(-100%)' : 'translateY(0)' }} />
                <rect x="-1" y="9" width="26" height="9" fill="#060606"
                    style={{ ...lid, transformOrigin: 'center bottom', transform: open ? 'translateY(100%)' : 'translateY(0)' }} />
            </g>
        </svg>
    );
}

/* ─── Design tokens ─────────────────────────────── */
const LIME = '#A3FF12';
const LIME06 = 'rgba(163,255,18,0.06)';
const LIME_BORDER = 'rgba(163,255,18,0.25)';

const inputBase =
    'w-full bg-black/40 text-white text-sm font-mono ' +
    'placeholder-white/40 focus:outline-none transition-all duration-200 ' +
    'border border-white/15 px-3 py-3 ' +
    'focus:border-[#A3FF12]/60 focus:bg-[#A3FF12]/5 focus:shadow-[0_0_0_2px_rgba(163,255,18,0.10)]';

const labelBase = 'block mb-1.5 text-[9px] font-bold tracking-[0.18em] uppercase font-mono';

/* ─── Corner HUD ────────────────────────────────── */
function Corners() {
    return (
        <div className="absolute inset-[-1px] pointer-events-none z-[60]">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
        </div>
    );
}

type ResetStep = 'form' | 'success';

export default function ResetAccessPage() {
    const router = useRouter();
    const [step, setStep] = useState<ResetStep>('form');
    const [email, setEmail] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const newUid = useId().replace(/:/g, 'x');
    const confirmUid = useId().replace(/:/g, 'x');

    useEffect(() => {
        // Retrieve verified email from session
        const stored = sessionStorage.getItem('reset_email');
        if (!stored) {
            // No verified session — redirect back to forgot-access
            router.replace('/forgot-access');
        } else {
            setEmail(stored);
        }
    }, [router]);

    async function handleReset() {
        setError('');
        if (newPassword.length < 6) {
            setError('Access code must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Access codes do not match.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to update credentials.');
                return;
            }
            sessionStorage.removeItem('reset_email');
            setStep('success');
        } catch {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!email) return null; // prevent flash before redirect

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-start pt-12 md:pt-28 p-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(163,255,18,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Scanlines */}
            <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.03] overflow-hidden"
                style={{
                    background: 'linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))',
                    backgroundSize: '100% 4px,3px 100%'
                }} />

            <div className="w-full max-w-md relative z-10">
                {/* Header tag */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-[2px]" style={{ background: LIME }} />
                    <p className="text-[9px] font-mono font-black tracking-[0.35em] uppercase" style={{ color: LIME }}>
                        Ornate&rsquo;26 · Credential Reset
                    </p>
                </div>

                {/* Card */}
                <div className="relative" style={{ border: `1px solid ${LIME06}` }}>
                    <Corners />

                    {/* Title bar */}
                    <div className="flex items-center gap-3 px-5 py-3"
                        style={{ background: `linear-gradient(90deg,${LIME06},transparent)`, borderBottom: `1px solid ${LIME06}` }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
                        <span className="text-[10px] font-black tracking-[0.35em] uppercase font-mono" style={{ color: LIME }}>
                            {step === 'form' ? 'Access Code Reset Terminal' : 'Mission Access Restored'}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-8" style={{ background: 'rgba(0,0,0,0.72)' }}>

                        {/* ── Success screen ── */}
                        {step === 'success' && (
                            <div className="space-y-6 text-center">
                                {/* Icon */}
                                <div className="flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
                                        style={{ borderColor: LIME, boxShadow: `0 0 20px rgba(163,255,18,0.25)` }}>
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2.5">
                                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-base font-black tracking-[0.2em] uppercase font-mono" style={{ color: LIME }}>
                                        Access Code Updated
                                    </p>
                                    <p className="mt-1 text-[11px] font-mono text-white/40 uppercase tracking-wider">
                                        Mission Access Restored
                                    </p>
                                </div>
                                <div className="h-px w-full" style={{ background: `linear-gradient(to right,transparent,${LIME_BORDER},transparent)` }} />
                                <Link href="/login"
                                    className="w-full flex items-center justify-between px-6 py-3 border group transition-all duration-200"
                                    style={{ borderColor: LIME_BORDER, background: `linear-gradient(135deg,rgba(163,255,18,0.13),rgba(0,0,0,0.8))` }}>
                                    <span className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: LIME }}>
                                        Return To Access Terminal
                                    </span>
                                    <svg width="20" height="20" fill="none" stroke={LIME} strokeWidth="2" viewBox="0 0 24 24"
                                        className="group-hover:translate-x-1 transition-transform duration-200">
                                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            </div>
                        )}

                        {/* ── Reset form ── */}
                        {step === 'form' && (
                            <div className="space-y-5">
                                {/* Verified email display */}
                                <div className="flex items-center gap-2 px-3 py-2 border border-[#A3FF12]/15"
                                    style={{ background: 'rgba(163,255,18,0.04)' }}>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Resetting for</span>
                                    <span className="text-[11px] font-mono font-bold" style={{ color: LIME }}>{email}</span>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono border"
                                        style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.35)', background: 'rgba(255,68,68,0.08)' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* New password */}
                                <div>
                                    <label htmlFor="new-pw" className={labelBase} style={{ color: LIME }}>New Access Code</label>
                                    <div className="relative">
                                        <input
                                            id="new-pw"
                                            type={showNew ? 'text' : 'password'}
                                            autoFocus
                                            placeholder="Minimum 6 characters"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className={`${inputBase} pr-10`}
                                        />
                                        <button type="button" tabIndex={0}
                                            onClick={() => setShowNew(v => !v)}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowNew(v => !v); } }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 transition-all duration-200 hover:scale-110 focus:outline-none"
                                            style={{
                                                color: showNew ? LIME : 'rgba(255,255,255,0.28)',
                                                filter: showNew ? 'drop-shadow(0 0 5px rgba(163,255,18,0.65))' : 'none',
                                            }}
                                            aria-label={showNew ? 'Password visible – click to hide' : 'Password hidden – click to reveal'}
                                            aria-pressed={showNew}>
                                            <EyeToggle open={showNew} id={`eye-new-${newUid}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label htmlFor="confirm-pw" className={labelBase} style={{ color: LIME }}>Confirm Access Code</label>
                                    <div className="relative">
                                        <input
                                            id="confirm-pw"
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Re-enter new access code"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleReset()}
                                            className={`${inputBase} pr-10`}
                                        />
                                        <button type="button" tabIndex={0}
                                            onClick={() => setShowConfirm(v => !v)}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowConfirm(v => !v); } }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-[#A3FF12]/40"
                                            style={{
                                                color: showConfirm ? LIME : 'rgba(255,255,255,0.28)',
                                                filter: showConfirm ? 'drop-shadow(0 0 5px rgba(163,255,18,0.65))' : 'none',
                                            }}
                                            aria-label={showConfirm ? 'Password visible – click to hide' : 'Password hidden – click to reveal'}
                                            aria-pressed={showConfirm}>
                                            <EyeToggle open={showConfirm} id={`eye-confirm-${confirmUid}`} />
                                        </button>
                                    </div>
                                    {/* Inline match indicator */}
                                    {confirmPassword.length > 0 && (
                                        <p className="mt-1 text-[9px] font-mono uppercase tracking-wider"
                                            style={{ color: newPassword === confirmPassword ? LIME : '#ff4444' }}>
                                            {newPassword === confirmPassword ? '◈ Codes match' : '◈ Codes do not match'}
                                        </p>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full" style={{ background: `linear-gradient(to right,transparent,${LIME_BORDER},transparent)` }} />

                                {/* Submit */}
                                <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between px-6 py-3 border transition-all duration-300 cursor-pointer disabled:opacity-50 group"
                                    style={{
                                        borderColor: LIME_BORDER,
                                        background: `linear-gradient(135deg,rgba(163,255,18,0.13),rgba(0,0,0,0.8))`,
                                    }}>
                                    <span className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: LIME }}>
                                        {loading ? 'Updating Credentials...' : 'Update Credentials'}
                                    </span>
                                    {loading ? (
                                        <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" style={{ color: LIME }} />
                                    ) : (
                                        <svg width="20" height="20" fill="none" stroke={LIME} strokeWidth="2" viewBox="0 0 24 24"
                                            className="group-hover:translate-x-1 transition-transform duration-200">
                                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>

                                {/* Back link */}
                                <div className="flex justify-center">
                                    <Link href="/forgot-access"
                                        className="text-[9px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors">
                                        ← Back to Recovery
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-5 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
                    Ornate&rsquo;26 · Mission Control · Secured Channel
                </p>
            </div>
        </div>
    );
}
