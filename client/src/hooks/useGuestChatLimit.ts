// src/hooks/useGuestChatLimit.ts
// Tracks guest chat count in localStorage for unauthenticated users

import { useState, useEffect, useCallback } from 'react';

const GUEST_CHAT_COUNT_KEY = 'perception_guest_chat_count';
const MAX_GUEST_MESSAGES = 3;

interface GuestChatLimitHook {
    messagesUsed: number;
    hasReachedLimit: boolean;
    incrementCount: () => void;
    resetCount: () => void;
    remainingMessages: number;
}

export function useGuestChatLimit(): GuestChatLimitHook {
    const [messagesUsed, setMessagesUsed] = useState(() => {
        if (typeof window === 'undefined') return 0;
        const stored = localStorage.getItem(GUEST_CHAT_COUNT_KEY);
        return stored ? parseInt(stored, 10) : 0;
    });

    const hasReachedLimit = messagesUsed >= MAX_GUEST_MESSAGES;
    const remainingMessages = Math.max(0, MAX_GUEST_MESSAGES - messagesUsed);

    useEffect(() => {
        localStorage.setItem(GUEST_CHAT_COUNT_KEY, messagesUsed.toString());
    }, [messagesUsed]);

    const incrementCount = useCallback(() => {
        setMessagesUsed((prev) => {
            const newCount = prev + 1;
            localStorage.setItem(GUEST_CHAT_COUNT_KEY, newCount.toString());
            return newCount;
        });
    }, []);

    const resetCount = useCallback(() => {
        setMessagesUsed(0);
        localStorage.removeItem(GUEST_CHAT_COUNT_KEY);
    }, []);

    return {
        messagesUsed,
        hasReachedLimit,
        incrementCount,
        resetCount,
        remainingMessages,
    };
}
