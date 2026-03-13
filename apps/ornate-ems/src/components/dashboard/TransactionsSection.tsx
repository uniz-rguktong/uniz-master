'use client';
import dynamic from 'next/dynamic';
import { SkeletonLoader } from '@/components/SkeletonLoader';

const TransactionsTable = dynamic(
    () => import('@/components/TransactionsTable').then(mod => mod.TransactionsTable),
    {
        loading: () => <div className="h-100"><SkeletonLoader /></div>, // Approximate height
        ssr: false
    }
);

interface TransactionsSectionProps {
    transactions: unknown[] | undefined;
    events: unknown[] | undefined;
    branches?: string[];
    allowEdit?: boolean;
}

export function TransactionsSection({ transactions, events, branches, allowEdit = true }: TransactionsSectionProps) {
    return (
        <div className="animate-card-entrance" style={{ animationDelay: '240ms' }}>
            <TransactionsTable
                transactions={transactions as any}
                events={events as any}
                branches={branches}
                allowEdit={allowEdit}
            />
        </div>
    );
}
