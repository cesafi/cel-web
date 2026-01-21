import { useState, useEffect } from 'react';
import { calculateTimeRemaining, isLiveActive, isLiveExpired } from '@/lib/utils/utc-time';

interface LiveStatusData {
  isLive: boolean;
  liveUrl?: string;
  title?: string;
  timeRemaining?: string;
  viewerCount?: number;
  startTime?: string; // UTC ISO string
  endTime?: string;   // UTC ISO string
}

interface UseLiveStatusOptions {
  checkInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export function useLiveStatus(
  initialData?: LiveStatusData,
  options: UseLiveStatusOptions = {}
) {
  const { checkInterval = 30000, autoRefresh = true } = options;
  const [liveStatus, setLiveStatus] = useState<LiveStatusData>(
    initialData || { isLive: false }
  );

  // Calculate time remaining using UTC-aware utility
  const getTimeRemaining = (endTimeUtc?: string): string | undefined => {
    if (!endTimeUtc) return undefined;
    return calculateTimeRemaining(endTimeUtc) || undefined;
  };

  // Update live status
  const updateLiveStatus = (newData: Partial<LiveStatusData>) => {
    setLiveStatus(prev => {
      const updatedData = {
        ...prev,
        ...newData,
      };
      
      // Update live status based on UTC times
      if (newData.startTime || newData.endTime) {
        updatedData.isLive = isLiveActive(
          newData.startTime || prev.startTime,
          newData.endTime || prev.endTime
        );
        updatedData.timeRemaining = getTimeRemaining(newData.endTime || prev.endTime);
      }
      
      return updatedData;
    });
  };

  // Auto-refresh time remaining
  useEffect(() => {
    if (!autoRefresh || !liveStatus.endTime) return;

    const interval = setInterval(() => {
      const timeRemaining = getTimeRemaining(liveStatus.endTime);
      const isExpired = isLiveExpired(liveStatus.endTime);
      
      if (isExpired || !timeRemaining) {
        // Stream has ended
        setLiveStatus(prev => ({
          ...prev,
          isLive: false,
          timeRemaining: undefined
        }));
        return;
      }

      setLiveStatus(prev => ({
        ...prev,
        timeRemaining,
        isLive: isLiveActive(prev.startTime, prev.endTime)
      }));
    }, checkInterval);

    return () => clearInterval(interval);
  }, [liveStatus.endTime, liveStatus.startTime, autoRefresh, checkInterval]);

  return {
    liveStatus,
    updateLiveStatus,
    isLive: liveStatus.isLive,
    timeRemaining: liveStatus.timeRemaining
  };
}

// Utility function to check if a stream should be live based on UTC time
export function isStreamLive(startTimeUtc?: string, endTimeUtc?: string): boolean {
  return isLiveActive(startTimeUtc, endTimeUtc);
}

// Utility function to format viewer count
export function formatViewerCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}