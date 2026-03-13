import { redirect } from 'next/navigation';

export default function BranchRedirect() {
    redirect('/home/branches');
}
