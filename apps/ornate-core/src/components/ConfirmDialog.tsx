"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import type * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

type DialogVariant = "danger" | "success" | "warning" | "info";

type ConfirmDialogProps = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  variant?: DialogVariant;
  type?: DialogVariant;
  isOpen?: boolean;
  tooltipText?: string;
  isLoading?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  onClose,
  variant,
  type,
  isOpen = true,
  tooltipText,
  isLoading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling when dialog is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // If not mounted, closed, or totally empty, don't render
  if (!mounted || !isOpen || (!title && !message)) return null;

  // Use type or variant
  const dialogVariant: DialogVariant = type || variant || "info";

  // Use onClose or onCancel for the cancel action
  const handleCancel = onClose || onCancel || (() => {});

  const icons: Record<DialogVariant, React.ReactNode> = {
    danger: <XCircle className="w-12 h-12 text-[#EF4444]" />,
    success: <CheckCircle className="w-12 h-12 text-[#10B981]" />,
    warning: <AlertTriangle className="w-12 h-12 text-[#F59E0B]" />,
    info: <Info className="w-12 h-12 text-[#3B82F6]" />,
  };

  const buttonColors: Record<DialogVariant, string> = {
    danger: "bg-[#EF4444] hover:bg-[#DC2626]",
    success: "bg-[#10B981] hover:bg-[#059669]",
    warning: "bg-[#F59E0B] hover:bg-[#D97706]",
    info: "bg-[#3B82F6] hover:bg-[#2563EB]",
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-9999">
      <div className="bg-[#F4F2F0] rounded-[24px] max-w-md w-full animate-in fade-in zoom-in-95 duration-200 shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-2">
            <h3 className="text-[20px] font-bold text-[#1A1A1A] tracking-tight">
              {title}
            </h3>
            {tooltipText && (
              <div className="flex items-center">
                <InfoTooltip text={tooltipText} />
              </div>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="w-[36px] h-[36px] bg-white rounded-[10px] flex items-center justify-center hover:bg-gray-100 transition-all shadow-sm border border-[#E5E7EB]"
          >
            <X className="w-4 h-4 text-[#4B5563]" />
          </button>
        </div>

        {/* White Inner Card */}
        <div className="bg-[#F4F2F0] px-5 pb-8">
          <div className="bg-white rounded-[20px] p-8 shadow-sm border border-white/40">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-5 transform scale-110">
                {icons[dialogVariant]}
              </div>
              <p className="text-[15px] leading-relaxed text-[#4B5563] font-medium">
                {message}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 bg-white border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#1A1A1A] transition-all shadow-sm ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 ${buttonColors[dialogVariant]} text-white rounded-[14px] text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-wait`}
              >
                {isLoading ? "Processing..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
