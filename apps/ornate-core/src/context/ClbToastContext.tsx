'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/CustomToast';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export interface ClbToastContextType {
    toast: Toast | null;
    showToast: (message: string, type?: Toast['type']) => void;
    hideToast: () => void;
}

export const ClbToastContext = createContext<ClbToastContextType | undefined>(undefined);

export function ClbToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ClbToastContext.Provider value={{ toast, showToast, hideToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </ClbToastContext.Provider>
    );
}
