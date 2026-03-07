"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmButtonClass?: string;
  tooltipText?: string;
  hideHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  onConfirm,
  confirmText = "Confirm",
  confirmButtonClass = "bg-[#1A1A1A] hover:bg-[#374151]",
  tooltipText,
  hideHeader,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  // Default footer if onConfirm is provided but no custom footer
  const defaultFooter = onConfirm ? (
    <div className="flex justify-end gap-4">
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[15px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className={`px-6 py-2.5 rounded-[12px] text-[15px] font-medium text-white transition-all shadow-md active:scale-95 ${confirmButtonClass}`}
      >
        {confirmText}
      </button>
    </div>
  ) : null;

  const modalFooter = footer || defaultFooter;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-9999"
      style={{ zIndex: 9999 }}
    >
      <div
        className={`bg-[#F4F2F0] rounded-[24px] w-full ${sizeClasses[size]} shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col max-h-[95vh] md:max-h-[90vh] animate-modal-entrance overflow-hidden border border-white/20 mx-2 md:mx-0`}
      >
        {/* Header - #F4F2F0 background */}
        {!hideHeader && (
          <div className="bg-[#F4F2F0] rounded-t-[18px] px-5 py-5 md:px-8 md:py-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] md:text-[22px] font-bold text-[#1A1A1A] tracking-tight truncate">
                  {title}
                </h2>
                {tooltipText && (
                  <div className="flex items-center shrink-0">
                    <InfoTooltip text={tooltipText} />
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 md:w-[40px] md:h-[40px] bg-white rounded-[10px] md:rounded-[12px] flex items-center justify-center hover:bg-gray-100 transition-all shadow-sm border border-[#E5E7EB] hover:scale-105 active:scale-95 shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-[#4B5563]" />
              </button>
            </div>
          </div>
        )}

        {/* Content - White inner card */}
        <div
          className={`bg-[#F4F2F0] flex-1 overflow-hidden px-3 md:px-5 ${!modalFooter ? "pb-5 md:pb-8" : "pb-1 md:pb-2"}`}
        >
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-8 overflow-y-auto max-h-[calc(90vh-160px)] shadow-sm border border-white/40 custom-scrollbar">
            {children}
          </div>
        </div>

        {/* Footer - #F4F2F0 background */}
        {modalFooter && (
          <div className="bg-[#F4F2F0] rounded-b-[18px] px-3 md:px-5 pb-4 md:pb-6 pt-2 md:pt-3">
            {modalFooter}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
