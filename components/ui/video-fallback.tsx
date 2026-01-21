'use client';

import { Play } from 'lucide-react';

interface VideoFallbackProps {
  title: string;
  className?: string;
  onPlay?: () => void;
}

export default function VideoFallback({ title, className = '', onPlay }: VideoFallbackProps) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-primary/80 to-primary/60 ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="mb-6 bg-white/20 backdrop-blur-sm rounded-full p-8 hover:bg-white/30 transition-all duration-300 hover:scale-110 group"
        >
          <Play className="w-16 h-16 text-white fill-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Title */}
        <h3 className="text-white text-2xl font-bold mb-4 max-w-md">
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-white/80 text-lg">
          Click to load video
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div 
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse" 
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div 
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse" 
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}