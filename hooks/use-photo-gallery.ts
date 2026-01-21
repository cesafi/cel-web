import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaginatedPhotoGallery, getAllPhotoGallery, getPhotoGalleryByCategory, getPhotoGalleryById, createPhotoGallery, updatePhotoGallery, deletePhotoGallery } from '@/actions/photo-gallery';
import { PhotoGalleryInsert, PhotoGalleryUpdate, PhotoGalleryPaginationOptions } from '@/lib/types/photo-gallery';
import { toast } from 'sonner';

const PHOTO_GALLERY_QUERY_KEY = 'photo-gallery';

export const usePaginatedPhotoGallery = (options: PhotoGalleryPaginationOptions) => {
  return useQuery({
    queryKey: [PHOTO_GALLERY_QUERY_KEY, options],
    queryFn: () => getPaginatedPhotoGallery(options),
    placeholderData: (previousData) => previousData,
  });
};

export const useAllPhotoGallery = () => {
  return useQuery({
    queryKey: [PHOTO_GALLERY_QUERY_KEY, 'all'],
    queryFn: () => getAllPhotoGallery(),
    select: (data) => {
      if (!data.success) {
        throw new Error('error' in data ? data.error : 'Failed to fetch photo gallery.');
      }
      return 'data' in data ? data.data : [];
    },
    placeholderData: (previousData) => previousData,
  });
};

export const usePhotoGalleryByCategory = (category: string) => {
  return useQuery({
    queryKey: [PHOTO_GALLERY_QUERY_KEY, 'category', category],
    queryFn: () => getPhotoGalleryByCategory(category),
    enabled: !!category,
    placeholderData: (previousData) => previousData,
  });
};

export const usePhotoGalleryById = (id: number) => {
  return useQuery({
    queryKey: [PHOTO_GALLERY_QUERY_KEY, id],
    queryFn: () => getPhotoGalleryById(id),
    enabled: !!id,
  });
};

export const useCreatePhotoGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PhotoGalleryInsert) => createPhotoGallery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PHOTO_GALLERY_QUERY_KEY] });
      toast.success('Photo added to gallery successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add photo to gallery');
    },
  });
};

export const useUpdatePhotoGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PhotoGalleryUpdate }) => updatePhotoGallery(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PHOTO_GALLERY_QUERY_KEY] });
      toast.success('Photo updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update photo');
    },
  });
};

export const useDeletePhotoGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePhotoGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PHOTO_GALLERY_QUERY_KEY] });
      toast.success('Photo deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete photo');
    },
  });
};
