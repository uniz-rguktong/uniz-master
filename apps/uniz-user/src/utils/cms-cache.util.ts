export const CMS_PUBLIC_CACHE_TTL_SEC = 45;

export function publicBannersCacheKey(): string {
  return "cms:public:banners:v1";
}

export function publicNotificationsCacheKey(): string {
  return "cms:public:notifications:v1";
}
