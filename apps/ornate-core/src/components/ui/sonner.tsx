"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const toasterTheme: ToasterProps["theme"] =
  theme === "light" || theme === "dark" || theme === "system" ?
  theme :
  "system";

  return (
    <Sonner
      theme={toasterTheme}
      className="toaster group"
      position="top-center"
      closeButton
      offset="24px"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#1A1A1A] group-[.toaster]:border-[#E5E7EB] group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group-[.toaster]:rounded-[10px] group-[.toaster]:py-3 group-[.toaster]:pl-4 group-[.toaster]:pr-10 group-[.toaster]:gap-4 group-[.toaster]:min-w-[320px] group-[.toaster]:flex group-[.toaster]:items-center",
          title: "group-[.toast]:text-[14px] group-[.toast]:font-medium group-[.toast]:text-[#1A1A1A]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[#6B7280] group-[.toast]:border-none group-[.toast]:!shadow-none group-[.toast]:hover:text-[#1A1A1A] group-[.toast]:hover:bg-gray-100 group-[.toast]:absolute group-[.toast]:top-1/2 group-[.toast]:-translate-y-1/2 group-[.toast]:right-3 group-[.toast]:w-7 group-[.toast]:h-7 group-[.toast]:p-1.5 group-[.toast]:rounded-full group-[.toast]:transition-all",
        },
      }}
      icons={{
        success: (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#10B981]/20">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
        ),
        error: (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#EF4444]/20">
            <XCircle className="w-5 h-5 text-[#EF4444]" />
          </div>
        ),
        warning: (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#F59E0B]/20">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
        ),
        info: (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#3B82F6]/20">
            <Info className="w-5 h-5 text-[#3B82F6]" />
          </div>
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };