import SidebarWrapper from '@/components/SidebarWrapper';
import CompanionBotWrapper from '@/components/CompanionBotWrapper';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            {/* Mobile Smart Sidebar Menu (Global for all /home routes) */}
            <SidebarWrapper />
            <CompanionBotWrapper />
        </>
    );
}
