import { useState, type ReactNode } from "react";

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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={encodeURI(decodeURI(src))}
      alt={name}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
