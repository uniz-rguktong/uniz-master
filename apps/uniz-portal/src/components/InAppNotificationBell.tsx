import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  ExternalLink, 
  Loader2, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IN_APP_NOTIFICATIONS, 
  MARK_NOTIFICATION_READ, 
  MARK_ALL_NOTIFICATIONS_READ, 
  DELETE_NOTIFICATION 
} from "../api/endpoints";
import { cn } from "../utils/cn";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export function InAppNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (p = 1, append = false) => {
    const token = localStorage.getItem("token") || 
                  localStorage.getItem("admin_token") || 
                  localStorage.getItem("faculty_token");
    
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${IN_APP_NOTIFICATIONS}?page=${p}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (res.success) {
        if (append) {
          setNotifications(prev => [...prev, ...res.data]);
        } else {
          setNotifications(res.data);
        }
        setUnreadCount(res.unreadCount);
        setHasMore(res.page < res.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => fetchNotifications(1, false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token") || 
                    localStorage.getItem("admin_token") || 
                    localStorage.getItem("faculty_token");
      const response = await fetch(MARK_NOTIFICATION_READ(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token") || 
                    localStorage.getItem("admin_token") || 
                    localStorage.getItem("faculty_token");
      const response = await fetch(MARK_ALL_NOTIFICATIONS_READ, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token") || 
                    localStorage.getItem("admin_token") || 
                    localStorage.getItem("faculty_token");
      const response = await fetch(DELETE_NOTIFICATION(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const deleted = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (deleted && !deleted.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className="text-emerald-500" size={16} />;
      case "WARNING": return <AlertTriangle className="text-amber-500" size={16} />;
      case "ERROR": return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 group"
      >
        <Bell size={20} className={cn(unreadCount > 0 && "animate-[bell-ring_1s_ease-in-out_infinite]")} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white ring-1 ring-rose-500/20">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100] origin-top-right"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-1 px-2 text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-all flex items-center gap-1.5"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-md text-slate-400">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
              {notifications.length === 0 && !loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Bell className="text-slate-300" size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No notifications for you yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notif) => (
                    <motion.div
                      layout
                      key={notif.id}
                      className={cn(
                        "p-4 hover:bg-slate-50/80 transition-all cursor-pointer group relative flex gap-3",
                        !notif.isRead && "bg-blue-50/30 border-l-2 border-l-blue-500/50"
                      )}
                      onClick={() => {
                        if (notif.link) window.open(notif.link, "_blank");
                      }
                    }>
                      <div className="shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className={cn("text-[13px] tracking-tight truncate", notif.isRead ? "text-slate-600 font-medium" : "text-slate-900 font-bold")}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center gap-3">
                          {notif.link && (
                            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                              <ExternalLink size={10} /> View details
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => markAsRead(notif.id, e)}
                                className="p-1 hover:bg-white border hover:border-slate-200 rounded text-slate-400 hover:text-blue-600 transition-all"
                                title="Mark as read"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => deleteNotif(notif.id, e)}
                              className="p-1 hover:bg-white border hover:border-slate-200 rounded text-slate-400 hover:text-rose-600 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {hasMore && (
                <div className="p-4 bg-slate-50/20 text-center">
                  <button
                    disabled={loading}
                    onClick={loadMore}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2 w-full py-1.5 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : "Load older notifications"}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
               <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                  UniZ Intelligence System
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0); }
          10%, 30% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(10deg); }
          50% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          70% { transform: rotate(-5deg); }
          80% { transform: rotate(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
