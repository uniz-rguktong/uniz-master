'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getNotifications,
    markAsRead as markAsReadAction,
    toggleReadStatus as toggleReadAction,
    toggleStarStatus as toggleStarAction,
    toggleArchiveStatus as toggleArchiveAction,
    deleteNotification as deleteNotificationAction
} from '@/actions/notificationActions';

interface Notification {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    senderBranch: string;
    recipientId: string;
    recipientName: string;
    recipientRole: string;
    message: string;
    priority: string;
    type: string;
    isRead: boolean;
    isStarred: boolean;
    isArchived: boolean;
    createdAt: Date;
    [key: string]: any;
}

const REFRESH_EVENT = 'ornate:notifications:refresh';
const NOTIFICATION_PERMISSION_NEEDED_EVENT = 'ornate:notifications:permission-needed';
const PUSH_RECEIVED_SW_EVENT = 'NOTIFICATION_PUSH_RECEIVED';
const FOCUS_REFRESH_THROTTLE_MS = 30_000;

const fetchNotifications = async (isArchived: boolean, isSent: boolean): Promise<Notification[]> => {
    const res = await getNotifications(isArchived, isSent);
    if (!res.success) throw new Error(res.error);
    return res.data as Notification[];
};

function areNotificationsDifferent(current: Notification[], next: Notification[]): boolean {
    if (current.length !== next.length) return true;

    for (let i = 0; i < current.length; i += 1) {
        const a = current[i]!;
        const b = next[i]!;

        if (
            a.id !== b.id ||
            a.isRead !== b.isRead ||
            a.isStarred !== b.isStarred ||
            a.isArchived !== b.isArchived ||
            a.message !== b.message ||
            a.priority !== b.priority ||
            a.type !== b.type ||
            String(a.createdAt) !== String(b.createdAt) ||
            String(a.updatedAt) !== String(b.updatedAt)
        ) {
            return true;
        }
    }

    return false;
}

export function useNotifications(isArchived = false, isSent = false) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const hasLoadedRef = useRef(false);
    const lastFocusRefreshRef = useRef(0);
    const lastPermissionPromptFingerprintRef = useRef('');

    const refresh = useCallback(async () => {
        try {
            setError(null);
            if (!hasLoadedRef.current) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            const data = await fetchNotifications(isArchived, isSent);

            if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                window.Notification.permission !== 'granted' &&
                data.length > 0
            ) {
                const latestFingerprint = `${data[0]?.id ?? ''}:${String(data[0]?.createdAt ?? '')}`;
                if (latestFingerprint && latestFingerprint !== lastPermissionPromptFingerprintRef.current) {
                    lastPermissionPromptFingerprintRef.current = latestFingerprint;
                    window.dispatchEvent(new CustomEvent(NOTIFICATION_PERMISSION_NEEDED_EVENT));
                }
            }

            setNotifications((current) =>
                areNotificationsDifferent(current, data) ? data : current,
            );
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        } finally {
            hasLoadedRef.current = true;
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isArchived, isSent]);

    const refreshAll = useCallback(() => {
        window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const onFocus = () => {
            const now = Date.now();
            if (now - lastFocusRefreshRef.current < FOCUS_REFRESH_THROTTLE_MS) return;
            lastFocusRefreshRef.current = now;
            void refresh();
        };

        const onGlobalRefresh = () => {
            void refresh();
        };

        const onServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type !== PUSH_RECEIVED_SW_EVENT) return;
            void refresh();
        };

        window.addEventListener('focus', onFocus);
        window.addEventListener(REFRESH_EVENT, onGlobalRefresh);
        navigator.serviceWorker?.addEventListener('message', onServiceWorkerMessage);

        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener(REFRESH_EVENT, onGlobalRefresh);
            navigator.serviceWorker?.removeEventListener('message', onServiceWorkerMessage);
        };
    }, [refresh]);

    const markAsRead = async (id: string) => {
        setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

        const res = await markAsReadAction(id);
        if (!res.success) {
            await refresh();
            throw new Error(res.error || 'Failed to mark notification as read');
        }
        refreshAll();
    };

    const toggleReadStatus = async (id: string) => {
        setNotifications((current) =>
            current.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
        );

        const res = await toggleReadAction(id);
        if (!res.success) {
            await refresh();
            throw new Error(res.error || 'Failed to toggle read status');
        }
        refreshAll();
    };

    const toggleStarStatus = async (id: string) => {
        setNotifications((current) =>
            current.map((n) => (n.id === id ? { ...n, isStarred: !n.isStarred } : n)),
        );

        const res = await toggleStarAction(id);
        if (!res.success) {
            await refresh();
            throw new Error(res.error || 'Failed to toggle star status');
        }
        refreshAll();
    };

    const toggleArchiveStatus = async (id: string) => {
        setNotifications((current) => current.filter((n) => n.id !== id));

        const res = await toggleArchiveAction(id);
        if (!res.success) {
            await refresh();
            throw new Error(res.error || 'Failed to archive notification');
        }
        refreshAll();
    };

    const deleteNotification = async (id: string) => {
        setNotifications((current) => current.filter((n) => n.id !== id));

        const res = await deleteNotificationAction(id);
        if (!res.success) {
            await refresh();
            throw new Error(res.error || 'Failed to delete notification');
        }
        refreshAll();
    };

    const unreadCount = useMemo(
        () => (isArchived ? 0 : notifications.filter((n) => !n.isRead).length),
        [isArchived, notifications],
    );

    return {
        notifications,
        isLoading: isLoading || isRefreshing,
        isError: error,
        unreadCount,
        markAsRead,
        toggleReadStatus,
        toggleStarStatus,
        archiveNotification: toggleArchiveStatus,
        toggleArchiveStatus,
        deleteNotification,
        refresh,
    };
}
