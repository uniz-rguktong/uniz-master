import { useEffect, useState, type ReactNode } from "react";

// Initials from a name like "Mr. Krishna ManamM.Tech" -> "KM".
export function initials(name: string): string {
  const words = (name ?? "")
    .replace(/\b(mrs|mr|ms|dr|prof|smt|sri)\.?\s*/gi, " ")
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?");
}

// Renders the photo, or the fallback when the URL is missing or fails to load.
export function PersonPhoto({
  src,
  name,
  className,
  style,
  fallback,
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={encodeURI(decodeURI(src))}
      alt={name}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
