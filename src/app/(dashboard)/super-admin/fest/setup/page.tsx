import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Super Admin',
};

export default function FestSetupPage() {
    redirect('/super-admin');
}
