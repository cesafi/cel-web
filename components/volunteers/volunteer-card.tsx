'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { roboto } from '@/lib/fonts';
import type { Volunteer } from '@/lib/types/volunteers';

interface VolunteerCardProps {
  volunteer: Volunteer;
}

export default function VolunteerCard({ volunteer }: VolunteerCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Handle name formatting: "Last Name, First Name" or "Last Name, First Name "Nickname""
  const rawName = volunteer.full_name || 'Unknown Volunteer';
  
  let firstName = '';
  let lastName = '';
  let nickname: string | null = null;
  let cleanDisplayName = rawName;

  // 1. First, try to extract a nickname in quotes
  const nicknameMatch = rawName.match(/"([^"]+)"/);
  if (nicknameMatch) {
    nickname = nicknameMatch[1];
  }

  // 2. Remove the nickname in quotes for cleaner parsing of the names
  const nameWithoutNickname = rawName.replace(/"[^"]+"/, '').replace(/\s{2,}/g, ' ').trim();

  // 3. Check for "Last Name, First Name" format
  if (nameWithoutNickname.includes(',')) {
    const parts = nameWithoutNickname.split(',');
    lastName = parts[0].trim();
    firstName = parts[1].trim();
    // Reconstruct as "First Name Last Name"
    cleanDisplayName = `${firstName} ${lastName}`.trim();
  } else {
    // If no comma, assume it's already "First Name Last Name" and take the first word as first name
    const parts = nameWithoutNickname.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ');
    cleanDisplayName = nameWithoutNickname;
  }

  // Use nickname if available. If not, use the first word of their first name.
  const mainTitle = nickname || firstName.split(' ')[0] || lastName || 'Unknown';

  return (
    <div className="group block h-full w-full">
      <div className="relative flex flex-col h-[320px] sm:h-[360px] w-full rounded-2xl border border-border/30 bg-gradient-to-b from-card/80 to-background overflow-hidden hover:border-primary/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

        {/* Generic Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.05] dark:opacity-10 mix-blend-multiply dark:mix-blend-plus-lighter pointer-events-none p-6">
          <Image
            src="/img/cesafi-logo.webp"
            alt="CESAFI Esports League Watermark"
            fill
            className="object-contain"
          />
        </div>

        {/* Volunteer Photo (Aesthetic leaning right) */}
        <div className="absolute inset-y-0 left-8 w-[100%] z-10 flex items-end justify-center overflow-hidden grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500">
          {volunteer.image_url && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 w-full h-full animate-pulse bg-muted/20" />
              )}
              <Image
                src={volunteer.image_url}
                alt={volunteer.full_name || 'Volunteer image'}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className={`object-contain object-bottom sm:object-right-bottom drop-shadow-2xl opacity-95 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            null // No photo placeholder needed, just empty space for cleaner look
          )}
        </div>

        {/* Text Information Sidebar (Left Side) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent z-20 flex flex-col justify-end p-6">
          
          <div className="w-full pr-2">
            {/* Main Title (Nickname or First Name) */}
            <h3 className="text-3xl sm:text-xl font-mango-grotesque font-bold text-foreground group-hover:text-primary transition-colors tracking-widest uppercase drop-shadow-2xl break-words leading-[0.9] mb-4">
              {mainTitle}
            </h3>
            
            {/* Divider */}
            <div className="w-12 h-0.5 bg-primary/60 mb-5 group-hover:w-full transition-all duration-700"></div>

            <div className="flex flex-col gap-0.5">
              {/* Full Name */}
              <span className="text-xs font-bold text-foreground/80 tracking-tight uppercase leading-tight line-clamp-1" title={cleanDisplayName}>
                {cleanDisplayName}
              </span>
              
              {/* Department Title/Role */}
              {volunteer.title && (
                <span className={`text-[10px] text-muted-foreground uppercase tracking-widest mt-1 ${roboto.className}`}>
                  {volunteer.title}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
