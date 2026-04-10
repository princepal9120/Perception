// src/hooks/useGuestChatLimit.ts
// Tracks the number of free OSS chat turns in localStorage

import { useState, useEffect, useCallback } from 'react';

const GUEST_CHAT_COUNT_KEY = 'perception_guest_chat_count';
export const MAX_FREE_CHAT_TURNS = 5;

interface GuestChatLimitHook {
    turnsUsed: number;
    hasReachedLimit: boolean;
    incrementCount: () => void;
    resetCount: () => void;
    remainingTurns: number;
}

export function useGuestChatLimit(): GuestChatLimitHook {
    const [turnsUsed, setTurnsUsed] = useState(() => {
        if (typeof window === 'undefined') return 0;
        const stored = localStorage.getItem(GUEST_CHAT_COUNT_KEY);
        return stored ? parseInt(stored, 10) : 0;
    });

    const hasReachedLimit = turnsUsed >= MAX_FREE_CHAT_TURNS;
    const remainingTurns = Math.max(0, MAX_FREE_CHAT_TURNS - turnsUsed);

    useEffect(() => {
        localStorage.setItem(GUEST_CHAT_COUNT_KEY, turnsUsed.toString());
    }, [turnsUsed]);

    const incrementCount = useCallback(() => {
        setTurnsUsed((prev) => {
            const newCount = prev + 1;
            localStorage.setItem(GUEST_CHAT_COUNT_KEY, newCount.toString());
            return newCount;
        });
    }, []);

    const resetCount = useCallback(() => {
        setTurnsUsed(0);
        localStorage.removeItem(GUEST_CHAT_COUNT_KEY);
    }, []);

    return {
        turnsUsed,
        hasReachedLimit,
        incrementCount,
        resetCount,
        remainingTurns,
    };
}
