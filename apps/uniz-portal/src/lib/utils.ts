import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Custom type sizes must not be treated as text colours, or they
      // drop `text-on-primary` / `text-primary-foreground` on buttons.
      "font-size": [
        {
          text: [
            "display",
            "page",
            "h2",
            "h3",
            "lede",
            "body",
            "dense",
            "small",
            "caption",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
