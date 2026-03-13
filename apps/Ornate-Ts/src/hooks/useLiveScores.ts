'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LiveScore {
    id: string;
    sport: string;
    round: string;
    team1: string;
    team2: string;
    score1: string | null;
    score2: string | null;
    status: string;
    winner: string | null;
}

export function useLiveScores() {
    const [scores, setScores] = useState<LiveScore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchScores = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/scores', { signal });
            if (res.ok) {
                const data = await res.json();
                setScores(data);
            }
        } catch (err: any) {
            // Ignore abort errors
            if (err.name === 'AbortError') return;
            console.error('[LiveScores] Fetch failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setScores, setIsLoading]);

    useEffect(() => {
        const controller = new AbortController();
        fetchScores(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchScores]);

    return { scores, isLoading, refreshScores: fetchScores };
}
