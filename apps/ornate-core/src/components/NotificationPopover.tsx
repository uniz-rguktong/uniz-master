'use client';
import { useState, type MouseEvent } from 'react';
import {
  Send, Search, Inbox, Mail, Star, Archive,
  File, ChevronLeft, Bell, Reply, X
} from
  'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useToast } from '@/hooks/useToast';
import { ClientOnly } from './ClientOnly';
import { useNotifications } from '@/hooks/useNotifications';
import {
  sendNotification,
  searchRecipients
} from '@/actions/notificationActions';

interface NotificationPopoverProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
}

export function NotificationPopover({ onNavigate }: NotificationPopoverProps = {}) {
  const [filterType, setFilterType] = useState('all');

  // Use SWR hook for notifications (inbox or sent based on filter)
  const {
    notifications: rawNotifications,
    markAsRead,
    toggleStarStatus,
    archiveNotification,
    refresh
  } = useNotifications(false, filterType === 'sent');

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Record<string, any> | null>(null);
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast, showToast, hideToast } = useToast();

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Record<string, any> | null>(null);
  const [searchResults, setSearchResults] = useState<Array<Record<string, any>>>([]);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Map notifications to UI expected format
  const notifications: Array<Record<string, any>> = (rawNotifications as Array<Record<string, any>>).map(n => ({
    ...n,
    from: filterType === 'sent' ? `To: ${n.recipientName || 'Recipient'}` : n.senderName,
    fromDepartment: filterType === 'sent' ? (n.recipientRole || 'Recipient') : n.senderRole,
    departmentColor: n.type === 'admin' ? '#8B5CF6' : n.type === 'system' ? '#EF4444' : '#10B981',
    subject: n.message.substring(0, 40) + (n.message.length > 40 ? '...' : ''),
    timestamp: n.createdAt
  }));

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notif: any) => {
    const matchesFilter =
      filterType === 'all' ? true :
        filterType === 'unread' ? !notif.isRead :
          filterType === 'starred' ? notif.isStarred :
            filterType === 'sent' ? true : true;

    const matchesSearch =
      (notif.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notif.from || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleNotificationClick = async (notif: Record<string, any>) => {
    setSelectedNotification(notif);
    setView('detail');
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
  };

  const handleBack = () => {
    setSelectedNotification(null);
    setView('list');
    setSearchResults([]);
    setSelectedRecipient(null);
  };

  const toggleStar = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleStarStatus(id);
  };

  const handleArchive = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    await archiveNotification(id);
    if (selectedNotification?.id === id) {
      handleBack();
    }
    showToast('Message archived', 'success');
  };

  const handleToChange = async (val: string) => {
    setComposeTo(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await searchRecipients(val, 'admin');
    if (res.success) {
      setSearchResults(res.data || []);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !composeMessage) {
      showToast('Please select a recipient and enter a message', 'error');
      return;
    }

    setIsSending(true);
    const res = await sendNotification({
      recipientId: selectedRecipient.id,
      recipientName: selectedRecipient.name,
      recipientRole: selectedRecipient.role,
      message: composeMessage,
      type: 'admin',
      priority: 'medium'
    });

    setIsSending(false);

    if (res.success) {
      showToast('Message sent', 'success');
      setComposeTo('');
      setSelectedRecipient(null);
      setComposeSubject('');
      setComposeMessage('');
      setView('list');
      refresh();
    } else {
      showToast(res.error || 'Failed to send message', 'error');
    }
  };

  return (
    <ClientOnly fallback={
      <button className="relative p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors outline-none">
        <Bell className="w-5 h-5 text-[#6B7280]" />
        {unreadCount > 0 &&
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></div>
        }
      </button>
    }>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button className="relative p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors outline-none">
            <Bell className="w-5 h-5 text-[#6B7280]" />
            {unreadCount > 0 &&
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></div>
            }
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="w-[400px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden mr-4 z-50 flex flex-col max-h-[600px] animate-in fade-in zoom-in-95 duration-200"
            align="end"
            sideOffset={5}>

            {/* Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-10">
              {view === 'list' ?
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-semibold text-[#1A1A1A]">
                    Notifications
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView('compose')}
                      className="p-1.5 hover:bg-[#F3F4F6] rounded-md text-[#10B981]">

                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div> :

                <div className="flex items-center gap-2">
                  <button onClick={handleBack} className="p-1 hover:bg-[#F3F4F6] rounded-full">
                    <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
                  </button>
                  <h3 className="font-semibold text-[#1A1A1A]">
                    {view === 'compose' ? 'Compose' : 'Message'}
                  </h3>
                </div>
              }
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {view === 'list' &&
                <div className="flex flex-col h-full">
                  {/* Search & Filter */}
                  <div className="p-3 border-b border-[#E5E7EB] space-y-3 bg-[#F9FAFB]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]" />

                    </div>
                    <div className="flex gap-2">
                      {['all', 'unread', 'starred', 'sent'].map((type: any) =>
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-2.5 py-1 rounded text-xs font-medium capitalize border transition-colors ${filterType === type ?
                            'bg-[#1A1A1A] text-white border-[#1A1A1A]' :
                            'bg-white text-[#6B7280] border-[#E5E7EB]'}`
                          }>

                          {type}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {filteredNotifications.length === 0 ?
                      <div className="flex flex-col items-center justify-center h-48 text-[#9CA3AF]">
                        <Inbox className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">No notifications found</p>
                      </div> :

                      filteredNotifications.map((notif: any) =>
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors relative group ${!notif.isRead ? 'bg-[#F0FDF4]/30' : ''}`
                          }>

                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm truncate pr-6 ${!notif.isRead ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#4B5563]'}`}>
                              {notif.from}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                              {new Date(notif.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className={`text-xs mb-1 truncate ${!notif.isRead ? 'text-[#1A1A1A] font-medium' : 'text-[#6B7280]'}`}>
                            {notif.subject}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: notif.departmentColor }} />

                            <span className="text-[10px] text-[#9CA3AF] truncate">{notif.fromDepartment}</span>
                          </div>

                          {/* Actions on hover */}
                          <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => toggleStar(e, notif.id)}
                              className="p-1 hover:bg-white rounded-md border border-transparent hover:border-[#E5E7EB]">

                              <Star className={`w-3.5 h-3.5 ${notif.isStarred ? 'text-[#EAB308] fill-[#EAB308]' : 'text-[#9CA3AF]'}`} />
                            </button>
                            <button
                              onClick={(e) => handleArchive(e, notif.id)}
                              className="p-1 hover:bg-white rounded-md border border-transparent hover:border-[#E5E7EB]">

                              <Archive className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            </button>
                          </div>
                        </div>
                      )
                    }
                    {filteredNotifications.length > 0 &&
                      <div className="p-3 border-t border-[#E5E7EB] bg-white sticky bottom-0">
                        <button
                          onClick={() => {
                            onNavigate?.('notifications');
                            setIsOpen(false);
                          }}
                          className="w-full py-2 text-sm font-semibold text-[#1A1A1A] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg transition-colors">

                          View All
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }

              {view === 'detail' && selectedNotification &&
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ backgroundColor: selectedNotification.departmentColor }}>

                        {selectedNotification.from.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1A1A1A] text-sm">{selectedNotification.from}</div>
                        <div className="text-xs text-[#6B7280]">{selectedNotification.fromDepartment}</div>
                      </div>
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {new Date(selectedNotification.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <h4 className="font-bold text-[#1A1A1A] mb-3 text-base">{selectedNotification.subject}</h4>
                  <div className="prose prose-sm text-[#374151] mb-6 text-sm leading-relaxed">
                    {selectedNotification.message}
                  </div>

                  {selectedNotification.attachments &&
                    <div className="mb-6 space-y-2">
                      <div className="text-xs font-semibold text-[#6B7280] uppercase">Attachments</div>
                      {selectedNotification.attachments.map((att: any, i: number) =>
                        <div key={i} className="flex items-center gap-3 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                          <File className="w-6 h-6 text-[#9CA3AF]" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[#1A1A1A] truncate">{att.name}</div>
                            <div className="text-[10px] text-[#6B7280]">{att.size}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  }

                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => {
                        const targetId = filterType === 'sent' ? selectedNotification.recipientId : selectedNotification.senderId;
                        const targetName = filterType === 'sent' ? selectedNotification.recipientName : selectedNotification.senderName;
                        const targetRole = filterType === 'sent' ? selectedNotification.recipientRole : selectedNotification.senderRole;
                        const targetBranch = filterType === 'sent' ? (selectedNotification.recipientBranch || 'Main') : selectedNotification.senderBranch;

                        setSelectedRecipient({
                          id: targetId,
                          name: targetName,
                          branch: targetBranch,
                          role: targetRole
                        });
                        setComposeMessage(`\n\n--- ${filterType === 'sent' ? 'Messaging again' : 'Replying to message from'} ${targetName} ---\n> ${selectedNotification.message.substring(0, 50)}...\n\n`);
                        setView('compose');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#1A1A1A] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB]">

                      <Reply className="w-4 h-4" /> {filterType === 'sent' ? 'Message Again' : 'Reply'}
                    </button>
                    <button
                      onClick={() => showToast('Marked as unread', 'success')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#1A1A1A] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB]">

                      <Mail className="w-4 h-4" /> Unread
                    </button>
                  </div>
                </div>
              }

              {view === 'compose' &&
                <div className="p-4 space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-[#6B7280] mb-1">To</label>
                    {selectedRecipient ? (
                      <div className="flex items-center justify-between px-3 py-2 text-sm bg-[#F0FDF4] border border-[#10B981] rounded-lg">
                        <span className="font-medium text-[#065F46]">{selectedRecipient.name} ({selectedRecipient.branch || selectedRecipient.role})</span>
                        <button
                          onClick={() => {
                            setSelectedRecipient(null);
                            setComposeTo('');
                          }}
                          className="text-[#065F46] hover:text-[#047857]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          value={composeTo}
                          onChange={(e) => handleToChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                          placeholder="Search admin (e.g. ECE)..." />

                        {searchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-[100%] mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                            {searchResults.map((admin: any) => (
                              <button
                                key={admin.id}
                                onClick={() => {
                                  setSelectedRecipient(admin);
                                  setComposeTo(admin.name);
                                  setSearchResults([]);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-[#F9FAFB] border-b border-[#F3F4F6] last:border-0"
                              >
                                <div className="font-medium text-[#1A1A1A]">{admin.name}</div>
                                <div className="text-[10px] text-[#6B7280] capitalize">{admin.branch || admin.role}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1">Message</label>
                    <textarea
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg h-32 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                      placeholder="Type your message..." />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A]">
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isSending ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669]'
                        }`}>
                      {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              }
            </div>
          </Popover.Content>
        </Popover.Portal>


      </Popover.Root>
    </ClientOnly>
  );

}