import Image from 'next/image';
import { moderniz } from '@/lib/fonts';

export default function StandingsLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-8 text-center">
        {/* CESAFI Logo with Animation */}
        <div className="relative">
          <div className="animate-pulse">
            <Image
              src="/img/cesafi-logo.webp"
              alt="CESAFI Logo"
              width={120}
              height={120}
              className="mx-auto drop-shadow-lg"
              priority
            />
          </div>

          {/* Pulsing Ring Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-primary/30 h-32 w-32 animate-ping rounded-full border-2"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-primary/20 h-40 w-40 animate-ping rounded-full border delay-300"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className={`${moderniz.className} text-foreground animate-pulse text-2xl font-bold`}>
            CESAFI
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="bg-primary h-2 w-2 animate-bounce rounded-full"></div>
            <div className="bg-primary h-2 w-2 animate-bounce rounded-full delay-100"></div>
            <div className="bg-primary h-2 w-2 animate-bounce rounded-full delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
