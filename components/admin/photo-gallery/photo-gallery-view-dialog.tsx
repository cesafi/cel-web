'use client';

import { PhotoGallery } from '@/lib/types/photo-gallery';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag } from 'lucide-react';
import Image from 'next/image';

interface PhotoGalleryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: PhotoGallery | null;
}

export function PhotoGalleryViewDialog({ open, onOpenChange, photo }: PhotoGalleryViewDialogProps) {
  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{photo.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Display */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={photo.photo_url}
              alt={photo.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Photo Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Caption</h4>
                <p className="text-gray-700 leading-relaxed">{photo.caption}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                <Badge variant="secondary" className="inline-flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {photo.category}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Photographer</h4>
                <p className="text-gray-700 inline-flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {photo.photo_by}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                <p className="text-gray-700 inline-flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(photo.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {photo.updated_at && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
                  <p className="text-gray-700 inline-flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(photo.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Photo URL</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm text-gray-600 break-all">{photo.photo_url}</code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
