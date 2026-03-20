'use client';

import { Flame, MapPin, Play, Trophy, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ScheduleMatch } from '@/lib/types/matches';
import { determineWinner } from './utils';
import Link from 'next/link';

interface MatchCardProps {
  readonly match: ScheduleMatch;
}

export default function MatchCard({ match }: MatchCardProps) {
  // Transform match_participants to the format expected by determineWinner
  const participants = match.match_participants.map((p) => ({
    id: p.id,
    teamName: p.schools_teams?.name ?? 'TBD',
    schoolName: p.schools_teams?.school?.name ?? 'TBD',
    schoolAbbreviation: p.schools_teams?.school?.abbreviation ?? 'TBD',
    schoolLogo: p.schools_teams?.school?.logo_url ?? null,
    score: p.match_score,
    isWinner: false
  }));

  const tbdParticipant = {
    id: 0,
    teamName: 'TBD',
    schoolName: 'TBD',
    schoolAbbreviation: 'TBD',
    schoolLogo: null,
    score: null as number | null,
    isWinner: false
  };

  const participantsWithWinners = determineWinner(participants);
  const team1 = participantsWithWinners[0] ?? tbdParticipant;
  const team2 = participantsWithWinners[1] ?? tbdParticipant;

  const esport = match.esports_seasons_stages?.esports_categories?.esports;
  const category = match.esports_seasons_stages?.esports_categories;
  const stage = match.esports_seasons_stages?.competition_stage ?? 'Unknown Stage';

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished' || match.status === 'completed';
  const isClickable = isLive || isFinished;
  const hasScore = team1.score !== null && team2.score !== null;
  
  // Calculate games needed to win (for best-of display)
  // For BO2, a team can win up to 2 games, so we show 2 dots per team.
  // For other formats (BO3, BO5, etc.), we show the number of wins required to win the match.
  const gamesToWin = match.best_of === 2 ? 2 : Math.ceil(match.best_of / 2);
  
  // Get accent color based on status
  const getAccentColor = () => {
    if (isLive) return 'from-red-500 to-red-600';
    if (isFinished) return 'from-zinc-500 to-zinc-600';
    return 'from-primary to-primary/80';
  };

  const getAccentGlow = () => {
    if (isLive) return 'shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    if (isFinished) return '';
    return '';
  };

  // Render best-of indicator dots
  const renderBestOfIndicator = () => {
    const dots = [];
    const team1Score = team1.score ?? 0;
    const team2Score = team2.score ?? 0;
    
    const dotsPerTeam = gamesToWin;
    
    for (let i = 0; i < dotsPerTeam; i++) {
      // Team 1's dots (left side - filled from right to left, towards center)
      const team1Won = i >= dotsPerTeam - team1Score;
      dots.push(
        <div
          key={`t1-${i}`}
          className={`h-1.5 w-1.5 rounded-full transition-all ${
            team1Won 
              ? 'bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)]' 
              : 'bg-muted-foreground/20'
          }`}
        />
      );
    }
    
    // Separator
    dots.push(
      <div key="sep" className="w-px h-3 bg-border/50 mx-1" />
    );
    
    for (let i = 0; i < dotsPerTeam; i++) {
      // Team 2's dots (right side - filled based on wins)
      const team2Won = i < team2Score;
      dots.push(
        <div
          key={`t2-${i}`}
          className={`h-1.5 w-1.5 rounded-full transition-all ${
            team2Won 
              ? 'bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)]' 
              : 'bg-muted-foreground/20'
          }`}
        />
      );
    }
    
    return dots;
  };

  const cardContent = (
    <div className={`relative bg-card/60 ${isClickable ? 'hover:bg-card hover:border-border' : ''} border border-border/40 rounded-lg overflow-hidden transition-all duration-300 ${getAccentGlow()}`}>
      {/* Left Accent Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getAccentColor()}`} />
      
      {/* Esport Logo Watermark (subtle background) */}
      {esport?.logo_url && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Image
            src={esport.logo_url}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative flex items-center gap-2 sm:gap-4 pl-3 sm:pl-5 pr-3 sm:pr-4 py-3 sm:py-4">
        {/* Teams Section */}
        <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6">
          {/* Team 1 */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 min-w-0">
            {/* Abbreviation - shown inline on desktop only */}
            <span className={`font-mango-grotesque hidden sm:inline text-lg font-bold tracking-wide truncate ${
              team1.isWinner && isFinished ? 'text-foreground' : 'text-foreground/70'
            }`}>
              {team1.schoolAbbreviation}
            </span>
            <div className="relative flex-shrink-0">
              <Image
                src={team1.schoolLogo ?? '/img/cesafi-logo.webp'}
                alt={team1.schoolAbbreviation}
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-border/50"
              />
              {team1.isWinner && isFinished && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                  <Trophy className="h-2.5 w-2.5 text-yellow-900" />
                </div>
              )}
            </div>
            {/* Abbreviation - shown below logo on mobile only */}
            <span className={`font-mango-grotesque sm:hidden text-[10px] font-bold tracking-wide text-center leading-tight ${
              team1.isWinner && isFinished ? 'text-foreground' : 'text-foreground/70'
            }`}>
              {team1.schoolAbbreviation}
            </span>
          </div>

          {/* Score Section */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            {hasScore ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={`font-mango-grotesque text-xl sm:text-2xl font-black ${
                  team1.isWinner && isFinished ? 'text-primary' : 'text-foreground/60'
                }`}>
                  {team1.score}
                </span>
                <span className="text-muted-foreground/30 text-base sm:text-lg font-light">—</span>
                <span className={`font-mango-grotesque text-xl sm:text-2xl font-black ${
                  team2.isWinner && isFinished ? 'text-primary' : 'text-foreground/60'
                }`}>
                  {team2.score}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-muted/40 border border-border/30">
                  <span className="text-muted-foreground/40 text-xs sm:text-sm font-medium">VS</span>
                </div>
              </div>
            )}
            
            {/* Best-of Indicator Dots */}
            <div className="flex items-center gap-1">
              {renderBestOfIndicator()}
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Image
                src={team2.schoolLogo ?? '/img/cesafi-logo.webp'}
                alt={team2.schoolAbbreviation}
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-border/50"
              />
              {team2.isWinner && isFinished && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                  <Trophy className="h-2.5 w-2.5 text-yellow-900" />
                </div>
              )}
            </div>
            {/* Abbreviation - below logo on mobile, inline on desktop */}
            <span className={`font-mango-grotesque sm:hidden text-[10px] font-bold tracking-wide text-center leading-tight ${
              team2.isWinner && isFinished ? 'text-foreground' : 'text-foreground/70'
            }`}>
              {team2.schoolAbbreviation}
            </span>
            <span className={`font-mango-grotesque hidden sm:inline text-lg font-bold tracking-wide truncate ${
              team2.isWinner && isFinished ? 'text-foreground' : 'text-foreground/70'
            }`}>
              {team2.schoolAbbreviation}
            </span>
          </div>
        </div>

        {/* Right Side - Time/Status */}
        <div className="flex-shrink-0 text-right min-w-[50px] sm:min-w-[80px]">
          {isLive ? (
            <div className="flex items-center justify-end gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Live</span>
            </div>
          ) : isFinished ? (
            <div className="flex items-center justify-end gap-1 text-muted-foreground group-hover:text-primary transition-colors">
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider hidden sm:inline">Match Details</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{match.displayTime || 'TBD'}</span>
          )}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="relative flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2.5 border-t border-border/20 bg-muted/10">
        {/* Game Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {esport?.logo_url ? (
            <Image
              src={esport.logo_url}
              alt={esport.name}
              width={18}
              height={18}
              className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 object-contain flex-shrink-0"
            />
          ) : (
            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[7px] sm:text-[8px] font-bold text-primary">{esport?.abbreviation?.[0] ?? 'E'}</span>
            </div>
          )}
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
            <span className="sm:hidden">{esport?.abbreviation ?? esport?.name ?? '?'} • </span>
            <span className="hidden sm:inline">{esport?.name ?? 'Unknown'} • </span>
            {category?.division ?? 'Open'} • {stage}
          </span>
        </div>

        {/* Venue + Best-of */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {match.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 truncate max-w-[80px] sm:max-w-[120px]">{match.venue}</span>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 uppercase tracking-widest">
              <span className="sm:hidden">BO</span>
              <span className="hidden sm:inline">Best of</span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground bg-muted/50 px-1 sm:px-1.5 py-0.5 rounded">
              {match.best_of}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/matches/${match.id}`} prefetch={false} className="block group">
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="block">
      {cardContent}
    </div>
  );
}
