import { getPaginatedPhotoGallery } from '@/actions/photo-gallery';
import { PhotoGalleryTable } from '@/components/admin/photo-gallery/photo-gallery-table';

export default async function PhotoGalleryPage() {
  const photoGalleryData = await getPaginatedPhotoGallery({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  return (
    <div className="w-full space-y-6">
      <PhotoGalleryTable
        initialData={
          photoGalleryData.success && 'data' in photoGalleryData ? photoGalleryData.data : undefined
        }
      />
    </div>
  );
}
