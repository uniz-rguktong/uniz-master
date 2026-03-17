import type { Metadata } from 'next';
import EnergyGuideClient from './EnergyGuideClient';

export const metadata: Metadata = {
    title: 'Energy Guide — Mastering the Neon Core | Ornate Archives',
    description: 'Learn how to earn Neon Energy Units, increase your rank, and power your planet.',
};

export default function EnergyGuidePage() {
    return <EnergyGuideClient />;
}
