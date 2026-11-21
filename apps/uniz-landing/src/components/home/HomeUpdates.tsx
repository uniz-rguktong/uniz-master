import { EditRegion } from "../preview/EditRegion";
import { Wrap } from "../layout/Wrap";
import { useSiteContent } from "@/components/site-context";

export function HomeUpdates() {
  const { updates, authorized, ready } = useSiteContent();
  const rows = updates.filter((item) => item.title.trim());
  if (!authorized && (!ready || rows.length === 0)) return null;

  return (
    <Wrap>
      <EditRegion region="updates" blockNavigation className="mt-8 border-t border-border pt-6">
        <h2 className="text-[15px] font-semibold leading-6 text-head">Campus updates</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-[15px] leading-6 text-text-2">No campus updates right now.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {rows.slice(0, 4).map((item) => (
              <li key={item.id || item.title} className="py-3 text-[15px] leading-6 text-text">
                <span className="font-semibold text-head">{item.title}</span>
                {item.content ? <span className="mt-1 block text-text-2">{item.content}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </EditRegion>
    </Wrap>
  );
}
