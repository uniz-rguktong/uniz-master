import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

export function SiteLegalFooter() {
  return (
    <footer className="h-[50px] bg-[#EEEEEE] font-form text-[14px] font-bold tracking-[0.5px] text-[#061B33]">
      <div className="mx-auto flex h-full w-[94%] items-center justify-between gap-4">
        <p className="truncate uppercase">Copyright © {UNIZ_CAMPUS_LABEL}</p>
        <p className="hidden shrink-0 sm:block">Developed By SoftwareDevelopmentCell</p>
      </div>
    </footer>
  );
}
