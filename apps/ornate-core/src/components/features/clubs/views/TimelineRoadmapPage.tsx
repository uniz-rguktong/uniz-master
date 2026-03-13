'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/Modal';
import { ActionMenu } from '@/components/ActionMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCalendarEvents } from '@/actions/eventGetters';
import { deleteEvent } from '@/actions/eventActions';
import { getTasks, createTask, deleteTask as removeTask, updateTask, type TaskData } from '@/actions/taskActions';
import { useRouter } from 'next/navigation';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  participants: number;
  status: string;
  color: string;
  description: string | null;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'success' | 'warning' | 'info';
  onConfirm: () => void;
}

interface TaskFormData {
  date: string;
  title?: string;
  description?: string;
  time?: string;
  assignedTo?: string;
  priority?: string;
}

export function TimelineRoadmapPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    date: new Date().toISOString().split('T')[0] || ''
  });
  const [viewingEvent, setViewingEvent] = useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledEvents, setScheduledEvents] = useState<TimelineEvent[]>([]);
  const [dailyTasks, setDailyTasks] = useState<TaskData[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Load events and tasks in parallel
      const [eventsResult, tasksResult] = await Promise.all([
        getCalendarEvents(),
        getTasks()
      ]);

      if (eventsResult.success && eventsResult.data) {
        // Transform events to match timeline format
        const transformedEvents = eventsResult.data.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date, // Already in YYYY-MM-DD format
          time: e.time || 'TBD',
          venue: e.venue || 'TBD',
          category: e.category || 'General',
          participants: e.registrations || 0,
          status: 'confirmed',
          color: e.categoryColor,
          description: e.description
        }));
        setScheduledEvents(transformedEvents);
      } else {
        console.error('Failed to load events:', (eventsResult as any).error);
      }

      if (tasksResult.success && tasksResult.data) {
        setDailyTasks(tasksResult.data);
      } else {
        console.error('Failed to load tasks:', tasksResult.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { showToast, hideToast } = useToast();

  // Get next 7 days from selected date
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date | string): string => {
    if (!date || isNaN(new Date(date).getTime())) return '';
    return new Date(date).toISOString().split('T')[0] || '';
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return scheduledEvents.filter((event: any) => event.date === dateStr);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return dailyTasks.filter((task: any) => task.date === dateStr);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleDeleteEvent = async (event: TimelineEvent) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await deleteEvent(event.id);
          if (result.success) {
            showToast(`${event.title} has been deleted`, 'success');
            await loadEvents(); // Reload events
          } else {
            showToast('Error: ' + (result.error || 'Failed to delete event'), 'error');
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          showToast('Failed to delete event', 'error');
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveTask = async () => {
    if (!taskFormData.title || !taskFormData.date) {
      showToast('Title and Date are required', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', taskFormData.title);
      formData.append('date', taskFormData.date);
      if (taskFormData.description) formData.append('description', taskFormData.description);
      if (taskFormData.time) formData.append('time', taskFormData.time);
      if (taskFormData.assignedTo) formData.append('assignedTo', taskFormData.assignedTo);
      if (taskFormData.priority) formData.append('priority', taskFormData.priority);

      const result = await createTask(formData);
      if (result.success) {
        showToast('Task added successfully', 'success');
        if (result.data) {
          setDailyTasks(prev => [...prev, result.data!].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        }
        setShowAddTaskModal(false);
        setTaskFormData({ date: new Date().toISOString().split('T')[0] || '' });
      } else {
        showToast(result.error || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('An unexpected error occurred', 'error');
    }
  };

  const handleDeleteTask = (task: TaskData) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await removeTask(task.id);
          if (result.success) {
            setDailyTasks(prev => prev.filter(t => t.id !== task.id));
            showToast(`Task has been deleted`, 'success');
          } else {
            showToast(result.error || 'Failed to delete task', 'error');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          showToast('Failed to delete task', 'error');
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleUpdateTaskStatus = async (task: TaskData) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const result = await updateTask(task.id, { status: newStatus });
      if (result.success) {
        setDailyTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        showToast(newStatus === 'completed' ? 'Task completed!' : 'Task marked incomplete', 'success');
      } else {
        showToast(result.error || 'Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in-progress':
        return '#3B82F6';
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const totalEvents = scheduledEvents.length;
  const totalTasks = dailyTasks.length;
  const completedTasks = dailyTasks.filter((t: any) => t.status === 'completed').length;
  const upcomingEvents = scheduledEvents.filter((e: any) => new Date(e.date) >= new Date()).length;

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-4">
          <span>Dashboard</span>
          <span>›</span>
          <span>Clubs Schedule</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Event Timeline</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Event Timeline & Daily Tasks</h1>
            <p className="text-sm text-[#6B7280]">View and manage daily events and tasks schedule</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '50ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">Total Events <InfoTooltip text="Total events scheduled on the roadmap" /></div>
                        <div className="text-2xl font-bold text-[#1A1A1A]">{totalEvents}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '100ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">Upcoming Events <InfoTooltip text="Events whose date is today or later" /></div>
                        <div className="text-2xl font-bold text-[#10B981]">{upcomingEvents}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '150ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-[#F59E0B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">Total Tasks <InfoTooltip text="All tasks listed in the daily task planner" /></div>
                        <div className="text-2xl font-bold text-[#1A1A1A]">{totalTasks}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DCFCE7] rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-sm text-[#6B7280]">Completed Tasks <InfoTooltip text="Tasks currently marked as completed" /></div>
                        <div className="text-2xl font-bold text-[#10B981]">{completedTasks}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Timeline Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Weekly Timeline</h2>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={handlePreviousWeek}
              className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <span className="text-sm font-medium text-[#1A1A1A] min-w-[200px] text-center">
              {getNext7Days()[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getNext7Days()[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">
              <ChevronRight className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline - Weekly View */}
      <div className="space-y-6">
        {isLoading ? (
          [...Array(3)].map((_: any, i: any) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[18px] p-6 animate-pulse">
              <Skeleton width="100%" height={240} borderRadius={18} />
            </div>
          ))
        ) : (
          getNext7Days().map((date: any, index: any) => {
            const eventsForDay = getEventsForDate(date);
            const tasksForDay = getTasksForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            const dateStr = formatDate(date);

            return (
              <div
                key={dateStr}
                className="bg-[#F4F2F0] rounded-[18px] p-2.5 animate-card-entrance"
                style={{ animationDelay: `${index * 100 + 250}ms` }}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-4 px-3 mt-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-[#10B981] text-white' : 'bg-white text-[#1A1A1A]'}`}
                      >
                        <div className="text-xs font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-xl font-bold">
                          {date.getDate()}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#1A1A1A]">
                          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          {eventsForDay.length} event(s) • {tasksForDay.length} task(s)
                        </p>
                      </div>
                    </div>
                    {isToday && (
                      <span className="px-3 py-1.5 bg-[#10B981] text-white text-xs font-semibold rounded-full shadow-sm">
                        Today
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>

                {/* Events & Tasks Content */}
                <div className="bg-white rounded-[14px] p-5">
                  {eventsForDay.length === 0 && tasksForDay.length === 0 ? (
                    <div className="text-center py-8 text-[#9CA3AF]">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No events or tasks scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Events Section */}
                      {eventsForDay.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#3B82F6]" />
                            Events ({eventsForDay.length})
                          </h4>
                          <div className="space-y-3">
                            {eventsForDay.map((event: any) => (
                              <div
                                key={event.id}
                                className="border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div
                                      className="w-1 h-12 rounded-full"
                                      style={{ backgroundColor: event.color }}
                                    />
                                    <div className="flex-1">
                                      <h5 className="text-base font-bold text-[#1A1A1A] mb-1">
                                        {event.title}
                                      </h5>
                                      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-2">
                                        <span className="flex items-center gap-1 font-medium">
                                          <Clock className="w-3.5 h-3.5" />
                                          {event.time}
                                        </span>
                                        <span className="font-medium">•</span>
                                        <span className="font-medium">{event.venue}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                                          style={{ backgroundColor: event.color }}
                                        >
                                          {event.category}
                                        </span>
                                        <span className="text-[11px] text-[#6B7280] font-semibold">
                                          {event.participants} participants
                                        </span>
                                        <span
                                          className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shadow-sm"
                                          style={{
                                            backgroundColor: `${getStatusColor(event.status)}15`,
                                            color: getStatusColor(event.status)
                                          }}
                                        >
                                          {event.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <ActionMenu
                                    actions={[
                                      { label: 'View Details', icon: 'view', onClick: () => setViewingEvent(event) },
                                      { label: 'Edit Event', icon: 'edit', onClick: () => router.push(`/clubs-portal/events/create?id=${event.id}`) },
                                      { divider: true },
                                      { label: 'Delete Event', icon: 'delete', onClick: () => handleDeleteEvent(event), danger: true }
                                    ]}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {eventsForDay.length > 0 && tasksForDay.length > 0 && (
                        <div className="border-t border-[#F3F4F6]" />
                      )}

                      {/* Tasks Section */}
                      {tasksForDay.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#10B981]" />
                            Tasks ({tasksForDay.length})
                          </h4>
                          <div className="space-y-2">
                            {tasksForDay.map((task: any) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl hover:bg-[#F3F4F6] transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${getStatusColor(task.status)}15` }}
                                  >
                                    {task.status === 'completed' ? (
                                      <CheckCircle className="w-4 h-4" style={{ color: getStatusColor(task.status) }} />
                                    ) : (
                                      <Clock className="w-4 h-4" style={{ color: getStatusColor(task.status) }} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-bold text-[#1A1A1A] mb-0.5">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                                      <span className="font-medium text-[#10B981]">{task.time}</span>
                                      <span className="font-medium">•</span>
                                      <span className="font-medium">{task.assignedTo}</span>
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shadow-sm"
                                        style={{
                                          backgroundColor: `${getPriorityColor(task.priority)}15`,
                                          color: getPriorityColor(task.priority)
                                        }}
                                      >
                                        {task.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <ActionMenu
                                  actions={[
                                    { label: 'Edit Task', icon: 'edit', onClick: () => showToast('Edit task...', 'info') },
                                    {
                                      label: task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete',
                                      icon: 'approve',
                                      onClick: () => handleUpdateTaskStatus(task)
                                    },
                                    { divider: true },
                                    { label: 'Delete Task', icon: 'delete', onClick: () => handleDeleteTask(task), danger: true }
                                  ]}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* Add Task Modal */}
      {showAddTaskModal &&
        <Modal
          isOpen={true}
          onClose={() => setShowAddTaskModal(false)}
          title="Add New Task"
          footer={
            <div className="flex gap-3 px-[6px]">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[16px] font-normal text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-[10px] text-[16px] font-normal hover:bg-[#059669] transition-colors">
                Create Task
              </button>
            </div>
          }>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Task Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={taskFormData.title || ''}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Enter task title"
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Date <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="date"
                  value={taskFormData.date || (new Date().toISOString().split('T')[0] || '')}
                  onChange={(e) => setTaskFormData({ ...taskFormData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={taskFormData.time || ''}
                  onChange={(e) => setTaskFormData({ ...taskFormData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Priority
                </label>
                <Select value={taskFormData.priority || 'medium'} onValueChange={(val) => setTaskFormData({ ...taskFormData, priority: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={taskFormData.assignedTo || ''}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={taskFormData.description || ''}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Details regarding the task..."
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none" />
            </div>
          </div>
        </Modal>
      }

      {viewingEvent &&
        <Modal
          isOpen={true}
          onClose={() => setViewingEvent(null)}
          title="Event Details"
          size="md">

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280]">Event Title</label>
              <p className="text-base font-semibold text-[#1A1A1A] mt-1">{viewingEvent.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280]">Date</label>
                <p className="text-sm font-medium text-[#1A1A1A] mt-1">
                  {new Date(viewingEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Time</label>
                <p className="text-sm font-medium text-[#1A1A1A] mt-1">{viewingEvent.time}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280]">Category</label>
                <p className="text-sm font-medium text-[#1A1A1A] mt-1">{viewingEvent.category}</p>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Venue</label>
                <p className="text-sm font-medium text-[#1A1A1A] mt-1">{viewingEvent.venue}</p>
              </div>
            </div>
          </div>
        </Modal>
      }
    </div>
  );
}