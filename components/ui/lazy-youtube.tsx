'use client';

import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface LazyYouTubeProps {
  videoId: string;
  title: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  showThumbnail?: boolean;
  fallbackImage?: string;
}

export default function LazyYouTube({
  videoId,
  title,
  className = '',
  autoplay = false,
  muted = true,
  loop = false,
  controls = false,
  showThumbnail = true,
  fallbackImage
}: LazyYouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const buildEmbedUrl = () => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      controls: controls ? '1' : '0',
      showinfo: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      fs: '0',
      disablekb: '1',
      start: '0'
    });

    if (loop) {
      params.set('playlist', videoId);
    }

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const handleLoadVideo = () => {
    setIsLoaded(true);
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {!isLoaded && showThumbnail ? (
        // Thumbnail with play button
        <div className="relative w-full h-full group cursor-pointer" onClick={handleLoadVideo}>
          {/* Background Image */}
          <div className="absolute inset-0 bg-black/20">
            {fallbackImage ? (
              <Image
                src={fallbackImage}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to a gradient if thumbnail fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.style.background = 
                      'linear-gradient(135deg, #336C61 0%, #2a5a4f 100%)';
                  }
                }}
              />
            )}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-6 group-hover:bg-black/70 transition-all duration-300 group-hover:scale-110">
              <Play className="w-12 h-12 text-white fill-white" />
            </div>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h3 className="text-white text-lg font-semibold line-clamp-2">{title}</h3>
          </div>
        </div>
      ) : !isLoaded && !showThumbnail ? (
        // Simple loading state without thumbnail
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      ) : null}

      {/* YouTube Embed - Only load when needed */}
      {(isLoaded || (isIntersecting && autoplay)) && (
        <iframe
          src={buildEmbedUrl()}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}