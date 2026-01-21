'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Play, Users, Clock } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useState, useMemo } from 'react';

interface LiveIndicatorProps {
  isLive: boolean;
  liveUrl?: string;
  title?: string;
  timeRemaining?: string;
  viewerCount?: number;
  className?: string;
  variant?: 'compact' | 'expanded' | 'floating' | 'navbar';
  onClick?: () => void;
}

function LiveIndicator({
  isLive,
  liveUrl,
  title = 'CESAFI Live',
  timeRemaining,
  viewerCount,
  className = '',
  variant = 'compact',
  onClick
}: LiveIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoize the click handler to prevent re-renders
  const handleClick = useMemo(() => () => {
    if (onClick) {
      onClick();
    } else if (liveUrl) {
      window.open(liveUrl, '_blank', 'noopener,noreferrer');
    }
  }, [onClick, liveUrl]);

  if (!isLive) return null;

  const CompactIndicator = () => (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${className}`}
    >
      {/* Pulsing dot - using CSS animation only */}
      <div className="relative">
        <div className="w-2 h-2 bg-white rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-white rounded-full opacity-75 animate-pulse" />
      </div>
      
      <span className={`${moderniz.className} uppercase tracking-wide`}>LIVE</span>
      
      {/* External link icon */}
      <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
      
      {/* Hover tooltip */}
      {isHovered && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap z-50 animate-in fade-in duration-200">
          Click to watch live
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </button>
  );

  const ExpandedIndicator = () => (
    <motion.button
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`group relative flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Live indicator with pulse */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-3 h-3 bg-white rounded-full" />
          <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
        </div>
        <span className={`${moderniz.className} text-lg font-bold uppercase tracking-wide`}>LIVE</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/30" />

      {/* Content */}
      <div className="flex flex-col items-start">
        <span className={`${roboto.className} text-sm font-medium`}>{title}</span>
        {timeRemaining && (
          <div className="flex items-center gap-1 text-xs opacity-90">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining} left</span>
          </div>
        )}
      </div>

      {/* Viewer count */}
      {viewerCount && (
        <>
          <div className="w-px h-6 bg-white/30" />
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4" />
            <span>{viewerCount.toLocaleString()}</span>
          </div>
        </>
      )}

      {/* External link icon */}
      <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity ml-2" />

      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );

  const NavbarIndicator = () => (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${className}`}
    >
      {/* Pulsing dot - using CSS animation only */}
      <div className="relative">
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
        <div className="absolute inset-0 w-1.5 h-1.5 bg-white rounded-full opacity-75 animate-pulse" />
      </div>
      
      <span className={`${moderniz.className} uppercase tracking-wide text-[10px]`}>LIVE</span>
      
      {/* Hover tooltip */}
      {isHovered && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 animate-in fade-in duration-200">
          <div className="flex flex-col">
            <span className="font-semibold">{title}</span>
            {timeRemaining && (
              <span className="text-[10px] opacity-75">{timeRemaining} remaining</span>
            )}
          </div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </button>
  );

  const FloatingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className={`fixed top-6 right-6 z-50 ${className}`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative flex items-center gap-3 bg-black/80 backdrop-blur-md border border-red-500/50 hover:border-red-400 text-white px-4 py-3 rounded-2xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
      >
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className={`${moderniz.className} text-sm font-bold uppercase tracking-wide text-red-400`}>
            LIVE
          </span>
        </div>

        {/* Play icon */}
        <div className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors">
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{title}</span>
                {timeRemaining && (
                  <span className="text-xs opacity-75">{timeRemaining} remaining</span>
                )}
              </div>
              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      </motion.button>
    </motion.div>
  );

  switch (variant) {
    case 'expanded':
      return <ExpandedIndicator />;
    case 'floating':
      return <FloatingIndicator />;
    case 'navbar':
      return <NavbarIndicator />;
    default:
      return <CompactIndicator />;
  }
}

export { LiveIndicator };
export default LiveIndicator;