import { HomeSidebar } from '@/components/home/HomeSidebar';
import CompanionBotWrapper from '@/components/CompanionBotWrapper';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            {/* National Navigation Sidebar (Global for all /home routes) */}
            <HomeSidebar />
            <CompanionBotWrapper />
        </>
    );
}
