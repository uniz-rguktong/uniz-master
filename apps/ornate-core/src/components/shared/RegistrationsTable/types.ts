import type { LucideIcon } from "lucide-react";

export type RegistrationStatus =
  | "confirmed"
  | "pending"
  | "pending-payment"
  | "pending-requirements"
  | "waitlist"
  | "waitlisted"
  | "attended"
  | "cancelled"
  | "rejected"
  | "Success" // From TransactionsTable
  | "Refunded"; // From TransactionsTable

export interface Registration {
  id: string;
  registrationId: string;
  studentName: string;
  rollNumber: string;
  email: string;
  phone: string;
  year: string;
  department?: string;
  branch?: string;
  section?: string;
  eventName: string;
  eventId: string;
  eventType: string;
  registrationDate: string;
  status: RegistrationStatus;
  paymentStatus: string;
  paymentAmount: number;
  transactionId?: string | null;
  members?: { name: string; id: string; role: string }[];
}

export interface TeamRegistration {
  id: string;
  teamCode?: string;
  teamId?: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  event: string;
  eventId: string;
  eventType: string;
  members: {
    name: string;
    rollNumber: string;
    department?: string;
    year?: string;
  }[];
  registrationDate: string;
  paymentAmount: number;
  paymentStatus: string;
  status: string;
  transactionId?: string | null;
}

export interface ColumnDefinition<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface RegistrationsTableConfig {
  title: string;
  description: string;
  role: "super-admin" | "branch-admin" | "clubs" | "sports" | "hho";
  columns: ColumnDefinition<Registration>[];
  teamColumns?: ColumnDefinition<TeamRegistration>[];
  showMetrics?: boolean;
  teamSupport?: boolean;
  exportFormats?: ("csv" | "pdf")[];
}
