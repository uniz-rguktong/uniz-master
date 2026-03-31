import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  schema?: any;
}

export function SEO({ title, description, canonical, schema }: SEOProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title;
    }

    // 2. Meta Description
    if (description) {
      let metaDesc: HTMLMetaElement | null = document.querySelector(
        "meta[name='description']",
      );
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // 3. Canonical Link
    const defaultCanonical = `https://uniz.rguktong.in${pathname}`;
    const canonicalUrl = canonical || defaultCanonical;

    let linkCanonical: HTMLLinkElement | null = document.querySelector(
      "link[rel='canonical']",
    );
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonicalUrl;

    // 4. JSON-LD Breadcrumbs (Auto-generated if schema not provided, but we can just use schema prop)
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
          item: `https://uniz.rguktong.in/${arr.slice(0, index + 1).join("/")}`,
        })),
    };

    const finalSchema = schema || breadcrumbSchema;

    let scriptSchema: HTMLScriptElement | null = document.querySelector(
      "#dynamic-schema-route",
    );
    if (!scriptSchema) {
      scriptSchema = document.createElement("script");
      scriptSchema.id = "dynamic-schema-route";
      scriptSchema.type = "application/ld+json";
      document.head.appendChild(scriptSchema);
    }
    scriptSchema.innerText = JSON.stringify(finalSchema);

    // Cleanup
    return () => {
      // Optional cleanup
      // scriptSchema?.remove();
    };
  }, [pathname, title, description, canonical, schema]);

  return null;
}
