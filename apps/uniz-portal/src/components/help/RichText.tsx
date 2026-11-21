import type { ReactNode } from "react";

/** Renders **bold labels** from the guide source. No other markup. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={index} className="font-semibold text-head">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }
    if (part) nodes.push(<span key={index}>{part}</span>);
  });
  return <>{nodes}</>;
}
