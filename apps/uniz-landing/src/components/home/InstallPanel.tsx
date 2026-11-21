import { Button } from "../ui/button";
import { Wrap } from "../layout/Wrap";
import { ANDROID_APK_FILENAME, ANDROID_APK_URL, openLandingIosModal } from "@/lib/mobile-app";

export function InstallPanel() {
  return (
    <Wrap>
      <section className="mt-[72px] min-[821px]:mt-[112px]" aria-labelledby="install-heading">
        <div className="flex flex-col items-stretch justify-between gap-7 rounded-xl border border-border bg-panel px-6 py-8 min-[821px]:flex-row min-[821px]:items-center min-[821px]:gap-12 min-[821px]:px-16 min-[821px]:py-14">
          <div className="min-w-0">
            <h2 id="install-heading" className="font-serif text-[30px] font-normal leading-10 tracking-[-0.01em] text-head">
              The student portal on your phone
            </h2>
            <p className="mt-2.5 max-w-[520px] text-[17px] leading-[26px] text-text-2">
              Add it to your home screen and open it like an app.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 min-[821px]:w-auto min-[821px]:flex-row">
            <Button asChild size="hero" className="w-full min-[821px]:w-auto">
              <a href={ANDROID_APK_URL} download={ANDROID_APK_FILENAME}>
                Install on Android
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="hero"
              className="w-full min-[821px]:w-auto"
              onClick={openLandingIosModal}
            >
              Install on iOS
            </Button>
          </div>
        </div>
      </section>
    </Wrap>
  );
}
