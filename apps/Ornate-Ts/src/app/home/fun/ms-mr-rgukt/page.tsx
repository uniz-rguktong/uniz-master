import { redirect } from 'next/navigation';

export default async function MsMrRguktPage() {
    if (process.env.NODE_ENV === 'production' && process.env.MS_MR_ENABLED !== 'true') {
        redirect('/home/fun');
    }

    const { default: MsMrClient } = await import('./MsMrClient');
    return <MsMrClient />;
}
