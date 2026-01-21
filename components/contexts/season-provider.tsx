'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Season } from '@/lib/types/seasons';
import { SeasonService } from '@/services/seasons';

interface SeasonContextType {
  currentSeason: Season | null;
  availableSeasons: Season[];
  setCurrentSeason: (season: Season | null) => void;
  switchSeason: (seasonId: number) => void;
  isLoading: boolean;
  error: string | null;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

interface SeasonProviderProps {
  children: ReactNode;
}

export function SeasonProvider({ children }: SeasonProviderProps) {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available seasons on mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setIsLoading(true);
        const result = await SeasonService.getAll();
        
        if (result.success && result.data) {
          const seasons = result.data;
          setAvailableSeasons(seasons);
          
          // Set the most recent active season as default
          const activeSeason = seasons.find((s: Season) => {
            const now = new Date();
            const startDate = new Date(s.start_at);
            const endDate = new Date(s.end_at);
            return now >= startDate && now <= endDate;
          });
          
          if (activeSeason) {
            setCurrentSeason(activeSeason);
          } else if (seasons.length > 0) {
            // Fallback to most recent season
            setCurrentSeason(seasons[0]);
          }
        } else if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load seasons');
        console.error('Error fetching seasons:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasons();
  }, []);

  const switchSeason = (seasonId: number) => {
    const season = availableSeasons.find(s => s.id === seasonId);
    if (season) {
      setCurrentSeason(season);
      // Optionally save to localStorage for persistence
      localStorage.setItem('currentSeasonId', seasonId.toString());
    }
  };

  // Load saved season preference on mount
  useEffect(() => {
    const savedSeasonId = localStorage.getItem('currentSeasonId');
    if (savedSeasonId && availableSeasons.length > 0) {
      const season = availableSeasons.find(s => s.id === parseInt(savedSeasonId));
      if (season) {
        setCurrentSeason(season);
      }
    }
  }, [availableSeasons]);

  const value: SeasonContextType = {
    currentSeason,
    availableSeasons,
    setCurrentSeason,
    switchSeason,
    isLoading,
    error
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
