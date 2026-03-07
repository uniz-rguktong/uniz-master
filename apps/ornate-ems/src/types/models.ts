/**
 * Shared Domain Model Types
 *
 * Lightweight "summary" and "detail" interfaces that represent the shapes
 * actually consumed by the UI.  They are NOT 1:1 with Prisma models —
 * they only carry the fields components need, keeping serialisation fast
 * and bundle sizes small.
 *
 * Many of these mirror the `Formatted*` interfaces that already live in
 * individual action files (e.g. `FormattedRegistration` in registrationGetters,
 * `FormattedAnnouncement` in announcementActions).  Over time, action files
 * should re-export from here instead of defining their own copies.
 *
 * Usage:
 *   import type { EventSummary, AdminProfile } from '@/types/models';
 */

import type {
  UserRole,
  RegistrationStatus,
  PaymentStatus,
} from "@/lib/generated/client";

// ============================================================================
// Admin / User
// ============================================================================

/** Minimal admin shape used across dashboard UIs. */
export interface AdminProfile {
  id: string;
  name: string | null;
  email: string;
  role: UserRole | string;
  branch: string | null;
  clubId: string | null;
  profilePicture: string | null;
  phone: string | null;
  designation: string | null;
  bio: string | null;
}

/** Formatted admin for user management tables. */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  initial: string;
  color: string;
}

/** The coordinator row shown in coordinator assignment UIs. */
export interface CoordinatorSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvent: string;
  status: string;
}

/** Audit log entry displayed in security/audit pages. */
export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

// ============================================================================
// Events
// ============================================================================

/** Minimal event shape for lists / cards. */
export interface EventSummary {
  id: string;
  title: string;
  date: string;
  venue: string;
  category: string | null;
  posterUrl: string | null;
  maxCapacity: number | null;
  registrationOpen: boolean;
  status: string;
  registrationsCount: number;
}

/** Calendar-specific event representation (used by EventCalendar component). */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  categoryColor: string;
  venue: string;
  registrations: number;
  capacity: number | null;
  posterUrl: string | null;
  description: string | null;
}

/** Lightweight event used in filter dropdowns. */
export interface EventFilterItem {
  id: string;
  title: string;
  category: string | null;
}

/** Today's events widget on the super-admin dashboard. */
export interface TodayEvent {
  id: string;
  title: string;
  venue: string;
  date: string;
  category: string | null;
  status: string | null;
  time: string;
  portal: string | null;
}

// ============================================================================
// Registrations
// ============================================================================

/** Full formatted registration row (tables, exports). */
export interface RegistrationSummary {
  id: string;
  registrationId: string;
  studentName: string;
  email: string;
  rollNumber: string;
  year: string;
  department: string;
  phone: string;
  eventName: string;
  eventType: string;
  registrationDate: string;
  confirmationDate?: string;
  lastUpdate?: string;
  status: string;
  attendanceMarked?: boolean;
  certificateIssued?: boolean;
  eventId: string;
  type?: string;
  paymentAmount?: number | null;
  transactionId?: string | null;
  paymentScreenshot?: string | null;
  paymentStatus?: string;
  priority?: string;
}

/** Waitlisted registration with queue info. */
export interface WaitlistEntry {
  id: string;
  eventName: string;
  category: string | null;
  date: string;
  venue: string;
  registrations: number;
  capacity: number | null;
  waitlistPosition: number;
  registrationDate: string;
}

// ============================================================================
// Teams
// ============================================================================

/** A single member row inside a team. */
export interface TeamMemberEntry {
  id: string;
  name: string;
  studentId: string;
  year: string;
  section: string;
  role: string;
  phoneNumber: string;
}

/** Team card / table row used in sports portal. */
export interface TeamSummary {
  id: string;
  teamName: string;
  sport: string;
  sportColor: string;
  captain: string;
  viceCaptain: string;
  yearLevel: string;
  status: string;
  registeredDate: string;
  members: TeamMemberEntry[];
  eventId: string;
}

// ============================================================================
// Matches / Fixtures
// ============================================================================

/** Match row in the fixtures bracket / table views. */
export interface MatchSummary {
  id: string;
  sport: string;
  gender: string;
  round: string;
  matchId: string | null;
  team1Id: string | null;
  team1Name: string | null;
  team2Id: string | null;
  team2Name: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  status: string;
  score1: string | null;
  score2: string | null;
  winner: string | null;
  note: string | null;
  referee: string | null;
}

// ============================================================================
// Announcements
// ============================================================================

/** Announcement row in lists / cards. */
export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  targetAudience: string;
  isPinned: boolean;
  status: string;
  viewCount: number;
  createdBy: string;
  createdDate: string;
  expiryDate: string;
  categoryColor: string;
}

// ============================================================================
// Gallery
// ============================================================================

/** Image inside an album. */
export interface GalleryImageEntry {
  id: string;
  url: string;
  caption: string;
  albumId: string;
  uploadedAt: string;
}

/** Album card / grid item. */
export interface GalleryAlbumSummary {
  id: string;
  title: string;
  name: string;
  description: string;
  photoCount: number;
  dateCreated: string;
  lastUpdated: string;
  visibility: string;
  coverImage: string;
  isArchived: boolean;
  createdBy: string;
  images: GalleryImageEntry[];
}

// ============================================================================
// Certificates
// ============================================================================

/** Event row in the certificate management page. */
export interface CertificateEvent {
  id: string;
  title: string;
  date: string;
  certificateStatus: string;
  certificateTheme: string;
  certificateTemplates: unknown;
  certificateIssuedAt: string | null;
  registrationsCount: number;
}

/** Theme option for the certificate designer. */
export interface CertificateTheme {
  id: string;
  name: string;
  preview: string;
  style: string;
  colors: string[];
}

// ============================================================================
// Promo / Branding
// ============================================================================

/** Promotional video row. */
export interface PromoVideoSummary {
  id: string;
  title: string;
  url: string;
  platform: string;
  thumbnail: string | null;
  status: string;
  views: number;
  duration: string;
  uploadDate: string;
  createdAt: string;
}

/** Brand logo row. */
export interface BrandLogoSummary {
  id: string;
  name: string;
  type: string;
  format: string;
  size: string;
  dimensions: string;
  url: string;
  thumbnail: string | null;
  status: string;
  uploadDate: string;
}

// ============================================================================
// Winners
// ============================================================================

/** Winner announcement row used in events/winners page. */
export interface WinnerAnnouncementSummary {
  id: string;
  eventId: string;
  isPublished: boolean;
  publishedAt: string | null;
  positions: unknown;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    category: string | null;
    date: string;
  } | null;
}

// ============================================================================
// Notifications
// ============================================================================

/** Notification row in the inbox / sent view. */
export interface NotificationEntry {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderBranch: string | null;
  recipientId: string;
  recipientName: string | null;
  recipientRole: string | null;
  message: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: string;
  type: string;
  createdAt: string;
}

// ============================================================================
// Tasks
// ============================================================================

/** Task row in the coordinator task lists. */
export interface TaskSummary {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  assignedTo: string;
  priority: string;
  status: string;
  creatorId: string;
  createdAt: string;
}

// ============================================================================
// Sports
// ============================================================================

/** Formatted sport for the sports admin grid/table. */
export interface SportSummary {
  id: string;
  name: string;
  category: string | null;
  type: string;
  poster: string | null;
  venue: string;
  date: string;
  time: string;
  registrations: number;
  capacity: number | null;
  winnerPoints: number;
  runnerPoints: number;
  status: string;
  isArchived: boolean;
  isDraft: boolean;
}

/** Sports portal dashboard statistics widget. */
export interface SportsDashboardStats {
  totalSports: number;
  activeTournaments: number;
  totalRegistrations: number;
  matchesCompleted: number;
  categoryBreakdown: { category: string; value: number; color: string }[];
}

// ============================================================================
// Dashboard (Super Admin)
// ============================================================================

/** Stats card data for the super-admin dashboard. */
export interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  pendingApprovals: number;
  activeAnnouncements: number;
}

/** Single data-point in the 7-day registration trend chart. */
export interface RegistrationTrendPoint {
  name: string;
  total: number;
}

/** Portal performance widget row. */
export interface PortalPerformance {
  name: string;
  events: number;
  score: number;
  gallery: number;
  updates: number;
}

// ============================================================================
// Import / Export History
// ============================================================================

export interface ImportHistoryItem {
  id: string;
  filename: string;
  importDate: string;
  records: number;
  successful: number;
  failed: number;
  status: string;
}

export interface ExportHistoryItem {
  id: string;
  name: string;
  createdAt: Date;
  size: string;
  url: string;
}
