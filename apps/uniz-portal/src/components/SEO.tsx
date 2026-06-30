import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  schema?: unknown;
}

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function SEO({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  schema,
}: SEOProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = title || `${SITE_NAME} — Campus platform for RGUKT students`;
    const pageDescription =
      description ||
      "Manage academics, semester registration, outpasses, and campus updates in one place.";

    document.title = pageTitle;
    upsertMeta("name", "description", pageDescription);

    const canonicalUrl = canonical || `${SITE_URL}${pathname === "/" ? "" : pathname}`;
    let linkCanonical = document.querySelector<HTMLLinkElement>(
      "link[rel='canonical']",
    );
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonicalUrl;

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "en_IN");
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", pageDescription);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:type", "image/jpeg");
    upsertMeta("property", "og:image:alt", `${SITE_NAME} — ${UNIZ_CAMPUS_LABEL} campus portal`);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", type);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", pageDescription);
    upsertMeta("name", "twitter:image", image);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: pathname
        .split("/")
        .filter(Boolean)
        .map((part, index, arr) => ({
          "@type": "ListItem",
          position: index + 1,
          name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
          item: `${SITE_URL}/${arr.slice(0, index + 1).join("/")}`,
        })),
    };

    const finalSchema = schema || breadcrumbSchema;

    let scriptSchema = document.querySelector<HTMLScriptElement>(
      "#dynamic-schema-route",
    );
    if (!scriptSchema) {
      scriptSchema = document.createElement("script");
      scriptSchema.id = "dynamic-schema-route";
      scriptSchema.type = "application/ld+json";
      document.head.appendChild(scriptSchema);
    }
    scriptSchema.innerText = JSON.stringify(finalSchema);
  }, [pathname, title, description, canonical, image, type, schema]);

  return null;
}
