import { Wrap } from "../layout/Wrap";
import { EditableText, EditRegion } from "../preview/EditRegion";
import { useSiteContent } from "@/components/site-context";

export function AnnouncementTicker() {
  const { announcements, authorized, ready } = useSiteContent();
  const items = announcements.filter((item) => item.text.trim());
  if (!authorized && (!ready || items.length === 0)) return null;

  return (
    <EditRegion region="ticker" className="border-b border-border bg-surface">
      <Wrap className="flex items-baseline gap-4 py-2.5">
        <p className="shrink-0 text-[13px] font-semibold leading-5 text-accent">Announcements</p>
        {items.length === 0 ? (
          <p className="text-[14px] leading-5 text-text-3">No announcements</p>
        ) : (
          <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1">
            {announcements.map((item, index) =>
              item.text.trim() ? (
                <li key={`${item.text}-${index}`} className="text-[14px] leading-5 text-text">
                  {authorized ? (
                    <EditableText
                      region="ticker-item"
                      value={item.text}
                      patchValue={(text) => ({ index, text })}
                    />
                  ) : item.link ? (
                    <a href={item.link} className="hover:underline">
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </li>
              ) : null,
            )}
          </ul>
        )}
      </Wrap>
    </EditRegion>
  );
}
