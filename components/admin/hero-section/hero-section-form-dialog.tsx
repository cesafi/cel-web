'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createHeroSectionLiveSchema, updateHeroSectionLiveSchema, CreateHeroSectionLiveInput, UpdateHeroSectionLiveInput } from '@/lib/validations/hero-section';
import { HeroSectionLive } from '@/lib/types/hero-section';
import { useCreateHeroSectionLive } from '@/hooks/use-hero-section';
import { Button } from '@/components/ui/button';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { Loader2, Video } from 'lucide-react';
import { utcToLocal } from '@/lib/utils/utc-time';

interface HeroSectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hero?: HeroSectionLive | null;
  onSubmit?: (data: CreateHeroSectionLiveInput | UpdateHeroSectionLiveInput) => void;
}

export function HeroSectionFormDialog({ open, onOpenChange, hero, onSubmit }: HeroSectionFormDialogProps) {
  const isEditing = !!hero;
  const createMutation = useCreateHeroSectionLive();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CreateHeroSectionLiveInput | UpdateHeroSectionLiveInput>({
    resolver: zodResolver(isEditing ? updateHeroSectionLiveSchema : createHeroSectionLiveSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      video_link: '',
      end_at: '',
    },
  });

  useEffect(() => {
    if (hero) {
      // Convert UTC date from database to local datetime-local format for the input
      const localEndDate = utcToLocal(hero.end_at);
      const localDateTimeString = localEndDate.toISOString().slice(0, 16); // Format for datetime-local input
      
      reset({
        video_link: hero.video_link,
        end_at: localDateTimeString,
      });
    } else {
      reset({
        video_link: '',
        end_at: '',
      });
    }
  }, [hero, reset]);

  const onSubmitForm = async (data: CreateHeroSectionLiveInput | UpdateHeroSectionLiveInput) => {
    try {
      if (isEditing && onSubmit) {
        onSubmit(data);
      } else {
        await createMutation.mutateAsync(data as CreateHeroSectionLiveInput);
        onOpenChange(false);
        reset();
      }
    } catch (error) {
      console.error('Error submitting hero section:', error);
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center space-x-2">
          <Video className="w-5 h-5" />
          <span>{isEditing ? 'Edit Hero Section' : 'Add New Hero Section'}</span>
        </div>
      }
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isLoading}
            form="hero-section-form"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Hero Section' : 'Add Hero Section'}
          </Button>
        </div>
      }
    >
      <form
        id="hero-section-form"
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-6"
      >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_link">Video URL *</Label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="video_link"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="pl-10"
                  {...register('video_link')}
                />
              </div>
              {errors.video_link && (
                <p className="text-sm text-red-600">{errors.video_link.message}</p>
              )}
              <p className="text-sm text-gray-500">
                Enter a YouTube video URL. The video will be embedded on the homepage.
              </p>
            </div>

            <DateTimeInput
              id="end_at"
              label="End Date & Time"
              value={watch('end_at') || null}
              onChange={(utcIsoString) => {
                // Update the form value with the UTC ISO string
                reset({
                  ...watch(),
                  end_at: utcIsoString || ''
                });
              }}
              error={errors.end_at?.message}
              helpText="When the hero section should stop being displayed"
              required={true}
            />
          </div>

          {/* Preview Section */}
          {watch('video_link') && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Preview</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Video URL: <code className="bg-white px-2 py-1 rounded text-xs">{watch('video_link')}</code>
                </p>
                {watch('end_at') && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Local Time: <code className="bg-white px-2 py-1 rounded text-xs">{new Date(watch('end_at')!).toLocaleString()}</code>
                    </p>
                    <p className="text-sm text-gray-500">
                      UTC Time: <code className="bg-white px-2 py-1 rounded text-xs">{new Date(watch('end_at')!).toISOString()}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
      </form>
    </ModalLayout>
  );
}
