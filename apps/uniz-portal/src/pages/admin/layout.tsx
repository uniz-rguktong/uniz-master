import type { ReactNode } from "react";
import { LandingMeshBackdrop } from "@/components/ui/landing-section";
import { adminPageClass } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(adminPageClass, "flex-col", className)}>
      <LandingMeshBackdrop />
      {children}
    </div>
  );
}
