'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  tooltipText?: string;
}

export function ModalContainer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  tooltipText
}: ModalContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-9999" style={{ zIndex: 9999 }}>
      <div className={`bg-[#F4F2F0] rounded-[16px] ${maxWidth} w-full shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] animate-modal-entrance`}>
        {/* Header - #F4F2F0 background */}
        <div className="bg-[#F4F2F0] rounded-t-[18px] px-6 py-6" style={{ borderRadius: '18px 18px 0px 0px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[20px] font-bold text-[#1A1A1A]">{title}</h3>
              {tooltipText &&
                <InfoTooltip text={tooltipText} />
              }
            </div>
            <button
              onClick={onClose}
              className="w-[36px] h-[36px] bg-white rounded-[10px] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">

              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Content - White inner card */}
        <div className="bg-[#F4F2F0] flex-1 overflow-hidden px-6">
          <div className="bg-white rounded-[16px] p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {children}
          </div>
        </div>

        {/* Footer - #F4F2F0 background */}
        {footer &&
          <div className="bg-[#F4F2F0] rounded-b-[16px] px-6 pb-6 pt-2 mt-4">
            {footer}
          </div>
        }
      </div>
    </div>,
    document.body
  );
}