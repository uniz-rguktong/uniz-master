export type CalendarViewType = "month" | "week" | "list";

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string; // ISO format
  time: string;
  category: string;
  categoryColor: string;
  venue: string;
  registrations: number;
  capacity: number;
  description?: string;
  organizer?: string;
}

export interface EventCalendarConfig {
  title?: string;
  description?: string;
  defaultView?: CalendarViewType;
  showFilters?: boolean;
  showAddEvent?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string | number) => void;
}
