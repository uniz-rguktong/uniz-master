import { ClbToastProvider } from '@/context/ClbToastContext';

export default function HHOLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClbToastProvider>
            {children}
        </ClbToastProvider>
    );
}
