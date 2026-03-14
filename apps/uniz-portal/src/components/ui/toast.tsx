'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';


import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ToasterProps {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  autoClose?: number;
  icon?: React.ReactNode;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-slate-900 border-none text-white',
  success: 'bg-[#10B981] border-none text-white',
  error: 'bg-[#EF4444] border-none text-white',
  warning: 'bg-[#F59E0B] border-none text-white',
};

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -40, scale: 0.95 },
};

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = 'top-center' }, ref) => {
    const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null);

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        autoClose,
        icon: customIcon,
        position = defaultPosition,
        actions,
        onDismiss,
      }) {
        const Icon = variantIcons[variant];
        const finalDuration = autoClose || duration;

        toastReference.current = sonnerToast.custom(
          (toastId: any) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 30
              }}
              className={cn(
                'flex flex-row items-center gap-3 w-fit max-w-[90vw] h-10 px-4 rounded-full shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] mb-4 relative overflow-hidden',
                variantStyles[variant]
              )}
            >
              {customIcon ? (
                <div className="flex-shrink-0 text-white flex items-center justify-center">
                  {customIcon}
                </div>
              ) : (
                <Icon className="h-4 w-4 flex-shrink-0 text-white" />
              )}

              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[12px] text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                  {title ? `${title}: ${message}` : message}
                </p>
              </div>

              {actions?.label && (
                <button
                  onClick={() => {
                    actions.onClick();
                    sonnerToast.dismiss(toastId);
                  }}
                  className="text-[11px] font-black uppercase text-white hover:text-white/80 transition-colors pr-2 whitespace-nowrap"
                >
                  {actions.label}
                </button>
              )}

              <button
                onClick={() => {
                  sonnerToast.dismiss(toastId);
                  onDismiss?.();
                }}
                className="flex-shrink-0 hover:bg-white/10 p-1 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </motion.div>
          ),
          { duration: finalDuration, position }
        );
      },
    }));

    return (
      <SonnerToaster
        position={defaultPosition}
        className="flex justify-center"
        toastOptions={{
          unstyled: true,
          className: 'z-[9999] flex justify-center w-full'
        }}
      />
    );
  }
);

export default Toaster;
