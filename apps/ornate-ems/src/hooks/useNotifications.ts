"use client";

import useSWR, { mutate } from "swr";
import {
  getNotifications,
  markAsRead as markAsReadAction,
  toggleReadStatus as toggleReadAction,
  toggleStarStatus as toggleStarAction,
  toggleArchiveStatus as toggleArchiveAction,
  deleteNotification as deleteNotificationAction,
} from "@/actions/notificationActions";

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

const fetcher = async ([key, isArchived, isSent]: [
  string,
  boolean,
  boolean,
]): Promise<Notification[]> => {
  const res = await getNotifications(isArchived, isSent);
  if (!res.success) throw new Error(res.error);
  return res.data as Notification[]; // Cast or ensure getNotifications is typed
};

export function useNotifications(isArchived = false, isSent = false) {
  // Use a composite key to separate Inbox vs Archive vs Sent
  const { data, error, isLoading } = useSWR<Notification[]>(
    ["notifications", isArchived, isSent],
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds for near-real-time updates
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );

  const notifications = data || [];

  // Helper to trigger revalidation of all lists
  const refreshAll = () => {
    mutate(["notifications", false, false]); // Inbox
    mutate(["notifications", true, false]); // Archived
    mutate(["notifications", false, true]); // Sent
    mutate(["notifications", true, true]); // Sent Archived (if any)
  };

  const markAsRead = async (id: string) => {
    // Optimistic update for current view
    mutate(
      ["notifications", isArchived, isSent],
      (current: Notification[] | undefined) =>
        current?.map((n: any) => (n.id === id ? { ...n, isRead: true } : n)),
      false,
    );

    await markAsReadAction(id);
    refreshAll();
  };

  const toggleReadStatus = async (id: string) => {
    mutate(
      ["notifications", isArchived, isSent],
      (current: Notification[] | undefined) =>
        current?.map((n: any) =>
          n.id === id ? { ...n, isRead: !n.isRead } : n,
        ),
      false,
    );

    await toggleReadAction(id);
    refreshAll();
  };

  const toggleStarStatus = async (id: string) => {
    mutate(
      ["notifications", isArchived, isSent],
      (current: Notification[] | undefined) =>
        current?.map((n: any) =>
          n.id === id ? { ...n, isStarred: !n.isStarred } : n,
        ),
      false,
    );

    await toggleStarAction(id);
    refreshAll();
  };

  const toggleArchiveStatus = async (id: string) => {
    // Optimistic: Remove from current list immediately
    mutate(
      ["notifications", isArchived, isSent],
      (current: Notification[] | undefined) =>
        current?.filter((n: any) => n.id !== id),
      false,
    );

    await toggleArchiveAction(id);
    refreshAll();
  };

  const deleteNotification = async (id: string) => {
    mutate(
      ["notifications", isArchived, isSent],
      (current: Notification[] | undefined) =>
        current?.filter((n: any) => n.id !== id),
      false,
    );

    await deleteNotificationAction(id);
    refreshAll();
  };

  // Calculate unread count specifically for active/inbox notifications
  // This is a helper, but really only valid if isArchived is false
  const unreadCount = isArchived
    ? 0
    : notifications.filter((n: any) => !n.isRead).length;

  return {
    notifications,
    isLoading,
    isError: error,
    unreadCount,
    markAsRead,
    toggleReadStatus,
    toggleStarStatus,
    archiveNotification: toggleArchiveStatus,
    toggleArchiveStatus,
    deleteNotification,
    refresh: refreshAll, // expose a manual refresh if needed
  };
}
