import { getStalls, getStallsPromoVideos } from '@/lib/data/stalls';
import StallsClient from './StallsClient';

export default async function StallsPage() {
    const stalls = await getStalls();
    const promoVideos = await getStallsPromoVideos();
    return <StallsClient stalls={stalls} promoVideos={promoVideos} />;
}
