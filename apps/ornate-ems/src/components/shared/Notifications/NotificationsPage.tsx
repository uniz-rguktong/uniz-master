"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Mail,
  Send,
  Trash2,
  CheckCircle2,
  Shield,
  ChevronRight,
  Reply,
  Archive,
  Star,
  Zap,
  Users,
  Building,
  Clock,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useNotifications } from "@/hooks/useNotifications";
import { MetricCard } from "@/components/MetricCard";
import { MetricCardSkeleton, TableRowSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendNotification,
  searchRecipients,
} from "@/actions/notificationActions";

const formatDate = (dateString: string | Date) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diff < 48 * 60 * 60 * 1000) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

interface NotificationsPageProps {
  variant?: "admin" | "clubs" | "sports" | "hho" | "super-admin";
}

export default function NotificationsPage({
  variant = "admin",
}: NotificationsPageProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [selectedAudience, setSelectedAudience] = useState<"club" | "admin">(
    "admin",
  );

  // Use the custom hook for data fetching and mutations
  const inbox = useNotifications(false, false);
  const archived = useNotifications(true, false);
  const sent = useNotifications(false, true);
  const sentArchived = useNotifications(true, true);

  // Derive the relevant hook based on current view
  const currentHook =
    filter === "archived" ? archived : filter === "sent" ? sent : inbox;

  const [recipientOptions, setRecipientOptions] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Derived State
  const mergeAndSort = (items: any[]) => {
    const unique = new Map<string, any>();
    items.forEach((item: any) => {
      if (item?.id) unique.set(item.id, item);
    });
    return Array.from(unique.values()).sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  const allMessages = useMemo(
    () =>
      mergeAndSort([
        ...inbox.notifications,
        ...sent.notifications,
        ...archived.notifications,
        ...sentArchived.notifications,
      ]),
    [
      inbox.notifications,
      sent.notifications,
      archived.notifications,
      sentArchived.notifications,
    ],
  );

  const archivedMessages = useMemo(
    () =>
      mergeAndSort([...archived.notifications, ...sentArchived.notifications]),
    [archived.notifications, sentArchived.notifications],
  );

  const isLoading =
    filter === "all" || filter === "starred"
      ? inbox.isLoading ||
        sent.isLoading ||
        archived.isLoading ||
        sentArchived.isLoading
      : filter === "archived"
        ? archived.isLoading || sentArchived.isLoading
        : filter === "sent"
          ? sent.isLoading
          : inbox.isLoading;

  const notifications =
    filter === "all"
      ? allMessages
      : filter === "unread"
        ? inbox.notifications.filter((n: any) => !n.isRead)
        : filter === "starred"
          ? allMessages.filter((n: any) => n.isStarred)
          : filter === "sent"
            ? sent.notifications
            : filter === "archived"
              ? archivedMessages
              : allMessages;

  const filteredNotifications = notifications.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        n.senderName?.toLowerCase().includes(q) ||
        n.recipientName?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q) ||
        n.senderRole?.toLowerCase().includes(q) ||
        n.recipientRole?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  const stats = {
    total: allMessages.length,
    unread: inbox.unreadCount,
    archived: archivedMessages.length,
    sent: sent.notifications.length,
  };

  const isSuperAdmin = variant === "super-admin";

  const loadRecipientOptions = useCallback(
    async (audience: "club" | "admin") => {
      const res = await searchRecipients("", audience);
      if (res.success && res.data) {
        setRecipientOptions(res.data);
        return;
      }
      setRecipientOptions([]);
    },
    [],
  );

  useEffect(() => {
    if (!isComposeOpen) return;
    if (isSuperAdmin) {
      setSelectedAudience("admin");
      loadRecipientOptions("admin");
      return;
    }
    loadRecipientOptions(selectedAudience);
  }, [isComposeOpen, isSuperAdmin, selectedAudience, loadRecipientOptions]);

  const getRecipientDisplayName = (recipient: any) => {
    if (!recipient) return "";
    if (recipient.role === "CLUB_COORDINATOR") {
      return recipient.clubId || recipient.name || "Club";
    }
    return recipient.name || "Admin";
  };

  const handleComposeSubmit = async () => {
    if (!selectedRecipient) {
      showToast("Please select a recipient", "error");
      return;
    }
    if (!composeSubject.trim()) {
      showToast("Please enter a subject", "error");
      return;
    }
    if (!composeMessage.trim()) {
      showToast("Please enter a message", "error");
      return;
    }

    const finalMessage = `Subject: ${composeSubject.trim()}\n\n${composeMessage.trim()}`;

    setIsSending(true);
    const res = await sendNotification({
      recipientId: selectedRecipient.id,
      recipientName: getRecipientDisplayName(selectedRecipient),
      recipientRole: selectedRecipient.role,
      message: finalMessage,
      type: selectedAudience,
      priority: "medium",
    });

    if (res.success) {
      showToast("Message sent successfully!", "success");
      setIsComposeOpen(false);
      setComposeSubject("");
      setComposeMessage("");
      setSelectedRecipient(null);
      inbox.refresh();
    } else {
      showToast(res.error || "Failed to send message", "error");
    }
    setIsSending(false);
  };

  const handleToggleRead = async (id: string) => {
    await currentHook.toggleReadStatus(id);
  };

  const handleToggleStar = async (id: string) => {
    await currentHook.toggleStarStatus(id);
  };

  const handleDelete = async (id: string) => {
    await currentHook.deleteNotification(id);
    showToast("Notification permanently deleted", "info");
    if (selectedNotification?.id === id) setSelectedNotification(null);
  };

  const handleArchive = async (id: string) => {
    await currentHook.archiveNotification(id);
    if (selectedNotification?.id === id) setSelectedNotification(null);
  };

  const handleReply = (notification: any) => {
    setSelectedRecipient({
      id: notification.senderId,
      name: notification.senderName,
      role: notification.senderRole,
      branch: notification.senderBranch,
    });
    const replyAudience = notification.type === "club" ? "club" : "admin";
    setSelectedAudience(replyAudience);
    setComposeMessage(
      `\n\n--- Replying to message from ${notification.senderName} ---\n${notification.message.substring(0, 50)}...`,
    );
    setComposeSubject("Re:");
    setIsComposeOpen(true);
    setSelectedNotification(null);
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Notifications</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Notification Center
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage messages, alerts, and announcements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-medium hover:bg-[#059669] transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              Compose Message
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Messages"
              value={stats.total.toString()}
              icon={Inbox}
              iconBgColor="#DBEAFE"
              iconColor="#3B82F6"
              subtitle="In inbox"
              infoText="Total messages in your inbox"
              delay={0}
            />
            <MetricCard
              title="Unread"
              value={stats.unread.toString()}
              icon={Mail}
              iconBgColor="#D1FAE5"
              iconColor="#10B981"
              subtitle={stats.unread > 0 ? "Action needed" : "All caught up"}
              infoText="Messages awaiting your attention"
              delay={40}
            />
            <MetricCard
              title="Sent Messages"
              value={stats.sent.toString()}
              icon={Send}
              iconBgColor="#EDE9FE"
              iconColor="#8B5CF6"
              subtitle="Outbox"
              infoText="Messages sent by you"
              delay={80}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-3 md:px-[12px] mt-[10px] mb-[16px]">
          <div className="flex-1 relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto justify-end">
            <div className="min-w-[140px] shrink-0">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-10 text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl">
                  <SelectValue placeholder="Filter View" />
                </SelectTrigger>
                <SelectContent className="">
                  <SelectItem value="all" className="">
                    All Messages
                  </SelectItem>
                  <SelectItem value="unread" className="">
                    Unread Only
                  </SelectItem>
                  <SelectItem value="starred" className="">
                    Starred Only
                  </SelectItem>
                  <SelectItem value="sent" className="">
                    Sent Messages
                  </SelectItem>
                  <SelectItem value="archived" className="">
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm min-h-[500px] flex flex-col">
          {isLoading ? (
            <div className="p-0">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="flex-1 overflow-y-auto max-h-[700px]">
              <div className="divide-y divide-[#F3F4F6]">
                {filteredNotifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`group p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-[#FAFAFA] transition-all cursor-pointer relative ${!notif.isRead && filter !== "sent" ? "bg-blue-50/30" : ""}`}
                    onClick={() => setSelectedNotification(notif)}
                  >
                    {!notif.isRead && filter !== "sent" && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3B82F6]" />
                    )}

                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(notif.id);
                        }}
                        className={`p-1 transition-all hover:scale-110 ${notif.isStarred ? "text-yellow-500" : "text-[#D1D5DB]"}`}
                      >
                        <Star
                          className={`w-5 h-5 ${notif.isStarred ? "fill-current" : ""}`}
                        />
                      </button>

                      <div
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-lg shadow-sm relative group-hover:scale-105 transition-transform ${
                          notif.type === "admin"
                            ? "bg-[#1A1A1A] text-white"
                            : notif.type === "club"
                              ? "bg-[#10B981] text-white"
                              : notif.type === "student"
                                ? "bg-[#3B82F6] text-white"
                                : "bg-[#EF4444] text-white"
                        }`}
                      >
                        {(filter === "sent"
                          ? notif.recipientName
                          : notif.senderName
                        )?.charAt(0) || "?"}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-white">
                          <Zap className="w-2.5 h-2.5 text-[#EF4444]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3
                            className={`text-sm font-bold ${notif.isRead || filter === "sent" ? "text-[#4B5563]" : "text-[#1A1A1A]"}`}
                          >
                            {filter === "sent"
                              ? `To: ${notif.recipientName || "Recipient"}`
                              : notif.senderName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityStyles(notif.priority)}`}
                          >
                            {notif.priority}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#9CA3AF] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-[#3B82F6] uppercase tracking-wide">
                          {filter === "sent"
                            ? notif.recipientRole || "Recipient"
                            : notif.senderRole}
                        </span>
                        <span className="w-1 h-1 bg-[#D1D5DB] rounded-full hidden sm:block" />
                        <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">
                          {filter === "sent"
                            ? notif.recipientBranch || "Main"
                            : notif.senderBranch}
                        </span>
                      </div>

                      <p
                        className={`text-sm line-clamp-2 md:line-clamp-1 leading-relaxed ${notif.isRead ? "text-[#6B7280]" : "text-[#4B5563] font-medium"}`}
                      >
                        {notif.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-end md:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(notif.id);
                        }}
                        className="p-2.5 bg-white border border-[#E5E7EB] text-[#6B7280] rounded-xl hover:text-[#3B82F6] hover:border-[#3B82F6] hover:shadow-md transition-all active:scale-95"
                        title={notif.isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(notif.id);
                        }}
                        className="p-2.5 bg-white border border-[#E5E7EB] text-[#6B7280] rounded-xl hover:text-[#EF4444] hover:border-[#EF4444] hover:shadow-md transition-all active:scale-95"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB]">
                <Inbox className="w-8 h-8 text-[#D1D5DB]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
                No messages found
              </h3>
              <p className="text-sm text-[#6B7280]">
                Your search did not match any notifications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Notification Dialog */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-xl"
            onClick={() => setSelectedNotification(null)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[20px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-gray-200 border-2 border-white ${
                      selectedNotification.type === "admin"
                        ? "bg-[#1A1A1A] text-white"
                        : selectedNotification.type === "club"
                          ? "bg-[#10B981] text-white"
                          : "bg-[#3B82F6] text-white"
                    }`}
                  >
                    {(filter === "sent"
                      ? selectedNotification.recipientName
                      : selectedNotification.senderName
                    )?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] tracking-tight">
                      {filter === "sent"
                        ? selectedNotification.recipientName || "Recipient"
                        : selectedNotification.senderName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">
                        {filter === "sent"
                          ? selectedNotification.recipientRole || "Recipient"
                          : selectedNotification.senderRole}
                      </span>
                      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                        {filter === "sent"
                          ? selectedNotification.recipientBranch || "Main"
                          : selectedNotification.senderBranch}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center sm:justify-end gap-1.5 mb-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedNotification.createdAt)}
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityStyles(selectedNotification.priority)}`}
                  >
                    {selectedNotification.priority} PRIORITY
                  </span>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[14px] p-5 sm:p-6 border border-[#E5E7EB]/50 mb-6">
                <p className="text-[#1A1A1A] text-sm leading-relaxed font-medium">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedNotification.id)}
                    className="p-3 bg-white border border-gray-200 text-[#EF4444] rounded-lg hover:bg-red-50 hover:border-red-100 hover:scale-105 active:scale-95 transition-all"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleArchive(selectedNotification.id);
                      showToast(
                        filter === "archived"
                          ? "Notification restored to inbox"
                          : "Notification moved to archive",
                        "info",
                      );
                    }}
                    className="p-3 bg-white border border-gray-200 text-[#1A1A1A] rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    title={
                      filter === "archived" ? "Restore to Inbox" : "Archive"
                    }
                  >
                    {filter === "archived" ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-5 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hover:text-[#1A1A1A] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleReply(selectedNotification)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-[#10B981] text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#059669] hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    {filter === "sent" ? "Message Again" : "Reply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setRecipientOptions([]);
          setSelectedRecipient(null);
          setComposeSubject("");
          setComposeMessage("");
        }}
        title="Compose New Message"
        size="lg"
        tooltipText="Send a secure message to recipients."
      >
        <div className="space-y-6">
          {!isSuperAdmin && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#1A1A1A]">
                Target Audience
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "admin" as const,
                    label: "Admins",
                    icon: Shield,
                    activeClass:
                      "bg-[#1A1A1A] text-white shadow-lg shadow-black/10 border-transparent",
                    inactiveClass:
                      "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1A1A1A] hover:text-[#1A1A1A]",
                  },
                  {
                    id: "club" as const,
                    label: "Clubs",
                    icon: Building,
                    activeClass:
                      "bg-[#10B981] text-white shadow-lg shadow-emerald-500/20 border-transparent",
                    inactiveClass:
                      "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#10B981] hover:text-[#10B981]",
                  },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedAudience(type.id);
                      setRecipientOptions([]);
                      setSelectedRecipient(null);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border transition-all duration-300 ${
                      selectedAudience === type.id
                        ? `${type.activeClass} scale-[1.02]`
                        : `${type.inactiveClass} hover:shadow-sm`
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        selectedAudience === type.id
                          ? "bg-white/20"
                          : "bg-[#F9FAFB]"
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1A1A1A]">
              Recipient
            </label>
            {isSuperAdmin ? (
              <Select
                value={selectedRecipient?.id || ""}
                onValueChange={(value) => {
                  const recipient =
                    recipientOptions.find((entry: any) => entry.id === value) ||
                    null;
                  setSelectedRecipient(recipient);
                }}
              >
                <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="Select admin recipient" />
                </SelectTrigger>
                <SelectContent>
                  {recipientOptions.map((recipient: any) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {getRecipientDisplayName(recipient)} • {recipient.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={selectedRecipient?.id || ""}
                onValueChange={(value) => {
                  const recipient =
                    recipientOptions.find((entry: any) => entry.id === value) ||
                    null;
                  setSelectedRecipient(recipient);
                }}
              >
                <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue
                    placeholder={
                      selectedAudience === "admin"
                        ? "Select admin recipient"
                        : "Select club recipient"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {recipientOptions.map((recipient: any) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {getRecipientDisplayName(recipient)} • {recipient.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1A1A1A]">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter subject"
              className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1A1A1A]">
              Message Content
            </label>
            <textarea
              rows={6}
              placeholder="Type your message details here..."
              className="w-full p-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleComposeSubmit}
              disabled={
                isSending ||
                !selectedRecipient ||
                !composeSubject.trim() ||
                !composeMessage.trim()
              }
              className="px-6 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-medium hover:bg-[#059669] transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
