'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';

interface AuthFormProps {
    onSuccess?: () => void;
    initialMode?: 'login' | 'register';
}

const BRANCHES = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Information Technology',
    'Other',
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/* ─── Design tokens ───────────────────────────────────────────────── */
const LIME = '#A3FF12';
const LIME20 = 'rgba(163,255,18,0.20)';
const LIME10 = 'rgba(163,255,18,0.10)';
const LIME06 = 'rgba(163,255,18,0.06)';
const LIME_BORDER = 'rgba(163,255,18,0.25)';

/* ─── Input / label base classes ──────────────────────────────────── */
const inputBase =
    'w-full bg-black/40 text-white text-xs sm:text-base ' +
    'placeholder-white/45 focus:outline-none transition-all duration-200 ' +
    'border border-white/15 px-2.5 py-1.5 sm:py-3 ' +
    'focus:border-[#A3FF12]/60 focus:bg-[#A3FF12]/5 focus:shadow-[0_0_0_2px_rgba(163,255,18,0.10)]';

const labelBase =
    'block mb-0.5 sm:mb-1.5 text-[8px] sm:text-xs font-bold tracking-[0.10em] sm:tracking-[0.18em] uppercase';

/* ─── Corner HUD brackets ─────────────────────────────────────────── */
function Corners({ size = 'w-4 h-4' }: { size?: string }) {
    return (
        <>
            <span style={{ borderColor: LIME_BORDER }}
                className={`absolute top-0 left-0 ${size} border-t border-l`} />
            <span style={{ borderColor: LIME_BORDER }}
                className={`absolute top-0 right-0 ${size} border-t border-r`} />
            <span style={{ borderColor: LIME_BORDER }}
                className={`absolute bottom-0 left-0 ${size} border-b border-l`} />
            <span style={{ borderColor: LIME_BORDER }}
                className={`absolute bottom-0 right-0 ${size} border-b border-r`} />
        </>
    );
}

/* ─── Shiny submit button ─────────────────────────────────────────── */
function ShinyButton({ loading, label }: { loading: boolean; label: string }) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const shineRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = btnRef.current;
        const shine = shineRef.current;
        if (!btn || !shine) return;
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        shine.style.left = `${x - 20}%`;
    };

    return (
        <button
            ref={btnRef}
            type="submit"
            disabled={loading}
            onMouseMove={handleMouseMove}
            suppressHydrationWarning
            className="relative w-full flex items-center justify-between px-4 py-2 sm:py-3.5
                       overflow-hidden transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(163,255,18,0.2)] sm:shadow-none
                       disabled:opacity-40 disabled:cursor-not-allowed group border border-[#A3FF12]/60 sm:border-[#A3FF12]/25"
            style={{
                background: `linear-gradient(135deg, ${LIME}22, rgba(0,0,0,0.8))`,
            }}
        >
            {/* Animated shimmer stripe that follows mouse */}
            <span ref={shineRef}
                className="pointer-events-none absolute top-0 bottom-0 w-[40%]
                           transition-[left] duration-100"
                style={{
                    background: `linear-gradient(90deg, transparent, ${LIME}22, ${LIME}40, ${LIME}22, transparent)`,
                    filter: 'blur(4px)',
                    left: '-40%',
                }} />

            {/* Static background glow pulse */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(135deg, ${LIME20}, transparent 60%)`,
                }} />

            <span className="relative z-10 text-[9px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase"
                style={{ color: LIME }}>
                {loading ? 'Initializing...' : label}
            </span>

            <span className="relative z-10 flex items-center gap-2" style={{ color: LIME }}>
                {loading ? (
                    <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
                        viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform duration-200">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
        </button>
    );
}

/* ─── Field components ────────────────────────────────────────────── */
function Field({ label, id, type, placeholder, autoFocus, disabled }:
    { label: string; id: string; type: string; placeholder: string; autoFocus?: boolean; disabled?: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!autoFocus) return;
        // Only auto-focus on non-touch (desktop) devices to prevent the mobile
        // keyboard from popping up immediately when the form mounts.
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice && inputRef.current) {
            // Small delay to let the DOM settle before focusing
            const t = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [autoFocus]);

    return (
        <div className="flex flex-col">
            <label htmlFor={id} className={labelBase} style={{ color: LIME }}>{label}</label>
            <input ref={inputRef} id={id} type={type} required suppressHydrationWarning
                tabIndex={-1}
                placeholder={placeholder} disabled={disabled}
                className={`${inputBase} ${disabled ? 'opacity-50 cursor-not-allowed bg-white/5' : ''}`} />
        </div>
    );
}

function SelectField({ label, id, options, placeholder }:
    { label: string; id: string; options: string[]; placeholder: string }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className={labelBase} style={{ color: LIME }}>{label}</label>
            <div className="relative">
                <select id={id} required suppressHydrationWarning defaultValue=""
                    tabIndex={-1}
                    className={`${inputBase} appearance-none cursor-pointer pr-8`}>
                    <option value="" disabled className="bg-neutral-950 text-white/40">{placeholder}</option>
                    {options.map(o => (
                        <option key={o} value={o} className="bg-neutral-950 text-white">{o}</option>
                    ))}
                </select>
                {/* chevron */}
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={LIME} strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}

/* ─── AuthForm ────────────────────────────────────────────────────── */
export default function AuthForm({ onSuccess, initialMode = 'login' }: AuthFormProps) {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        setIsLogin(initialMode === 'login');
        setError('');
        setOtpSent(false);
        setIsVerified(false);
        setSuccessMsg('');
    }, [initialMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (isLogin) {
            const email = (document.getElementById('si-email') as HTMLInputElement)?.value;
            const password = (document.getElementById('si-pw') as HTMLInputElement)?.value;

            const result = await signIn('credentials', { email, password, redirect: false });
            setIsLoading(false);
            if (result?.error) {
                setError('Invalid credentials. Check your email and password.');
                return;
            }
            onSuccess?.();
        } else {
            const email = (document.getElementById('r-email') as HTMLInputElement)?.value;

            if (!isVerified) {
                if (!otpSent) {
                    // Send OTP
                    if (!email || !email.includes('@')) {
                        setError('Please enter a valid mission email.');
                        setIsLoading(false);
                        return;
                    }
                    const res = await fetch('/api/auth/otp/send', {
                        method: 'POST',
                        body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    setIsLoading(false);
                    if (!res.ok) {
                        setError(data.error || 'Failed to send verification code.');
                        return;
                    }
                    setOtpSent(true);
                    setSuccessMsg('Verification code sent to your email.');
                } else {
                    // Verify OTP
                    const otp = (document.getElementById('r-otp') as HTMLInputElement)?.value?.trim();
                    if (!otp || otp.length < 6) {
                        setError('Please enter the 6-digit verification code.');
                        setIsLoading(false);
                        return;
                    }
                    console.log('[DEBUG] Form: verifying OTP', otp, 'for', email);
                    const res = await fetch('/api/auth/otp/verify', {
                        method: 'POST',
                        body: JSON.stringify({ email: email.trim(), otp }),
                    });
                    const data = await res.json();
                    setIsLoading(false);
                    if (!res.ok) {
                        setError(data.error || 'Invalid verification code.');
                        return;
                    }
                    setIsVerified(true);
                    setSuccessMsg('Identity verified. Proceeding with registration...');
                }
            } else {
                // Register
                const name = (document.getElementById('r-name') as HTMLInputElement)?.value;
                const phone = (document.getElementById('r-phone') as HTMLInputElement)?.value;
                const branch = (document.getElementById('r-branch') as HTMLSelectElement)?.value;
                const year = (document.getElementById('r-year') as HTMLSelectElement)?.value;
                const password = (document.getElementById('r-pw') as HTMLInputElement)?.value;
                const confirmPassword = (document.getElementById('r-cpw') as HTMLInputElement)?.value;

                if (password !== confirmPassword) {
                    setIsLoading(false);
                    setError('Passwords do not match.');
                    return;
                }

                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, branch, currentYear: year, phone }),
                });
                const data = await res.json();

                if (!res.ok) {
                    setIsLoading(false);
                    setError(data.error || 'Registration failed. Please try again.');
                    return;
                }

                const result = await signIn('credentials', { email, password, redirect: false });
                setIsLoading(false);
                if (result?.error) {
                    setError('Account created! Please sign in.');
                    setIsLogin(true);
                    return;
                }
                onSuccess?.();
            }
        }
    };

    return (
        <div className="relative w-full max-w-6xl">
            <Corners size="w-5 h-5" />

            {/* top lime gradient bar */}
            <div className="absolute top-0 inset-x-0 h-[2px]"
                style={{ background: `linear-gradient(to right, transparent, ${LIME}, transparent)` }} />

            {/* ── HEADER STRIP ──────────────────────────────────────── */}
            <div className="relative flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2 sm:py-3"
                style={{ background: 'rgba(0,0,0,0.80)', borderBottom: `1px solid ${LIME_BORDER}` }}>

                {/* mission badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.4em] font-bold"
                            style={{ color: `${LIME}` }}>◈ ORNATE 2026</span>
                        <span className="text-xs sm:text-base font-black tracking-[0.1em] sm:tracking-[0.15em] text-white uppercase leading-none mt-0.5 sm:mt-0">
                            {isLogin ? 'Access Terminal' : 'Crew Enlistment'}
                        </span>
                    </div>
                </div>

                {/* spacer stat chips */}
                <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
                    {[
                        { label: 'MISSION', val: 'ORNATE‑26' },
                        { label: 'SECTOR', val: 'ACTIVE' },
                        { label: 'SIGNAL', val: '● LIVE' },
                    ].map(({ label, val }) => (
                        <div key={label} className="text-center">
                            <p className="text-[10px] tracking-[0.22em] text-white/50 uppercase">{label}</p>
                            <p className="text-sm font-bold tracking-wider" style={{ color: LIME }}>{val}</p>
                        </div>
                    ))}
                </div>

                {/* mode toggle */}
                <div className="flex flex-shrink-0 overflow-hidden rounded border border-white/10 sm:border-transparent"
                    style={{ borderColor: LIME_BORDER }}>
                    {(['SIGN IN', 'REGISTER'] as const).map((lbl, i) => {
                        const active = i === 0 ? isLogin : !isLogin;
                        return (
                            <button key={lbl} type="button" suppressHydrationWarning
                                onClick={() => setIsLogin(i === 0)}
                                className="px-2.5 sm:px-5 py-1.5 sm:py-1.5 text-[8px] sm:text-xs font-black tracking-[0.12em] sm:tracking-[0.2em]
                                           uppercase transition-all duration-250 cursor-pointer"
                                style={{
                                    background: active ? LIME20 : 'transparent',
                                    color: active ? LIME : 'rgba(255,255,255,0.30)',
                                    borderLeft: i > 0 ? `1px solid ${LIME_BORDER}` : 'none',
                                }}
                            >{lbl}</button>
                        );
                    })}
                </div>
            </div>

            {/* ── GLASS BODY ────────────────────────────────────────── */}
            <div className="px-3 sm:px-6 pb-3 sm:pb-5 pt-3 sm:pt-4 backdrop-blur-xl"
                style={{
                    background: 'rgba(0,0,0,0.72)',
                    border: `1px solid ${LIME06}`,
                    borderTop: 'none',
                }}>

                <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-2 sm:space-y-3">

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs border"
                            style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.35)', background: 'rgba(255,68,68,0.08)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {successMsg && !error && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs border"
                            style={{ color: LIME, borderColor: `${LIME}40`, background: `${LIME}05` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <path d="M22 4L12 14.01l-3-3" />
                            </svg>
                            {successMsg}
                        </div>
                    )}

                    {isLogin ? (
                        /* ── SIGN IN — responsive single/inline ───────── */
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 sm:gap-4 items-end">
                            <Field label="Mission ID · Email" id="si-email"
                                type="email" placeholder="cadet@ornate.space" autoFocus />
                            <Field label="Access Code · Password" id="si-pw"
                                type="password" placeholder="••••••••••" />
                            <div className="mt-2 md:mt-0">
                                <ShinyButton loading={isLoading} label="Launch Mission" />
                            </div>
                        </div>
                    ) : (
                        /* ── REGISTER — responsive rows ───────────────── */
                        <div className="space-y-1.5 sm:space-y-4">

                            {/* ── ROW 1: Identity fields ─────────────────── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="Full Name" id="r-name" type="text" placeholder="Your full name" autoFocus />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="ID Number" id="r-id" type="text" placeholder="22MCE1234" />
                                </div>
                                <div className="col-span-1">
                                    <SelectField label="Branch" id="r-branch" options={BRANCHES} placeholder="Branch" />
                                </div>
                                <div className="col-span-1">
                                    <SelectField label="Year" id="r-year" options={YEARS} placeholder="Year" />
                                </div>
                            </div>

                            {/* thin divider */}
                            <div className="h-px w-full my-1 sm:my-0"
                                style={{ background: `linear-gradient(to right, transparent, ${LIME_BORDER}, transparent)` }} />

                            {/* ── ROW 2: Contact + credentials + CTA ────── */}
                            {/* ── ROW 2: Contact + credentials + CTA ────── */}
                            <div className={`grid grid-cols-2 ${otpSent && !isVerified ? 'lg:grid-cols-[1fr_1fr_0.8fr_1fr_1fr_auto]' : 'lg:grid-cols-[1fr_1fr_1fr_1fr_auto]'} gap-2 sm:gap-4 items-end`}>
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="Email ID" id="r-email" type="email" placeholder="cadet@rgukt.ac.in" disabled={otpSent} />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="Phone N.O." id="r-phone" type="tel" placeholder="+91 98765 43210" />
                                </div>
                                {otpSent && !isVerified && (
                                    <div className="col-span-2 sm:col-span-1">
                                        <Field label="Verification Code" id="r-otp" type="text" placeholder="6-digit code" autoFocus />
                                    </div>
                                )}
                                <div className="col-span-1">
                                    <Field label="Password" id="r-pw" type="password" placeholder="Password" />
                                </div>
                                <div className="col-span-1">
                                    <Field label="Confirm" id="r-cpw" type="password" placeholder="Confirm" />
                                </div>
                                <div className="col-span-2 lg:col-span-1 mt-2 lg:mt-0">
                                    <ShinyButton
                                        loading={isLoading}
                                        label={!otpSent ? 'Send Verification' : !isVerified ? 'Check Identity' : 'Join the Crew'}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 mt-2 sm:mt-4 text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs tracking-[0.12em] text-white/40 uppercase">
                        Ornate&apos;26 · Mission Control · Secured Channel
                    </p>
                    <p className="text-[10px] sm:text-xs tracking-[0.1em] uppercase">
                        <span className="text-white/50">
                            {isLogin ? 'No access code?' : 'Already enlisted?'}
                        </span>{' '}
                        <button type="button" suppressHydrationWarning
                            onClick={() => setIsLogin(v => !v)}
                            className="underline transition-colors duration-200 cursor-pointer"
                            style={{ color: LIME, textDecorationColor: `${LIME}60` }}>
                            {isLogin ? 'Enlist now' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
