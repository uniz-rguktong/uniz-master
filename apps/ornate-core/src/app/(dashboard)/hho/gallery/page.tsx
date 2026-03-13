import { GalleryPage } from '@/components/features/admin/views/GalleryPage';
import { getGalleryAlbums } from '@/actions/galleryActions';

export default async function HHOGalleryPage() {
    const result = await getGalleryAlbums();
    const initialAlbums = result.success ? (result.data ?? []) : [];

    return <GalleryPage initialAlbums={initialAlbums} />;
}