import raw from "./official-pages.json";

export type PersonCard = {
  name: string;
  role: string;
  photo: string | null;
  lines: string[];
  bio: string[];
};

export type ContactSection = {
  title: string;
  headers: string[];
  rows: string[][];
  address: string[];
};

export type ContentGroup = {
  group?: string;
  title?: string;
  note?: string | null;
  items?: Array<{
    title?: string;
    label?: string;
    image?: string | null;
    href: string;
  }>;
};

export type OfficialDoc = {
  title: string;
  eyebrow: string;
  description?: string;
  kind: "people" | "contact" | "gallery" | "figure" | "links" | "departments";
  people?: PersonCard[];
  address?: string[];
  addressTitle?: string;
  sections?: ContactSection[];
  groups?: ContentGroup[];
  image?: string | null;
  imageAlt?: string;
  paragraphs?: { heading?: string; text: string }[];
  links?: { label: string; href: string; external?: boolean }[];
  /** Text links, the same weight as the rest of the page. */
  plainLinks?: boolean;
};

export type CampusSlide = { src: string; alt: string };

export type ExploreCard = {
  image: string | null;
  alt: string;
  href: string;
  title: string;
  text: string;
};

type Bundle = {
  pages: Record<string, OfficialDoc>;
  home: {
    carousel: CampusSlide[];
    explore: ExploreCard[];
    campuses: { label: string; href: string }[];
    tagline: string;
  };
};

const bundle = raw as Bundle;

export const officialPages = bundle.pages;
export const officialHome = bundle.home;

export function officialDoc(path: string): OfficialDoc | null {
  return officialPages[path] ?? null;
}
