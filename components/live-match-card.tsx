'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import LiveIndicator from './live-indicator';

interface LiveMatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  matchTime: string;
  venue: string;
  isLive: boolean;
  liveUrl?: string;
  timeRemaining?: string;
  viewerCount?: number;
  className?: string;
}

export default function LiveMatchCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  matchTime,
  venue,
  isLive,
  liveUrl,
  timeRemaining,
  viewerCount,
  className = ''
}: LiveMatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute -top-2 -right-2">
          <LiveIndicator
            isLive={isLive}
            liveUrl={liveUrl}
            title={`${homeTeam} vs ${awayTeam}`}
            timeRemaining={timeRemaining}
            viewerCount={viewerCount}
            variant="compact"
          />
        </div>
      )}

      {/* Match header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{matchTime}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{venue}</span>
        </div>
      </div>

      {/* Teams and scores */}
      <div className="space-y-4">
        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className={`${moderniz.className} text-primary font-bold text-sm`}>
                {homeTeam.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <span className={`${roboto.className} text-white font-semibold text-lg`}>
              {homeTeam}
            </span>
          </div>
          {homeScore !== undefined && (
            <span className={`${moderniz.className} text-2xl font-bold text-white`}>
              {homeScore}
            </span>
          )}
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center">
          <div className="w-full h-px bg-gray-600" />
          <span className={`${moderniz.className} px-4 text-gray-400 text-sm font-semibold`}>
            VS
          </span>
          <div className="w-full h-px bg-gray-600" />
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
              <span className={`${moderniz.className} text-secondary font-bold text-sm`}>
                {awayTeam.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <span className={`${roboto.className} text-white font-semibold text-lg`}>
              {awayTeam}
            </span>
          </div>
          {awayScore !== undefined && (
            <span className={`${moderniz.className} text-2xl font-bold text-white`}>
              {awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Live stats */}
      {isLive && viewerCount && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{viewerCount.toLocaleString()} watching</span>
          </div>
        </div>
      )}

      {/* Glow effect for live matches */}
      {isLive && (
        <div className="absolute inset-0 bg-red-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.div>
  );
}