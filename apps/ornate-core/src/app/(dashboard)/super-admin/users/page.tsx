
import UsersClient from './UsersClient';
import type { Metadata } from 'next';
import { getAdminUsers, getStudentUsers, getSuperAdminStats } from '@/actions/superAdminGetters';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'User Management | Super Admin',
    description: 'Manage admins, roles, and permissions across the platform.',
};

export default async function UsersPage() {
    const [adminUsers, studentUsers, stats] = await Promise.all([
        getAdminUsers(),
        getStudentUsers(),
        getSuperAdminStats()
    ]);

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading users...</div>}>
            <UsersClient 
                initialUsers={adminUsers} 
                initialStudents={studentUsers} 
                totalRegistrations={stats.totalRegistrations.count} 
                totalStudentsCount={stats.totalUsers.count}
            />
        </Suspense>
    );
}
