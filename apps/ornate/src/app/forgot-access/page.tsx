'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function ForgotAccessPage() {
    const router = useRouter();

    // Step: 'email' | 'otp'
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    function startResendTimer() {
        setResendTimer(45);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendTimer(t => {
                if (t <= 1) { clearInterval(timerRef.current!); return 0; }
                return t - 1;
            });
        }, 1000);
    }

    async function handleSendOTP() {
        setError('');
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Enter a valid email address.');
            return;
        }
        if (resendCount >= 5) {
            setError('Maximum resend attempts reached. Try again later.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to send OTP.'); return; }
            setStatus('Verification signal transmitted.');
            setResendCount(c => c + 1);
            startResendTimer();
            setStep('otp');
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleOtpChange(i: number, val: string) {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
    }

    function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    }

    function handleOtpPaste(e: React.ClipboardEvent) {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (paste.length === 6) {
            setOtp(paste.split(''));
            otpRefs.current[5]?.focus();
        }
    }

    async function handleVerifyOTP() {
        setError('');
        const code = otp.join('');
        if (code.length < 6) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Authentication failed.');
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
                return;
            }
            setStatus('Identity confirmed. Redirecting...');
            // Store email in sessionStorage for /reset-access page
            sessionStorage.setItem('reset_email', email.toLowerCase().trim());
            setTimeout(() => router.push('/reset-access'), 800);
        } catch {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        if (resendTimer > 0) return;
        setOtp(['', '', '', '', '', '']);
        setError('');
        setStatus('');
        await handleSendOTP();
    }

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
                        Ornate&rsquo;26 · Recovery Terminal
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
                            {step === 'email' ? 'Access Recovery Terminal' : 'Email Auth Code — Step 2'}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-8 space-y-5" style={{ background: 'rgba(0,0,0,0.72)' }}>

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

                        {/* Status */}
                        {status && !error && (
                            <p className="text-[10px] font-mono uppercase tracking-[0.25em] animate-pulse" style={{ color: LIME }}>
                                ◈ {status}
                            </p>
                        )}

                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="ra-email" className={labelBase} style={{ color: LIME }}>Mission ID · Email</label>
                                    <input
                                        id="ra-email"
                                        type="email"
                                        autoFocus
                                        placeholder="O2XXXX@rguktong.ac.in"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                                        className={inputBase}
                                    />
                                </div>
                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between px-6 py-3 border transition-all duration-300 cursor-pointer disabled:opacity-50 group"
                                    style={{
                                        borderColor: LIME_BORDER,
                                        background: `linear-gradient(135deg,rgba(163,255,18,0.13),rgba(0,0,0,0.8))`,
                                    }}>
                                    <span className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: LIME }}>
                                        {loading ? 'Transmitting...' : 'Send Verification Signal'}
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
                            </div>
                        )}

                        {/* Step 2: OTP */}
                        {step === 'otp' && (
                            <div className="space-y-5">
                                {/* Email display — truncated so it never overflows */}
                                <div className="flex items-center gap-2 px-3 py-2 border border-[#A3FF12]/15 min-w-0"
                                    style={{ background: 'rgba(163,255,18,0.04)' }}>
                                    <span className="flex-shrink-0 text-[9px] font-mono text-white/40 uppercase tracking-wider">Sent to</span>
                                    <span className="text-[10px] font-mono font-bold truncate min-w-0 flex-1" style={{ color: LIME }}>{email}</span>
                                    <button type="button" onClick={() => { setStep('email'); setStatus(''); setError(''); }}
                                        className="flex-shrink-0 text-[9px] font-mono uppercase text-white/30 hover:text-white/60 transition-colors tracking-wider ml-1">
                                        CHANGE
                                    </button>
                                </div>

                                {/* OTP boxes — fixed size, centered */}
                                <div>
                                    <label className={labelBase} style={{ color: LIME }}>Email Auth Code</label>
                                    <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={el => { otpRefs.current[i] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={e => handleOtpChange(i, e.target.value)}
                                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                                className="w-0 flex-1 min-w-0 h-12 bg-black/60 border border-[#A3FF12]/25 text-center text-xl font-mono font-bold text-[#A3FF12] focus:border-[#A3FF12] focus:outline-none focus:shadow-[0_0_10px_rgba(163,255,18,0.2)] transition-all"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Verify button */}
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading || otp.join('').length < 6}
                                    className="w-full flex items-center justify-between px-5 py-3 border transition-all duration-300 cursor-pointer disabled:opacity-40 group"
                                    style={{
                                        borderColor: LIME_BORDER,
                                        background: `linear-gradient(135deg,rgba(163,255,18,0.13),rgba(0,0,0,0.8))`,
                                    }}>
                                    <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: LIME }}>
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </span>
                                    {loading ? (
                                        <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" style={{ color: LIME }} />
                                    ) : (
                                        <svg width="18" height="18" fill="none" stroke={LIME} strokeWidth="2" viewBox="0 0 24 24"
                                            className="group-hover:translate-x-1 transition-transform duration-200">
                                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>

                                {/* Resend */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : ''}
                                    </span>
                                    <button type="button" onClick={handleResend}
                                        disabled={resendTimer > 0 || loading}
                                        className="text-[9px] font-mono uppercase tracking-wider transition-colors disabled:opacity-30"
                                        style={{ color: LIME }}>
                                        RESEND CODE
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Divider */}
                        <div className="h-px w-full" style={{ background: `linear-gradient(to right,transparent,${LIME_BORDER},transparent)` }} />

                        {/* Back to login */}
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Remembered it?</span>
                            <Link href="/login"
                                className="text-[9px] font-black font-mono uppercase tracking-wider underline underline-offset-4 transition-colors"
                                style={{ color: LIME }}>
                                Return to Access Terminal
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-5 text-center text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
                    Ornate&rsquo;26 · Mission Control · Secure Recovery Channel
                </p>
            </div>
        </div>
    );
}
