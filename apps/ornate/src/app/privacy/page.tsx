import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-white font-orbitron px-6 py-16">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-black tracking-wider uppercase">Privacy Directive</h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                    Ornate respects your privacy. We only process data required for authentication,
                    event registration, and platform operations.
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                    For account-related requests, contact the festival admin team.
                </p>
                <Link href="/home" className="inline-block text-[var(--color-neon)] hover:text-white transition-colors text-sm font-bold tracking-widest uppercase">
                    Return to Home
                </Link>
            </div>
        </main>
    );
}
