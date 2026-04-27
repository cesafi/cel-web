'use client';

import Image from 'next/image';
import { moderniz } from '@/lib/fonts';
import { cn } from '@/lib/utils';

interface ArticlePlaceholderCoverProps {
  title: string;
  category?: string;
  className?: string;
  /** 'hero' for the full article page, 'card' for thumbnails */
  variant?: 'hero' | 'card';
}

/**
 * A branded placeholder cover for articles without a cover image.
 * Uses the CEL brand gradient with the CESAFI logo watermark and
 * a subtle diagonal pattern for visual texture.
 */
export default function ArticlePlaceholderCover({
  title,
  category,
  className,
  variant = 'card',
}: ArticlePlaceholderCoverProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
    >
      {/* Gradient background — CEL Yale blue to dark */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f5390 0%, #0a3a66 40%, #091a2a 100%)',
        }}
      />

      {/* Subtle diagonal lines pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            white 10px,
            white 11px
          )`,
        }}
      />

      {/* Center logo watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          'relative opacity-[0.08]',
          variant === 'hero' ? 'h-48 w-48 md:h-64 md:w-64' : 'h-20 w-20'
        )}>
          <Image
            src="/img/cesafi-logo.webp"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Title overlay for card variant */}
      {variant === 'card' && (
        <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="relative z-10">
            {category && (
              <span className="mb-1.5 inline-block rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur-sm">
                {category}
              </span>
            )}
            <p className={cn(
              moderniz.className,
              'line-clamp-2 text-sm font-bold text-white/90'
            )}>
              {title}
            </p>
          </div>
        </div>
      )}

      {/* Bottom gradient fade for hero */}
      {variant === 'hero' && (
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  );
}
