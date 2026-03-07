"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Search,
  Inbox,
  Mail,
  Star,
  Archive,
  Reply,
  Forward,
  Paperclip,
  X,
  FileText,
  File,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface NotificationItem {
  id: string;
  from: string;
  fromDepartment: string;
  departmentColor: string;
  subject: string;
  message: string;
  date: string;
  time: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: string;
  type: string;
  attachments?: { name: string; size: string }[];
}

const initialNotifications: NotificationItem[] = [];

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<
    NotificationItem | undefined
  >(notifications[0]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composePriority, setComposePriority] = useState("medium");

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif: any) => {
    const matchesFilter =
      filterType === "all"
        ? !notif.isArchived
        : filterType === "unread"
          ? !notif.isRead && !notif.isArchived
          : filterType === "starred"
            ? notif.isStarred && !notif.isArchived
            : filterType === "archived"
              ? notif.isArchived
              : true;

    const matchesSearch =
      notif.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.fromDepartment.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const starredCount = notifications.filter((n: any) => n.isStarred).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" };
      case "medium":
        return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
      case "low":
        return { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" };
      default:
        return { bg: "#F3F4F6", text: "#1F2937", border: "#D1D5DB" };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "file":
        return <Paperclip className="w-4 h-4" />;
      case "data":
        return <FileText className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const handleSendMessage = () => {
    if (!composeTo || !composeSubject || !composeMessage) {
      showToast("Please fill all required fields", "error");
      return;
    }
    showToast("Message sent successfully", "success");
    setShowComposeModal(false);
    setComposeTo("");
    setComposeSubject("");
    setComposeMessage("");
    setComposePriority("medium");
  };

  const markAsRead = (id: string) => {
    showToast("Marked as read", "success");
  };

  const toggleStar = (id: string) => {
    setNotifications((prev: NotificationItem[]) =>
      prev.map((n: any) =>
        n.id === id ? { ...n, isStarred: !n.isStarred } : n,
      ),
    );
    // If selected notification is the one being toggled, update it
    if (selectedNotification?.id === id) {
      setSelectedNotification((prev: NotificationItem | undefined) =>
        prev ? { ...prev, isStarred: !prev.isStarred } : undefined,
      );
    }
  };

  const handleArchive = (id: string) => {
    setNotifications((prev: NotificationItem[]) =>
      prev.map((n: any) => (n.id === id ? { ...n, isArchived: true } : n)),
    );
    if (selectedNotification?.id === id) {
      setSelectedNotification(undefined);
    }
    showToast("Message archived successfully", "success");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-[20px] w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              Notifications & Messages
            </h2>
            <p className="text-sm text-[#6B7280]">Communication center</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowComposeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
            >
              <Send className="w-4 h-4" />
              Compose
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-12">
          {/* Left Column - Messages List */}
          <div className="col-span-4 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full overflow-hidden">
            {/* Stats Summary - Compact */}
            <div className="p-4 grid grid-cols-2 gap-2 shrink-0">
              <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FEF3C7] rounded-lg flex items-center justify-center text-[#F59E0B]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Unread</div>
                  <div className="font-semibold text-[#1A1A1A]">
                    {unreadCount}
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FEF9C3] rounded-lg flex items-center justify-center text-[#EAB308]">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Starred</div>
                  <div className="font-semibold text-[#1A1A1A]">
                    {starredCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 mb-2 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {["all", "unread", "starred", "archived"].map((type: any) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                      filterType === type
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotification(notif)}
                  className={`p-4 border-b border-[#E5E7EB] cursor-pointer transition-colors ${selectedNotification?.id === notif.id ? "bg-white border-l-4 border-l-[#1A1A1A]" : "hover:bg-white"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm truncate pr-2 ${!notif.isRead ? "font-bold text-[#1A1A1A]" : "font-medium text-[#4B5563]"}`}
                    >
                      {notif.from}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div
                    className={`text-xs mb-1 truncate ${!notif.isRead ? "text-[#1A1A1A] font-medium" : "text-[#6B7280]"}`}
                  >
                    {notif.subject}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: notif.departmentColor }}
                    />

                    <span className="text-[10px] text-[#9CA3AF] truncate">
                      {notif.fromDepartment}
                    </span>
                    {notif.isStarred && (
                      <Star className="w-3 h-3 text-[#EAB308] fill-[#EAB308] ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Detail */}
          <div className="col-span-8 bg-white h-full overflow-y-auto p-6">
            {selectedNotification ? (
              <div className="max-w-3xl mx-auto">
                {/* Detail Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-[#E5E7EB]">
                  <div>
                    <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">
                      {selectedNotification.subject}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{
                          backgroundColor: selectedNotification.departmentColor,
                        }}
                      >
                        {selectedNotification.from.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">
                          {selectedNotification.from}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {selectedNotification.fromDepartment} •{" "}
                          {new Date(
                            selectedNotification.timestamp,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStar(selectedNotification.id)}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg"
                    >
                      <Star
                        className={`w-5 h-5 ${selectedNotification.isStarred ? "text-[#EAB308] fill-[#EAB308]" : "text-[#6B7280]"}`}
                      />
                    </button>
                    <button
                      onClick={() => handleArchive(selectedNotification.id)}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg text-[#6B7280]"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="prose prose-sm max-w-none text-[#374151] mb-8">
                  {selectedNotification.message}
                </div>

                {/* Attachments */}
                {selectedNotification.attachments &&
                  selectedNotification.attachments.length > 0 && (
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mb-6">
                      <div className="text-xs font-semibold text-[#6B7280] uppercase mb-3">
                        Attachments
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNotification.attachments.map(
                          (att: { name: string; size: string }, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-2 bg-white border border-[#E5E7EB] rounded-md"
                            >
                              <File className="w-8 h-8 text-[#9CA3AF] p-1 bg-[#F3F4F6] rounded" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[#1A1A1A] truncate">
                                  {att.name}
                                </div>
                                <div className="text-xs text-[#6B7280]">
                                  {att.size}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Reply Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setComposeTo(selectedNotification.fromDepartment);
                      setComposeSubject(`Re: ${selectedNotification.subject}`);
                      setShowComposeModal(true);
                    }}
                    className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" /> Reply
                  </button>
                  <button
                    onClick={() => {
                      setComposeSubject(`Fwd: ${selectedNotification.subject}`);
                      setComposeMessage(
                        `\n\n--- Forwarded Message ---\nFrom: ${selectedNotification.from}\n${selectedNotification.message}`,
                      );
                      setShowComposeModal(true);
                    }}
                    className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] flex items-center gap-2"
                  >
                    <Forward className="w-4 h-4" /> Forward
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#9CA3AF]">
                <Inbox className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a notification to read</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal (Nested) */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-8">
          {/* Reuse the compose modal content here but styled slightly smaller if needed, or just standard */}
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Compose Message</h3>
              <button onClick={() => setShowComposeModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg"
              />

              <textarea
                placeholder="Message..."
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg h-32"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-[#10B981] text-white rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
