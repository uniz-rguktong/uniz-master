'use client';
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface WelcomeToastProps {
    title: string;
}

export function WelcomeToast({ title }: WelcomeToastProps) {
    const { showToast } = useToast();

    useEffect(() => {
        const dashboardTitle = title.toLowerCase().includes('dashboard') ? title : `${title} Dashboard`;
        showToast(`Welcome back to ${dashboardTitle}`, 'success');
    }, [showToast, title]);

    return null;
}
