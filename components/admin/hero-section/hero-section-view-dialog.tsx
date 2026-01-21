'use client';

import { HeroSectionLive } from '@/lib/types/hero-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Clock, ExternalLink } from 'lucide-react';

interface HeroSectionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hero: HeroSectionLive | null;
}

export function HeroSectionViewDialog({ open, onOpenChange, hero }: HeroSectionViewDialogProps) {
  if (!hero) return null;

  const endDate = new Date(hero.end_at);
  const now = new Date();
  const isExpired = endDate < now;
  const timeRemaining = endDate.getTime() - now.getTime();
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const formatTimeRemaining = () => {
    if (isExpired) return 'Expired';
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(hero.video_link);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Hero Section Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          {videoId && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Video Preview</h4>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Hero Section Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Status and Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <Badge variant={isExpired ? 'destructive' : 'default'} className="inline-flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {isExpired ? 'Expired' : 'Active'}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Time Remaining</h4>
                <p className={`text-lg font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTimeRemaining()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                <p className="text-gray-700 inline-flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(hero.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Expires</h4>
                <p className={`text-gray-700 inline-flex items-center ${isExpired ? 'text-red-600' : ''}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Video URL</h4>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <code className="text-sm text-gray-600 break-all flex-1 mr-2">{hero.video_link}</code>
              <a
                href={hero.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open</span>
              </a>
            </div>
          </div>

          {/* YouTube Video ID */}
          {videoId && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">YouTube Video ID</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm text-gray-600">{videoId}</code>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


