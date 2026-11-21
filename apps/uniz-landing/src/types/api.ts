import { apiData } from "../data/apiData";
import { DEFAULT_CONTACT, DEFAULT_HERO } from "@/lib/site-defaults";
import type { ContactCopy, HeroCopy } from "@/lib/preview-protocol";

// Same-origin in prod (rguktong.in/api → landing backend via ingress). Override for local dev.
const BASE_URL = import.meta.env.VITE_LANDING_API_URL ?? "";
const PORTAL_API = import.meta.env.VITE_PORTAL_API_URL ?? "https://uniz.rguktong.in/api/v1";

const institutePages = apiData.institute as unknown as Record<string, InstituteData>;
const departmentPages = apiData.departments as unknown as Record<string, DepartmentData>;
const academicPages = apiData.academics as unknown as Record<string, AcademicSection[]>;
const notificationPages = apiData.notifications as unknown as Record<
  NotificationType,
  Notification[]
>;

function resolveUrl(endpoint: string) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    return `${BASE_URL}${endpoint}`;
}

async function fetchJson<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(resolveUrl(endpoint), {
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

export interface ExploreCampusCard {
    title?: string;
    name?: string;
    description?: string;
    image?: string;
    url?: string;
}

export interface HomeData {
    announcements: Announcement[];
    stats: Stat[];
    images: string[];
    hero: HeroCopy;
    contact: ContactCopy;
    explore_campus?: ExploreCampusCard[];
}

export interface PublicBanner {
    id?: string;
    title: string;
    text: string;
    imageUrl: string;
    isVisible?: boolean;
}

export interface CampusUpdate {
    id?: string;
    title: string;
    content: string;
    link?: string | null;
    isVisible?: boolean;
}

export interface FeedItem {
    title: string;
    date?: string;
    desc?: string;
    links?: NotificationLink[];
}

function textOr(value: string | undefined, fallback: string) {
    return typeof value === "string" ? value : fallback;
}

export function normalizeHome(data: Partial<HomeData> | null | undefined): HomeData {
    const home = data ?? {};
    return {
        announcements: Array.isArray(home.announcements) ? home.announcements.map((item) => ({ ...item })) : [],
        stats: Array.isArray(home.stats) ? home.stats.map((item) => ({ ...item })) : [],
        images: Array.isArray(home.images) ? [...home.images] : [],
        hero: {
            eyebrow: textOr(home.hero?.eyebrow, DEFAULT_HERO.eyebrow),
            title: textOr(home.hero?.title, DEFAULT_HERO.title),
            subtitle: textOr(home.hero?.subtitle, DEFAULT_HERO.subtitle),
        },
        contact: {
            address: textOr(home.contact?.address, DEFAULT_CONTACT.address),
            phone: textOr(home.contact?.phone, DEFAULT_CONTACT.phone),
            email: textOr(home.contact?.email, DEFAULT_CONTACT.email),
        },
    };
}

function homeFromSnapshot(): HomeData {
    const home = apiData.home;
    return normalizeHome({
        announcements: home.announcements.map((a) => ({ ...a })),
        stats: home.stats.map((s) => ({ ...s })),
        images: [...home.images],
    });
}

export async function getHomeData(): Promise<HomeData> {
    const data = await fetchJson<Partial<HomeData>>("/api/home/");
    if (data) return normalizeHome(data);
    return homeFromSnapshot();
}

export async function getPublicBanners(): Promise<PublicBanner[]> {
    const data = await fetchJson<{ banners?: PublicBanner[] }>(`${PORTAL_API}/cms/banners/public`);
    if (!data || !Array.isArray(data.banners)) return [];
    return data.banners.filter((banner) => banner && banner.isVisible !== false && banner.imageUrl);
}

export async function getCampusUpdates(): Promise<CampusUpdate[]> {
    const data = await fetchJson<{ notifications?: { updates?: CampusUpdate[] } }>(
        `${PORTAL_API}/cms/notifications`,
    );
    const updates = data?.notifications?.updates;
    if (!Array.isArray(updates)) return [];
    return updates.filter((item) => item && item.isVisible !== false && item.title);
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
    if (data) return data;
    return notificationPages[type] ?? [];
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
    const data = await fetchJson<InstituteData>(`/api/institute/${page}`);
    if (data) return data;
    return institutePages[page] ?? null;
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
    if (data) return data;
    return academicPages[page] ?? [];
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
    const data = await fetchJson<DepartmentData>(`/api/departments/${deptCode}`);
    if (data) return data;
    return departmentPages[deptCode] ?? null;
}
