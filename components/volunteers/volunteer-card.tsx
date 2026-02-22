'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { roboto } from '@/lib/fonts';
import type { Volunteer } from '@/lib/types/volunteers';

interface VolunteerCardProps {
  volunteer: Volunteer;
}

export default function VolunteerCard({ volunteer }: VolunteerCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Create initials from full name as fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="overflow-hidden bg-background/60 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-300 h-full">
        <CardContent className="p-3 sm:p-6 flex flex-col h-full">
          {/* Profile Image / Avatar */}
          <div className="relative mx-auto mb-2 sm:mb-4">
            <div className="relative w-14 h-14 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted/50">
              {volunteer.image_url && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 animate-pulse bg-muted/80 rounded-full" />
                  )}
                  <Image
                    src={volunteer.image_url}
                    alt={volunteer.full_name || 'Volunteer'}
                    fill
                    className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                  />
                </>
              ) : (
                // Fallback avatar with initials
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className={`${roboto.className} text-sm sm:text-xl font-semibold text-primary`}>
                    {getInitials(volunteer.full_name || 'Unknown')}
                  </span>
                </div>
              )}
            </div>

            {/* Active status indicator */}
            {volunteer.is_active !== false && (
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Volunteer Info */}
          <div className="text-center flex-1 flex flex-col">
            {(() => {
              const name = volunteer.full_name || 'Unknown Volunteer';
              const match = name.match(/^(.*?)\s*"([^"]+)"\s*(.*)$/);
              const cleanName = match ? `${match[1]}${match[3]}`.replace(/\s{2,}/g, ' ').trim() : name;
              const nickname = match ? match[2] : null;

              return (
                <>
                  <h4 className={`${roboto.className} font-semibold text-foreground text-xs sm:text-lg leading-tight ${nickname || volunteer.title ? 'mb-0.5' : 'mb-1'}`}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden'
                    }}
                  >
                    {cleanName}
                  </h4>
                  {nickname && (
                    <p className={`${roboto.className} text-[10px] sm:text-sm italic text-primary/90 font-medium ${volunteer.title ? 'mb-0' : 'mb-1 sm:mb-2'}`}>
                      &ldquo;{nickname}&rdquo;
                    </p>
                  )}
                </>
              );
            })()}
            {volunteer.title && (
              <p className={`${roboto.className} text-[9px] sm:text-xs text-muted-foreground/80 font-medium tracking-wide uppercase mb-1 sm:mb-2`}>
                {volunteer.title}
              </p>
            )}

            {/* Joined Date */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm mt-auto">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Joined {formatDate(volunteer.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
