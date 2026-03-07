import type { ReactNode } from "react";

interface StandardCardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function StandardCard({
  children,
  header,
  className = "",
}: StandardCardProps) {
  return (
    <div
      className={`bg-[#F4F2F0] rounded-[16px] p-[10px] pb-[14px] flex flex-col gap-4 animate-fade-in ${className}`}
    >
      {header && <div className="px-[15px] pt-[5px]">{header}</div>}
      <div className="bg-white rounded-[16px] w-full flex-1 p-4 md:p-[25px]">
        {children}
      </div>
    </div>
  );
}
