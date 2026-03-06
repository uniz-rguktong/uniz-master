'use client';
import { CertificatesPage } from '@/components/shared/Certificates';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
    const { data: session } = useSession();
    const router = useRouter();
    const isBranchSportsAdmin = session?.user?.role === 'BRANCH_SPORTS_ADMIN';

    useEffect(() => {
        if (isBranchSportsAdmin) {
            router.push('/sports/all-sports');
        }
    }, [isBranchSportsAdmin, router]);

    if (isBranchSportsAdmin) return null;

    return <CertificatesPage variant="sports" />;
}
