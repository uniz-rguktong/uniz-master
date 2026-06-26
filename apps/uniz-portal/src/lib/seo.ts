export const SITE_URL = "https://uniz.rguktong.in";
export const SITE_NAME = "uniZ";

/** 1200×630 card for link previews (Cloudinary transform on brand asset). */
export const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/diipfzmyj/image/upload/c_fill,w_1200,h_630,bo_48px_solid_rgb:fafafa/v1773551873/91566992797-modified-removebg-preview-modified_t0cqyr.png";

export const HOME_SEO = {
  title: "uniZ — Campus platform for RGUKT students",
  description:
    "Manage academics, semester registration, outpasses, and campus updates in one place. Built for RGUKT Ongole students.",
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
        name: "RGUKT Ongole",
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
