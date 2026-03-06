import { CoordinatorProvider } from '@/context/CoordinatorContext';
import { ClbToastProvider } from '@/context/ClbToastContext';

export default function BranchAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <CoordinatorProvider>
            <ClbToastProvider>
                {children}
            </ClbToastProvider>
        </CoordinatorProvider>
    );
}
