'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSchoolByAbbreviation } from '@/hooks/use-schools';
import { useSchoolsTeamsBySchoolAndSeason, useActiveTeamsBySchool } from '@/hooks/use-schools-teams';
import { SchoolsTeamWithSportDetails } from '@/lib/types/schools-teams';
import { useMatchesBySchoolId } from '@/hooks/use-matches';
import { useAllSeasons } from '@/hooks/use-seasons';
import { useSeason } from '@/components/contexts/season-provider';
import { Season } from '@/lib/types/seasons';
import { formatCategoryName } from '@/lib/utils/esports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Clock,
  Target,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { roboto, moderniz } from '@/lib/fonts';
import { formatTableDate } from '@/lib/utils/date';

interface SchoolProfileProps {
  schoolAbbreviation: string;
}

export default function SchoolProfile({ schoolAbbreviation }: SchoolProfileProps) {
  const { data: school, isLoading: schoolLoading, error: schoolError } = useSchoolByAbbreviation(schoolAbbreviation);
  const { data: seasons, isLoading: seasonsLoading, error: seasonsError } = useAllSeasons();
  const { currentSeason: selectedSeason, setCurrentSeason: setSelectedSeason } = useSeason();
  
  // Always call both hooks, but use the appropriate one based on season selection
  const { data: seasonTeams, isLoading: seasonTeamsLoading } = useSchoolsTeamsBySchoolAndSeason(
    school?.id || '', 
    selectedSeason?.id || 0
  );
  const { data: activeTeams, isLoading: activeTeamsLoading } = useActiveTeamsBySchool(school?.id || '');
  
  const teams = selectedSeason?.id ? seasonTeams : activeTeams;
  const teamsLoading = selectedSeason?.id ? seasonTeamsLoading : activeTeamsLoading;
  
  // Type assertion to ensure TypeScript knows the correct type
  const typedTeams = teams as SchoolsTeamWithSportDetails[] | undefined;
  
  // Use the new school-specific matches hook
  const { data: recentMatches, isLoading: matchesLoading } = useMatchesBySchoolId(school?.id || '', {
    limit: 5,
    season_id: selectedSeason?.id,
    direction: 'past'
  });
  
  // Fallback setSelectedSeason if context is not working
  const handleSeasonSelect = (season: Season | null) => {
    if (setSelectedSeason && typeof setSelectedSeason === 'function') {
      setSelectedSeason(season);
    } else {
      console.warn('setSelectedSeason is not available');
    }
  };
  
  // Debug logging
  console.log('Seasons data:', seasons);
  console.log('Seasons loading:', seasonsLoading);
  console.log('Seasons error:', seasonsError);
  
  // Fallback seasons for testing if none exist
  const fallbackSeasons: Season[] = [
    { id: 1, start_at: '2024-01-01', end_at: '2024-12-31', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 2, start_at: '2023-01-01', end_at: '2023-12-31', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: 3, start_at: '2022-01-01', end_at: '2022-12-31', created_at: '2022-01-01', updated_at: '2022-01-01' }
  ];

  // Sort seasons in descending order (latest first)
  const sortedSeasons = seasons && seasons.length > 0 
    ? [...seasons].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    : fallbackSeasons.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  const displaySeasons = sortedSeasons;
  
  // Carousel state
  // Carousel state - moved to simple flex layout based on user feedback
  // const [scrollPosition, setScrollPosition] = React.useState(0);

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            {/* Header Skeleton */}
            <div className="text-center space-y-6">
              <Skeleton className="h-24 w-24 rounded-full mx-auto bg-muted/80" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-96 mx-auto bg-muted/80" />
                <Skeleton className="h-6 w-32 mx-auto bg-muted/80" />
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-80 bg-muted/80" />
                <Skeleton className="h-80 bg-muted/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (schoolError || !school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">School Not Found</h1>
            <p className="text-muted-foreground">The school you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
          <Button asChild>
            <Link href="/schools">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schools
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case 'live':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Target className="h-3 w-3 mr-1" />Ongoing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-muted-foreground border-muted"><Trophy className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Full-Width Hero Banner - LoL Esports Style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-[60vh] min-h-[500px] overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/img/cclex-banner.webp')] bg-cover bg-center bg-no-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>
        
        {/* School Branding - Responsive Positioning */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          {/* Mobile: Centered */}
          <div className="flex flex-col items-center text-center md:hidden">
            {/* School Logo */}
            <div className="relative h-20 w-20 mb-4">
              {school.logo_url ? (
                <Image
                  src={school.logo_url}
                  alt={school.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-white/10 rounded-lg">
                  <Image
                    src="/img/cesafi-logo.webp"
                    alt="CESAFI Logo"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* School Info */}
            <div className="text-white">
              <h1 className={`${roboto.className} text-3xl font-bold mb-1 drop-shadow-lg`}>
                {school.name}
              </h1>
              <p className="text-lg text-white/80 font-medium">
                {school.abbreviation}
              </p>
            </div>
          </div>

          {/* Desktop: Bottom Left */}
          <div className="hidden md:flex items-end gap-6">
            {/* School Logo */}
            <div className="relative h-32 w-32 flex-shrink-0">
              {school.logo_url ? (
                <Image
                  src={school.logo_url}
                  alt={school.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-white/10 rounded-lg">
                  <Image
                    src="/img/cesafi-logo.webp"
                    alt="CESAFI Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* School Info */}
            <div className="text-white">
              <h1 className={`${roboto.className} text-6xl font-bold mb-2 drop-shadow-lg`}>
                {school.name}
              </h1>
              <p className="text-2xl text-white/80 font-medium">
                {school.abbreviation}
              </p>
            </div>
          </div>
        </div>
        
        {/* Back Button - Top Left */}
        <div className="absolute top-6 left-6">
          <Button variant="ghost" size="sm" asChild className="backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20">
            <Link href="/schools">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schools
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Season Selector - Tabs Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="py-8 bg-background border-b border-border/30"
      >
        <div className="flex justify-center">
          <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg transition-all duration-300 ease-in-out">
            {/* Season Buttons */}
            {seasonsLoading ? (
              <div className="flex items-center gap-2">
                <div className="px-6 py-3 rounded-md text-sm font-medium bg-muted/30 shadow-sm border border-border/20 flex-shrink-0 w-32">
                  <div className="h-5 w-20 bg-muted/80 rounded animate-pulse mx-auto"></div>
                </div>
                <div className="px-6 py-3 rounded-md text-sm font-medium bg-muted/30 shadow-sm border border-border/20 flex-shrink-0 w-32">
                  <div className="h-5 w-20 bg-muted/80 rounded animate-pulse mx-auto"></div>
                </div>
              </div>
            ) : displaySeasons && displaySeasons.length > 0 ? (
              displaySeasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonSelect(season)}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    selectedSeason?.id === season.id 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className={moderniz.className}>
                    Season {season.id}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-6 py-3 rounded-md text-sm font-medium bg-muted/50 shadow-sm border border-border/20 flex-shrink-0 text-muted-foreground">
                None
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative">
        {/* Teams Section - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="py-16 bg-gradient-to-r from-background via-muted/10 to-background"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`${roboto.className} text-4xl md:text-5xl font-bold text-foreground mb-4`}>
                Teams
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                {school.name} teams competing in Season {selectedSeason?.id || 'All Seasons'}
              </p>
            </div>
            
            {teamsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-background/60 backdrop-blur-lg rounded-xl shadow-lg border border-border/30 p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg bg-muted/80" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4 bg-muted/80" />
                        <Skeleton className="h-4 w-1/2 bg-muted/80" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : typedTeams && typedTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typedTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-background/60 backdrop-blur-lg rounded-xl shadow-lg border border-border/30 p-6 hover:bg-background/70 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {team.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {team.esports_categories?.esports?.name || 'Esport'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {team.esports_categories ? 
                          formatCategoryName(team.esports_categories.division, team.esports_categories.levels) : 
                          'Category'
                        }
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl opacity-50"></div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No Teams Found</h3>
                <p className="text-muted-foreground">
                  No teams found for this school in the selected season.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Matches Section - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="py-16 bg-gradient-to-l from-background via-muted/10 to-background"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`${roboto.className} text-4xl md:text-5xl font-bold text-foreground mb-4`}>
                Recent Matches
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                Latest matches featuring {school.name} in Season {selectedSeason?.id || 'All Seasons'}
              </p>
            </div>
            
            {matchesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-background/60 backdrop-blur-lg rounded-xl shadow-lg border border-border/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-80 bg-muted/80" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-32 bg-muted/80" />
                          <Skeleton className="h-4 w-40 bg-muted/80" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 bg-muted/80" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMatches && recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.slice(0, 5).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-background/60 backdrop-blur-lg rounded-xl shadow-lg border border-border/30 p-6 hover:bg-background/70 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                          {match.name}
                        </h4>
                        <div className="flex items-center gap-6 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {match.scheduled_at ? formatTableDate(match.scheduled_at) : 'TBD'}
                            </span>
                          </div>
                          {match.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{match.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(match.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl opacity-50"></div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No Recent Matches</h3>
                <p className="text-muted-foreground">
                  No recent matches found for this school.
                </p>
              </div>
            )}
            
            <div className="text-center mt-12">
              <Button size="lg" asChild className="px-6 py-3">
                <Link href="/schedule">
                  View All Matches
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
