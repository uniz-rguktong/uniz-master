"use client";
/* eslint-disable react-hooks/immutability */
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for exit animation
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!mounted) return null;

  const styles: Record<ToastType, { icon: React.ReactNode; iconBg: string }> = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />,
      iconBg: "bg-[#10B981]/20",
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-[#EF4444]" />,
      iconBg: "bg-[#EF4444]/20",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
      iconBg: "bg-[#F59E0B]/20",
    },
    info: {
      icon: <Info className="w-5 h-5 text-[#3B82F6]" />,
      iconBg: "bg-[#3B82F6]/20",
    },
  };

  const activeStyle = styles[type];

  return createPortal(
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 pl-4 pr-3 py-3 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] min-w-[320px] max-w-[90vw] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isExiting
          ? "opacity-0 translate-y-[-20px] scale-90"
          : "opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4 fade-in"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeStyle.iconBg}`}
      >
        {activeStyle.icon}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="text-[14px] font-medium text-[#1A1A1A] pr-2">
          {message}
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>,
    document.body,
  );
}
