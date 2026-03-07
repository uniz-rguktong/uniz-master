"use client";

import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  Share2,
  Archive,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Settings,
  Send,
  FileText,
  Upload,
  Award,
} from "lucide-react";

const iconMap: Record<string, any> = {
  edit: Edit,
  delete: Trash2,
  copy: Copy,
  view: Eye,
  download: Download,
  share: Share2,
  archive: Archive,
  star: Star,
  approve: CheckCircle,
  reject: XCircle,
  pending: Clock,
  users: Users,
  settings: Settings,
  send: Send,
  details: FileText,
  upload: Upload,
  award: Award,
};

type ActionIcon = keyof typeof iconMap;
type ActionMenuSize = "sm" | "md" | "lg";

type ActionMenuItem = {
  label?: string;
  icon?: ActionIcon;
  divider?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

type ActionMenuProps = {
  actions: ActionMenuItem[];
  size?: ActionMenuSize;
};

export function ActionMenu({ actions, size = "md" }: ActionMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-2.5",
  };

  // Don't render during SSR to avoid hydration mismatch with Radix UI IDs
  if (!mounted) {
    return (
      <button
        className={`${buttonSizeClasses[size]} hover:bg-[#F3F4F6] rounded-lg transition-colors focus:outline-none`}
      >
        <MoreVertical className={`${sizeClasses[size]} text-[#6B7280]`} />
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`${buttonSizeClasses[size]} hover:bg-[#F3F4F6] rounded-lg transition-colors focus:outline-none`}
        >
          <MoreVertical className={`${sizeClasses[size]} text-[#6B7280]`} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[192px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-100 animate-in fade-in-0 zoom-in-95"
          align="end"
          sideOffset={5}
        >
          {actions.map((action: any, index: any) => {
            const Icon = action.icon ? iconMap[action.icon] : null;

            if (action.divider) {
              return (
                <DropdownMenu.Separator
                  key={index}
                  className="h-px bg-[#E5E7EB] my-1"
                />
              );
            }

            return (
              <DropdownMenu.Item
                key={index}
                onClick={() => {
                  if (action.onClick) action.onClick();
                }}
                className={`flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-[#F7F8FA] transition-colors cursor-pointer focus:bg-[#F7F8FA] focus:outline-none ${action.danger ? "text-[#EF4444]" : "text-[#1A1A1A]"}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{action.label}</span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
