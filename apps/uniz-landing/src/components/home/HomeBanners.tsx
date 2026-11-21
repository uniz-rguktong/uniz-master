import { EditRegion } from "../preview/EditRegion";
import { Wrap } from "../layout/Wrap";
import { useSiteContent } from "@/components/site-context";

export function HomeBanners() {
  const { banners, authorized, ready } = useSiteContent();
  if (!authorized && (!ready || banners.length === 0)) return null;

  return (
    <Wrap>
      <EditRegion region="banners" blockNavigation className="border-b border-border py-4">
        <h2 className="text-[13px] font-semibold leading-5 text-text-3">Banners</h2>
        {banners.length === 0 ? (
          <p className="mt-2 text-[14px] leading-5 text-text-3">No home banners</p>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {banners.map((banner) => (
              <li key={banner.id || banner.title} className="flex min-w-0 gap-3">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-16 w-24 shrink-0 rounded-md bg-tint-2" />
                )}
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-6 text-head">{banner.title}</p>
                  <p className="text-[14px] leading-5 text-text-2">{banner.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </EditRegion>
    </Wrap>
  );
}
