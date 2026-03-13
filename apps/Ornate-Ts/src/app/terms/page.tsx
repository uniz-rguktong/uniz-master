import Link from 'next/link';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white font-orbitron px-6 py-16">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-black tracking-wider uppercase">Terms of Operations</h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                    By using Ornate, you agree to follow event rules, community guidelines,
                    and registration policies published by festival organizers.
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Violations may result in registration cancellation or account restrictions.
                </p>
                <Link href="/home" className="inline-block text-[var(--color-neon)] hover:text-white transition-colors text-sm font-bold tracking-widest uppercase">
                    Return to Home
                </Link>
            </div>
        </main>
    );
}
