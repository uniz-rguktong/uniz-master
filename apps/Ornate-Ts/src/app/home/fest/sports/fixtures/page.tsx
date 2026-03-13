import { getSportsFixturesData } from '@/lib/data/sports';
import FixturesClient from './FixturesClient';
export const revalidate = 30;

export default async function FixturesPage() {
    const sports = await getSportsFixturesData();

    return <FixturesClient sportsData={sports} />;
}
