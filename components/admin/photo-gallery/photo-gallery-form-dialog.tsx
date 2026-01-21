'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPhotoGallerySchema,
  updatePhotoGallerySchema,
  CreatePhotoGalleryInput,
  UpdatePhotoGalleryInput
} from '@/lib/validations/photo-gallery';
import { PhotoGallery, PhotoGalleryUpdate } from '@/lib/types/photo-gallery';
import { useCreatePhotoGallery } from '@/hooks/use-photo-gallery';
import { ImageUpload } from '@/components/shared/image-upload';
import { Button } from '@/components/ui/button';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface PhotoGalleryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo?: PhotoGallery | null;
  onSubmit?: (data: PhotoGalleryUpdate) => void;
}

const CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'events', label: 'Events' },
  { value: 'awards', label: 'Awards' },
  { value: 'general', label: 'General' },
  { value: 'team', label: 'Team' },
  { value: 'facilities', label: 'Facilities' }
] as const;

export function PhotoGalleryFormDialog({
  open,
  onOpenChange,
  photo,
  onSubmit
}: PhotoGalleryFormDialogProps) {
  const isEditing = !!photo;
  const createMutation = useCreatePhotoGallery();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreatePhotoGalleryInput | UpdatePhotoGalleryInput>({
    resolver: zodResolver(isEditing ? updatePhotoGallerySchema : createPhotoGallerySchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      title: '',
      caption: '',
      category: 'general',
      photo_by: '',
      photo_url: ''
    }
  });

  useEffect(() => {
    if (photo) {
      reset({
        title: photo.title,
        caption: photo.caption,
        category: photo.category as
          | 'sports'
          | 'events'
          | 'awards'
          | 'general'
          | 'team'
          | 'facilities',
        photo_by: photo.photo_by,
        photo_url: photo.photo_url
      });
    } else {
      reset({
        title: '',
        caption: '',
        category: 'general',
        photo_by: '',
        photo_url: ''
      });
    }
  }, [photo, reset]);

  const onSubmitForm = async (data: CreatePhotoGalleryInput | UpdatePhotoGalleryInput) => {
    try {
      if (isEditing && onSubmit) {
        onSubmit(data);
      } else {
        await createMutation.mutateAsync(data as CreatePhotoGalleryInput);
        onOpenChange(false);
        reset();
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
    }
  };

  const handleImageUpload = (url: string) => {
    setValue('photo_url', url);
  };

  const isLoading = createMutation.isPending;

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Photo' : 'Add New Photo'}
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} form="photo-gallery-form">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Photo' : 'Add Photo'}
          </Button>
        </div>
      }
    >
      <form
        id="photo-gallery-form"
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Enter photo title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    'category',
                    value as 'sports' | 'events' | 'awards' | 'general' | 'team' | 'facilities'
                  )
                }
                value={watch('category')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo_by">Photographer *</Label>
              <Input
                id="photo_by"
                placeholder="Enter photographer name"
                {...register('photo_by')}
              />
              {errors.photo_by && (
                <p className="text-sm text-red-600">{errors.photo_by.message}</p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo *</Label>
            <ImageUpload
              preset="GENERAL"
              currentImageUrl={watch('photo_url')}
              onUpload={handleImageUpload}
              placeholder="Upload photo"
              description="Upload a high-quality photo for the gallery"
              required
            />
            {errors.photo_url && (
              <p className="text-sm text-red-600">{errors.photo_url.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption *</Label>
          <Textarea
            id="caption"
            placeholder="Enter photo caption"
            className="min-h-[100px]"
            {...register('caption')}
          />
          {errors.caption && <p className="text-sm text-red-600">{errors.caption.message}</p>}
        </div>
      </form>
    </ModalLayout>
  );
}
