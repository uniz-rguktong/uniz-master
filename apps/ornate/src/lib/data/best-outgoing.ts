import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type BestOutgoingData = {
    id: string;
    name: string;
    rollNumber: string;
    photo: string | null;
    branch: string;
    year: string;
    cgpa: number;
    achievements: string[];
    company: string | null;
    gender: string;
    awardYear: number;
    isOverall: boolean;
};

export const getBestOutgoingStudents = unstable_cache(
    async (): Promise<BestOutgoingData[]> => {
        const students = await prisma.bestOutgoingStudent.findMany({
            where: { isPublished: true },
            select: {
                id: true,
                name: true,
                rollNumber: true,
                photo: true,
                branch: true,
                year: true,
                cgpa: true,
                achievements: true,
                company: true,
                gender: true,
                awardYear: true,
                isOverall: true,
            },
            orderBy: [{ isOverall: 'desc' }, { cgpa: 'desc' }],
            take: 20,
        });

        return students.map((s) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            photo: s.photo,
            branch: s.branch,
            year: s.year,
            cgpa: s.cgpa,
            achievements: s.achievements,
            company: s.company,
            gender: s.gender,
            awardYear: s.awardYear,
            isOverall: s.isOverall,
        }));
    },
    ['best-outgoing'],
    { tags: ['best-outgoing'], revalidate: 300 }
);
