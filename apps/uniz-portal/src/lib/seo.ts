import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

export const SITE_URL = "https://uniz.rguktong.in";
export const SITE_NAME = "uniZ";

/** 1200×630 JPG for link previews — no colons in URL (breaks some crawlers). */
export const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/diipfzmyj/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/v1773551873/91566992797-modified-removebg-preview-modified_t0cqyr.png";

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
