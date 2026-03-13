'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuthForm from '@/components/ui/AuthForm';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-[#A3FF12]" /></div>}>
            <LoginClient />
        </Suspense>
    );
}

function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') as 'login' | 'register' | null;

    const handleAuthSuccess = () => {
        router.push('/home');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-start pt-12 md:pt-24 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(163,255,18,0.03)_0%,transparent_70%)]" />

            <div className="w-full max-w-6xl relative z-10">
                <AuthForm initialMode={mode ?? 'login'} onSuccess={handleAuthSuccess} />
            </div>
        </div>
    );
}
