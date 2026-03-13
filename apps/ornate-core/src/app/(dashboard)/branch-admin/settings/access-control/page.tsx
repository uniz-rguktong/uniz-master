import { redirect } from 'next/navigation';


export default async function Page() {
    redirect('/branch-admin/settings/profile');
}

