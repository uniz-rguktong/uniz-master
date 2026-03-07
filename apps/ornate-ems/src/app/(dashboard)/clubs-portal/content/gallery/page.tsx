import { GalleryPage } from "@/components/features/admin/views/GalleryPage";
import { getGalleryAlbums } from "@/actions/galleryActions";

export default async function Page() {
  const res = await getGalleryAlbums();
  const initialAlbums = res.success ? (res.data ?? []) : [];

  return <GalleryPage initialAlbums={initialAlbums} />;
}
