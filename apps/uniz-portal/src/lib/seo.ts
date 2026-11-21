import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

export const SITE_URL = "https://uniz.rguktong.in";
export const SITE_NAME = "uniZ";

/** 1200×630 PNG committed at public/og/uniz.png. Absolute URL, no user data. */
export const DEFAULT_OG_IMAGE = "https://uniz.rguktong.in/og/uniz.png";

export const HOME_SEO = {
  title: "uniZ — Campus platform for RGUKT students",
  description: `Manage academics, semester registration, outpasses, and campus updates in one place. Built for ${UNIZ_CAMPUS_LABEL} students.`,
} as const;

export const homePageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: HOME_SEO.description,
      publisher: {
        "@type": "Organization",
        name: UNIZ_CAMPUS_LABEL,
        url: "https://rguktong.in",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
    },
  ],
};
