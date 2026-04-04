const BASE_URL = "https://landing-api.rguktong.in";

async function fetchJson<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { accept: "application/json" }
        });
        if (!res.ok) {
            console.warn(`Warn: Failed to fetch ${endpoint} - ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        return null;
    }
}

// ─── HOME ────────────────────────────────────────────────────────

export interface Announcement {
    text: string;
    link: string | null;
}

export interface Stat {
    label: string;
    value: string;
}

export interface HomeData {
    announcements: Announcement[];
    stats: Stat[];
    images: string[];
    explore_campus?: any[];
}

export async function getHomeData(): Promise<HomeData> {
    const data = await fetchJson<HomeData>("/api/home/");
    return data || { announcements: [], stats: [], images: [] };
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────

export type NotificationType = "news_updates" | "tenders" | "careers";

/** Backend LinkItem-Output schema uses `label` (not `text`) */
export interface NotificationLink {
    label: string;
    url: string | null;
}

export interface Notification {
    title: string;
    date: string;
    links: NotificationLink[];
}

export async function getNotifications(
    type: NotificationType = "news_updates"
): Promise<Notification[]> {
    const data = await fetchJson<Notification[]>(`/api/notifications/?type=${type}`);
    return data || [];
}

// ─── INSTITUTE ───────────────────────────────────────────────────

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

export interface InstituteProfile {
    name: string;
    photo: string | null;
    text: string[];
}

export interface InstituteData {
    page: string;
    sections: InstituteSection[];
    profiles: InstituteProfile[];
}

export async function getInstituteInfo(
    page: InstitutePage
): Promise<InstituteData | null> {
    return await fetchJson<InstituteData>(`/api/institute/${page}`);
}

// ─── ACADEMICS ───────────────────────────────────────────────────

export type AcademicPageType =
    | "AcademicPrograms"
    | "AcademicCalender"
    | "AcademicRegulations"
    | "curicula";

export interface AcademicLink {
    label: string;
    url: string | null;
}

export interface AcademicSection {
    header: string;
    links: AcademicLink[];
}

export async function getAcademicPage(
    page: AcademicPageType
): Promise<AcademicSection[]> {
    const data = await fetchJson<AcademicSection[]>(`/api/academics/${page}`);
    return data || [];
}

// ─── DEPARTMENTS ─────────────────────────────────────────────────

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
    bio: Record<string, unknown>;
}

export interface DepartmentData {
    dept: DeptCode;
    faculties: FacultyMember[];
}

export async function getDepartmentStaff(
    deptCode: DeptCode
): Promise<DepartmentData | null> {
    return await fetchJson<DepartmentData>(`/api/departments/${deptCode}`);
}
