'use client';

import { useState, useEffect, useRef, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { pingoSpeak } from '@/lib/pingoSpeak';

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
    'w-full bg-black/40 text-white text-sm sm:text-base font-mono ' +
    'placeholder-white/45 focus:outline-none transition-all duration-200 ' +
    'border border-white/15 px-3 py-2 sm:py-3 ' +
    'focus:border-[#A3FF12]/60 focus:bg-[#A3FF12]/5 focus:shadow-[0_0_0_2px_rgba(163,255,18,0.10)]';

const labelBase =
    'block mb-1 sm:mb-1.5 text-[9px] sm:text-xs font-bold tracking-[0.10em] sm:tracking-[0.18em] uppercase font-mono';

/* ─── Corner HUD brackets ─────────────────────────────────────────── */
function Corners({ size = 'w-6 h-6' }: { size?: string }) {
    return (
        <div className="absolute inset-[-1px] pointer-events-none z-[60]">
            {/* Top-Left */}
            <div className={`absolute top-0 left-0 ${size} border-t-2 border-l-2`}
                style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute top-0 left-[24px] w-8 h-[2px]" style={{ background: LIME }} />
            <div className="absolute top-[24px] left-0 w-[2px] h-8" style={{ background: LIME }} />

            {/* Top-Right */}
            <div className={`absolute top-0 right-0 ${size} border-t-2 border-r-2`}
                style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute top-0 right-[24px] w-8 h-[2px]" style={{ background: LIME }} />
            <div className="absolute top-[24px] right-0 w-[2px] h-8" style={{ background: LIME }} />

            {/* Bottom-Left */}
            <div className={`absolute bottom-0 left-0 ${size} border-b-2 border-l-2`}
                style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute bottom-0 left-[24px] w-8 h-[2px]" style={{ background: LIME }} />
            <div className="absolute bottom-[24px] left-0 w-[2px] h-8" style={{ background: LIME }} />

            {/* Bottom-Right */}
            <div className={`absolute bottom-0 right-0 ${size} border-b-2 border-r-2`}
                style={{ borderColor: LIME, filter: `drop-shadow(0 0 5px ${LIME})` }} />
            <div className="absolute bottom-0 right-[24px] w-8 h-[2px]" style={{ background: LIME }} />
            <div className="absolute bottom-[24px] right-0 w-[2px] h-8" style={{ background: LIME }} />
        </div>
    );
}


/* ─── Shiny submit button ─────────────────────────────────────────── */
function ShinyButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
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
            disabled={loading || disabled}
            onMouseMove={handleMouseMove}
            suppressHydrationWarning
            className="relative w-full flex items-center justify-between px-6 py-3 sm:py-3.5
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

            <span className="relative z-10 text-[11px] font-black tracking-[0.3em] uppercase"
                style={{ color: LIME }}>
                {loading ? 'Initializing Mission...' : label}
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

/* ─── Animated Eye Toggle ──────────────────────────────────────── */
/*
  SVG eye clipped to an ellipse. Two opaque rect "eyelid covers" sit
  over the iris. CSS transitions slide them out of the clip area via
  translateY(-100%) / translateY(100%) with transform-box:fill-box,
  so the % is relative to each rect's own height — no manual px math.
*/
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
            {/* Outline ring — always visible */}
            <ellipse cx="12" cy="8" rx="11.5" ry="7"
                stroke="currentColor" strokeWidth="1.5" />
            {/* Inner content clipped to eye shape */}
            <g clipPath={`url(#${clipId})`}>
                <rect x="-1" y="-1" width="26" height="18" fill="#060606" />
                <circle cx="12" cy="8" r="5.5" fill="currentColor" opacity="0.15" />
                <circle cx="12" cy="8" r="4.5" fill="currentColor" opacity="0.88" />
                <circle cx="12" cy="8" r="2" fill="#060606" />
                <circle cx="14" cy="6" r="0.9" fill="white" opacity="0.85" />
                <circle cx="10.5" cy="10" r="0.45" fill="white" opacity="0.35" />
                {/* Upper eyelid cover */}
                <rect x="-1" y="-1" width="26" height="10" fill="#060606"
                    style={{
                        ...lid,
                        transformOrigin: 'center top',
                        transform: open ? 'translateY(-100%)' : 'translateY(0)',
                    }} />
                {/* Lower eyelid cover */}
                <rect x="-1" y="9" width="26" height="9" fill="#060606"
                    style={{
                        ...lid,
                        transformOrigin: 'center bottom',
                        transform: open ? 'translateY(100%)' : 'translateY(0)',
                    }} />
            </g>
        </svg>
    );
}

/* ─── Field components ────────────────────────────────────────────── */
function Field({ label, id, type, placeholder, autoFocus, forceUpper, disabled, autoComplete }:
    { label: string; id: string; type: string; placeholder: string; autoFocus?: boolean; forceUpper?: boolean; disabled?: boolean; autoComplete?: string }) {
    const [showPw, setShowPw] = useState(false);
    const uid = useId().replace(/:/g, 'x');
    const isPassword = type === 'password';

    return (
        <div className="flex flex-col">
            <label htmlFor={id} className={labelBase} style={{ color: LIME }}>{label}</label>
            <div className="relative">
                <input id={id} type={isPassword ? (showPw ? 'text' : 'password') : type} required suppressHydrationWarning
                    disabled={disabled}
                    placeholder={placeholder} autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    onInput={e => {
                        if (forceUpper) {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.toUpperCase();
                        }
                    }}
                    style={forceUpper ? { textTransform: 'uppercase' } : {}}
                    className={`${inputBase} ${isPassword ? 'pr-10' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {isPassword && !disabled && (
                    <button
                        type="button"
                        tabIndex={0}
                        onClick={() => setShowPw(v => !v)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPw(v => !v); } }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5
                                   transition-all duration-200 hover:scale-110
                                   focus:outline-none"
                        style={{
                            color: showPw ? LIME : 'rgba(255,255,255,0.28)',
                            filter: showPw
                                ? 'drop-shadow(0 0 5px rgba(163,255,18,0.65))'
                                : 'none',
                        }}
                        aria-label={showPw ? 'Password visible – click to hide' : 'Password hidden – click to reveal'}
                        aria-pressed={showPw}
                    >
                        <EyeToggle open={showPw} id={`eye-${uid}`} />
                    </button>
                )}
            </div>
        </div>
    );
}

function SelectField({ label, id, options, placeholder, disabled }:
    { label: string; id: string; options: string[]; placeholder: string; disabled?: boolean }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className={labelBase} style={{ color: LIME }}>{label}</label>
            <div className="relative">
                <select id={id} required suppressHydrationWarning defaultValue=""
                    disabled={disabled}
                    className={`${inputBase} appearance-none cursor-pointer pr-8 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
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

    // Email Verification State
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const [statusText, setStatusText] = useState('');

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendTimer > 0) {
            timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleSendOTP = async () => {
        const email = (document.getElementById('r-email') as HTMLInputElement)?.value;
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setOtpLoading(true);
        setStatusText('Initiating secure email handshake...');

        try {
            const res = await fetch('/api/send-email-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setStatusText('Verification signal transmitted.');
                setResendTimer(45);
            } else {
                setError(data.error || 'Failed to send OTP.');
                setStatusText('');
            }
        } catch (err) {
            setError('Network error. Retry.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const email = (document.getElementById('r-email') as HTMLInputElement)?.value;
        const otpString = otp.join('');
        if (otpString.length < 6) return;

        setOtpLoading(true);
        setError('');

        try {
            const res = await fetch('/api/verify-email-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpString }),
            });
            const data = await res.json();
            if (res.ok && data.verified) {
                setEmailVerified(true);
                setStatusText('Secure email channel established.');
            } else {
                setError(data.error || 'Invalid authentication code.');
                setStatusText('');
            }
        } catch (err) {
            setError('Authentication failed. Retry.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pasteData.every(char => /^\d$/.test(char))) {
            const newOtp = [...otp];
            pasteData.forEach((char, i) => (newOtp[i] = char));
            setOtp(newOtp);
            otpInputRefs.current[Math.min(pasteData.length, 5)]?.focus();
        }
    };

    useEffect(() => { setIsLogin(initialMode === 'login'); setError(''); }, [initialMode]);

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
                const msg = 'Invalid credentials. Check your email and password.';
                setError(msg);
                return;
            }
            onSuccess?.();
        } else {
            const name = (document.getElementById('r-name') as HTMLInputElement)?.value;
            const email = (document.getElementById('r-email') as HTMLInputElement)?.value;
            const phone = (document.getElementById('r-phone') as HTMLInputElement)?.value;
            const branch = (document.getElementById('r-branch') as HTMLSelectElement)?.value;
            const year = (document.getElementById('r-year') as HTMLSelectElement)?.value;
            const password = (document.getElementById('r-pw') as HTMLInputElement)?.value;
            const confirmPassword = (document.getElementById('r-cpw') as HTMLInputElement)?.value;

            if (password !== confirmPassword) {
                setIsLoading(false);
                const msg = 'Passwords do not match.';
                setError(msg);
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
                const msg = data.error || 'Registration failed. Please try again.';
                setError(msg);
                return;
            }

            const result = await signIn('credentials', { email, password, redirect: false });
            setIsLoading(false);
            if (result?.error) {
                const msg = 'Account created! Please sign in.';
                setError(msg);
                setIsLogin(true);
                return;
            }
            onSuccess?.();
        }
    };

    return (
        <div className="flex flex-col items-center w-full px-4 pt-4 pb-12">
            {/* Core Logo */}
            <div className="mb-2 relative group">
                <div className="absolute inset-0 bg-[#A3FF12]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <Image
                    src="/assets/OrnateCore.svg"
                    alt="Ornate Core"
                    width={100}
                    height={100}
                    className="relative z-10 drop-shadow-[0_0_20px_rgba(163,255,18,0.4)] group-hover:scale-110 transition-transform duration-500 ease-out"
                />
            </div>

            {/* Main Title Area */}
            <div className="relative mb-8 flex items-center justify-center w-full max-w-4xl overflow-hidden">
                {/* Left HUD Line */}
                <div className="hidden sm:block flex-1 h-[1px] opacity-30"
                    style={{ background: `linear-gradient(to right, transparent, ${LIME}, transparent)` }} />

                <h1 className="px-6 whitespace-nowrap text-xs sm:text-sm md:text-base font-black tracking-[0.3em] md:tracking-[0.6em] text-white uppercase text-center relative z-10 flex flex-col items-center group">
                    <span className="relative inline-block pb-2">
                        CENTRAL AUTHENTICATION HUB

                        {/* Bottom Glow Bar */}
                        <span className="absolute bottom-0 inset-x-0 h-[2px] z-10"
                            style={{
                                background: `linear-gradient(to right, transparent, ${LIME}, transparent)`,
                                boxShadow: `0 0 15px ${LIME}`
                            }} />
                    </span>
                </h1>

                {/* Right HUD Line */}
                <div className="hidden sm:block flex-1 h-[1px] opacity-30"
                    style={{ background: `linear-gradient(to left, transparent, ${LIME}, transparent)` }} />
            </div>

            <div className="relative w-full max-w-6xl">
                <Corners size="w-8 h-8" />

                {/* top lime gradient bar */}
                <div className="absolute top-0 inset-x-0 h-[2px] z-50"
                    style={{ background: `linear-gradient(to right, transparent, ${LIME}, transparent)`, boxShadow: `0 0 20px ${LIME}` }} />

                {/* ── HEADER STRIP ──────────────────────────────────────── */}
                <div className="relative flex flex-wrap items-center justify-between gap-4 sm:gap-6 px-4 sm:px-8 py-4 z-10"
                    style={{ background: 'rgba(5, 10, 5, 0.95)', borderBottom: `1px solid ${LIME_BORDER}` }}>

                    {/* mission badge */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs tracking-[0.4em] font-mono font-bold"
                                style={{ color: `${LIME}` }}>◈ ORNATE 2026</span>
                            <span className="text-lg sm:text-xl font-black tracking-[0.15em] text-white uppercase leading-none mt-1 sm:mt-0">
                                {isLogin ? 'Access Terminal' : 'Crew Enlistment'}
                            </span>
                        </div>
                    </div>

                    {/* spacer stat chips */}
                    <div className="hidden lg:flex items-center gap-12 flex-1 justify-center">
                        {[
                            { label: 'MISSION', val: 'ORNATE‑26' },
                            { label: 'SECTOR', val: 'ACTIVE' },
                            { label: 'SIGNAL', val: '● LIVE' },
                        ].map(({ label, val }) => (
                            <div key={label} className="text-center group border-x border-white/5 px-6">
                                <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase mb-1">{label}</p>
                                <p className="text-sm font-bold tracking-wider font-mono transition-all duration-300" style={{ color: LIME }}>{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* mode toggle */}
                    <div className="flex flex-shrink-0 overflow-hidden rounded bg-black/40 p-1 border border-white/10"
                        style={{ borderColor: LIME_BORDER }}>
                        {(['SIGN IN', 'REGISTER'] as const).map((lbl, i) => {
                            const active = i === 0 ? isLogin : !isLogin;
                            return (
                                <button key={lbl} type="button" suppressHydrationWarning
                                    onClick={() => setIsLogin(i === 0)}
                                    className="px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-black tracking-[0.2em]
                                               uppercase transition-all duration-300 cursor-pointer relative"
                                    style={{
                                        color: active ? '#000' : 'rgba(255,255,255,0.4)',
                                    }}
                                >
                                    {active && (
                                        <div className="absolute inset-0 z-0 bg-[#A3FF12]" />
                                    )}
                                    <span className="relative z-10">{lbl}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6 pb-5 pt-4 backdrop-blur-xl"
                    style={{
                        background: 'rgba(0,0,0,0.72)',
                        borderLeft: `1px solid ${LIME06}`,
                        borderRight: `1px solid ${LIME06}`,
                        borderBottom: `1px solid ${LIME06}`,
                    }}>

                    <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-3">

                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono border"
                                style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.35)', background: 'rgba(255,68,68,0.08)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {isLogin ? (
                            /* ── SIGN IN — responsive single/inline ───────── */
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 sm:gap-4 items-end">
                                    <Field label="Mission ID · Email" id="si-email"
                                        type="email" placeholder="operative@domain.ext" autoFocus autoComplete="email" />
                                    <Field label="Access Code · Password" id="si-pw"
                                        type="password" placeholder="Enter access code" autoComplete="current-password" />
                                    <div className="mt-2 md:mt-0">
                                        <ShinyButton loading={isLoading} label="Launch Mission" />
                                    </div>
                                </div>
                                {/* Forgot password link */}
                                <div className="flex items-center justify-end gap-2 pt-0.5">
                                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Forgot Access Code?</span>
                                    <Link href="/forgot-access"
                                        className="text-[9px] font-black font-mono uppercase tracking-widest underline underline-offset-4 transition-colors"
                                        style={{ color: LIME }}>
                                        INITIATE RECOVERY
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* ── REGISTER — responsive rows ───────────────── */
                            <div className="space-y-3">

                                {/* ── ROW 1: Identity + Email + Branch + Year ── */}
                                {/* Mobile: each full-width stacked. Desktop: all in one row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1fr_1fr] gap-2 sm:gap-3">
                                    {/* Full Name — full width on mobile, 1 col desktop */}
                                    <div className="sm:col-span-1 lg:col-span-1">
                                        <Field label="Full Name" id="r-name" type="text" placeholder="Enter your Name" autoFocus forceUpper />
                                    </div>
                                    {/* ID Number */}
                                    <div className="sm:col-span-1 lg:col-span-1">
                                        <Field label="ID Number" id="r-id" type="text" placeholder="e.g. O2XXXX1" forceUpper />
                                    </div>

                                    {/* Email + Verify — full width on mobile */}
                                    <div className="sm:col-span-2 lg:col-span-1 flex flex-col">
                                        <label htmlFor="r-email" className={labelBase} style={{ color: LIME }}>
                                            {emailVerified ? (
                                                <span className="flex items-center gap-1.5">
                                                    Email ID
                                                    <span className="text-[#A3FF12] tracking-normal normal-case">✓ Verified</span>
                                                </span>
                                            ) : 'Email ID'}
                                        </label>
                                        <div className="flex">
                                            <input id="r-email" type="email" required suppressHydrationWarning
                                                placeholder="Enter your email address"
                                                disabled={emailVerified}
                                                className={`${inputBase} flex-1 min-w-0 ${emailVerified ? 'opacity-60' : ''}`}
                                                style={{ borderRight: 'none' }}
                                            />
                                            <button type="button" onClick={handleSendOTP}
                                                disabled={otpLoading || emailVerified}
                                                className="flex-shrink-0 px-3 sm:px-4 text-[9px] font-black tracking-[0.15em] uppercase border transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                                                style={{
                                                    color: emailVerified ? '#000' : LIME,
                                                    borderColor: emailVerified ? LIME : 'rgba(163,255,18,0.35)',
                                                    background: emailVerified ? LIME : 'rgba(163,255,18,0.08)',
                                                }}>
                                                {emailVerified ? 'CONFIRMED' : (otpLoading ? '···' : (otpSent ? 'RESEND' : 'VERIFY'))}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Branch + Year — side by side on all sizes */}
                                    <div className="col-span-1">
                                        <SelectField label="Branch" id="r-branch" options={BRANCHES} placeholder="Select Branch" disabled={!emailVerified} />
                                    </div>
                                    <div className="col-span-1">
                                        <SelectField label="Year" id="r-year" options={YEARS} placeholder="Select Year" disabled={!emailVerified} />
                                    </div>
                                </div>

                                {/* ── OTP — wraps to 2 rows on mobile, single strip on desktop ── */}
                                {otpSent && !emailVerified && (
                                    <div className="border border-[#A3FF12]/15 px-4 py-3"
                                        style={{ background: 'rgba(163,255,18,0.04)' }}>
                                        {/* Mobile: label on top, boxes + button below */}
                                        <p className="text-[9px] font-black tracking-[0.3em] uppercase font-mono mb-2 sm:hidden"
                                            style={{ color: LIME }}>
                                            EMAIL AUTH CODE
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            {/* Label — hidden on mobile (shown above), visible on sm+ */}
                                            <span className="hidden sm:inline text-[9px] font-black tracking-[0.25em] uppercase font-mono flex-shrink-0"
                                                style={{ color: LIME }}>
                                                AUTH CODE
                                            </span>
                                            {/* 6 digit boxes */}
                                            <div className="flex gap-1.5" onPaste={handleOtpPaste}>
                                                {otp.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        ref={el => { otpInputRefs.current[i] = el; }}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={e => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                                        className="w-9 h-10 sm:w-9 sm:h-9 bg-black/60 border border-[#A3FF12]/25 text-center text-base font-mono font-bold text-[#A3FF12] focus:border-[#A3FF12] focus:outline-none focus:shadow-[0_0_8px_rgba(163,255,18,0.2)] transition-all"
                                                    />
                                                ))}
                                            </div>
                                            {/* AUTH button */}
                                            <button type="button" onClick={handleVerifyOTP}
                                                disabled={otpLoading || otp.join('').length < 6}
                                                className="h-10 sm:h-9 px-5 text-[10px] font-black tracking-[0.25em] uppercase transition-all disabled:opacity-40"
                                                style={{ background: LIME, color: '#000' }}>
                                                {otpLoading ? '···' : 'AUTH'}
                                            </button>
                                            {/* Resend timer — pushed right on desktop */}
                                            {resendTimer > 0 && (
                                                <span className="sm:ml-auto text-[9px] font-mono text-white/40 tracking-wider">
                                                    RESEND IN {resendTimer}s
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Status / hint line */}
                                {statusText && !error && (
                                    <p className="text-[10px] font-mono uppercase tracking-[0.25em] animate-pulse" style={{ color: LIME }}>
                                        ◈ {statusText}
                                    </p>
                                )}
                                {!emailVerified && !otpSent && (
                                    <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                                        ◈ Complete Email Authentication to continue.
                                    </p>
                                )}

                                {/* thin divider */}
                                <div className="h-px w-full"
                                    style={{ background: `linear-gradient(to right, transparent, ${LIME_BORDER}, transparent)` }} />

                                {/* ── ROW 2: Phone | Password | Confirm | CTA ── */}
                                {/* Mobile: Phone full-width, Password+Confirm side-by-side, CTA full-width */}
                                <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-3 items-end">
                                    <div className="col-span-2 sm:col-span-1">
                                        <Field label="Phone N.O." id="r-phone" type="tel" placeholder="+91 XXXXX XXXXX" disabled={!emailVerified} />
                                    </div>
                                    <div className="col-span-1">
                                        <Field label="Password" id="r-pw" type="password" placeholder="Min. 6 characters" disabled={!emailVerified} autoComplete="new-password" />
                                    </div>
                                    <div className="col-span-1">
                                        <Field label="Confirm" id="r-cpw" type="password" placeholder="Re-enter password" disabled={!emailVerified} autoComplete="new-password" />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 mt-1 lg:mt-0">
                                        <ShinyButton loading={isLoading} disabled={!emailVerified} label="Join the Crew" />
                                    </div>
                                </div>
                            </div>
                        )}


                    </form>

                    {/* footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mt-6 sm:mt-8 relative z-10 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                            <div className="w-10 h-[1px] hidden sm:block" style={{ background: LIME }} />
                            <p className="text-[10px] sm:text-xs tracking-[0.2em] font-mono text-white/40 uppercase">
                                Ornate'26 · Mission Control · Secured Channel
                            </p>
                        </div>

                        <p className="text-[10px] sm:text-xs tracking-[0.1em] font-mono uppercase mt-2 sm:mt-0">
                            <span className="text-white/50">
                                {isLogin ? 'No access code?' : 'Already enlisted?'}
                            </span>{' '}
                            <button type="button" suppressHydrationWarning
                                onClick={() => setIsLogin(v => !v)}
                                className="underline underline-offset-4 transition-all duration-300 cursor-pointer font-bold"
                                style={{ color: LIME }}>
                                {isLogin ? 'Enlist now' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>


            {/* Global scanline effect overlay */}
            <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.03] overflow-hidden"
                style={{
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 4px, 3px 100%'
                }}
            />
        </div>
    );
}
