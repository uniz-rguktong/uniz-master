import { apiData } from "../data/apiData";


export interface Announcement {
  text: string;
  link: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface HomeData {
  announcements: Announcement[];
  stats: Stat[];
  images: string[];
}

/**
 * Returns static homepage data compiled from the API scraper.
 */
export async function getHomeData(): Promise<HomeData> {
  // Use static data compiled at build time
  return apiData.home as unknown as HomeData;
}


export type NotificationType = "news_updates" | "tenders" | "careers";

export interface NotificationLink {
    text: string;
    url: string | null;
}

export interface Notification {
    title: string;
    date: string;
    links: NotificationLink[];
}

/**
 * Returns static notifications by type: news_updates | tenders | careers
 */
export async function getNotifications(
    type: NotificationType = "news_updates"
): Promise<Notification[]> {
    // Return statically compiled notifications
    return apiData.notifications[type] as unknown as Notification[];
}


export type InstitutePage =
    | "aboutrgukt"
    | "campuslife"
    | "edusys"
    | "govcouncil"
    | "rtiinfo"
    | "scst";

export interface InstituteSection {
    title: string;
    content: string[];
}

export interface InstituteData {
    page: string;
    sections: InstituteSection[];
    profiles: unknown[];
}

/**
 * Returns static institute info from the compiled api data.
 */
export async function getInstituteInfo(
    page: InstitutePage
): Promise<InstituteData> {
    return apiData.institute[page] as unknown as InstituteData;
}


export type DeptCode =
    | "CSE"
    | "CIVIL"
    | "ECE"
    | "EEE"
    | "ME"
    | "MATHEMATICS"
    | "PHYSICS"
    | "CHEMISTRY"
    | "IT"
    | "BIOLOGY"
    | "ENGLISH"
    | "LIB"
    | "MANAGEMENT"
    | "PED"
    | "TELUGU"
    | "YOGA";

export interface FacultyMember {
    name: string;
    email: string;
    photo: string | null;
}

export interface DepartmentData {
    dept: string;
    faculties: FacultyMember[];
}

/**
 * Returns static department faculty list from compiled API data.
 */
export async function getDepartmentStaff(
    deptCode: DeptCode,
    _deep = false
): Promise<DepartmentData> {
    // Cast index slightly because typescript strings vs. literals
    return apiData.departments[deptCode] as unknown as DepartmentData;
}
