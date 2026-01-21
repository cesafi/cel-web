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
        <CardContent className="p-6 flex flex-col h-full">
          {/* Profile Image / Avatar */}
          <div className="relative mx-auto mb-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted/50">
              {volunteer.image_url && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 animate-pulse bg-muted/80 rounded-full" />
                  )}
                  <Image
                    src={volunteer.image_url}
                    alt={volunteer.full_name || 'Volunteer'}
                    fill
                    className={`object-cover transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
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
                  <span className={`${roboto.className} text-xl font-semibold text-primary`}>
                    {getInitials(volunteer.full_name || 'Unknown')}
                  </span>
                </div>
              )}
            </div>
            
            {/* Active status indicator */}
            {volunteer.is_active !== false && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Volunteer Info */}
          <div className="text-center flex-1 flex flex-col">
            <h4 className={`${roboto.className} font-semibold text-foreground text-lg mb-2`}>
              {volunteer.full_name || 'Unknown Volunteer'}
            </h4>
            
            {/* Joined Date */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-auto">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(volunteer.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
