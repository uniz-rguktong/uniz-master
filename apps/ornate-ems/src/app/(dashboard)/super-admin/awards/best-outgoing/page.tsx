import { getBestOutgoingStudents } from '@/actions/awardActions';
import BestOutgoingPageClient from './BestOutgoingPageClient';

export default async function BestOutgoingPage() {
    const result = await getBestOutgoingStudents();
    const students = result.success ? JSON.parse(JSON.stringify(result.data)) : [];

    return <BestOutgoingPageClient initialStudents={students} />;
}
