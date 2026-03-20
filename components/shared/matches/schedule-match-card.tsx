'use client';

import { ScheduleMatch } from '@/lib/types/matches';
import {
  formatSportInfo,
  formatBestOf,
  getMatchStatusVariant,
  hasMultipleParticipants,
  getMatchWinner,
  formatParticipantCount,
  getVenueDisplay,
  isMatchLive,
  getRelativeTime
} from '@/lib/utils/schedule-utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleMatchCardProps {
  readonly match: ScheduleMatch;
  readonly onClick?: (match: ScheduleMatch) => void;
  readonly className?: string;
}

export function ScheduleMatchCard({ match, onClick, className }: ScheduleMatchCardProps) {
  const winner = getMatchWinner(match);
  const isLive = isMatchLive(match);
  const hasMultiple = hasMultipleParticipants(match);
  const isFinished = match.status === 'finished' || match.status === 'completed';
  const isClickable = isLive || isFinished;

  const handleClick = () => {
    if (isClickable) {
      onClick?.(match);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isClickable && 'cursor-pointer hover:scale-[1.02] hover:shadow-md',
        isLive && 'ring-opacity-50 ring-2 ring-blue-500',
        className
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg leading-tight font-semibold">{match.name}</h3>
            <p className="text-muted-foreground text-sm">
              {formatSportInfo(match)} • {formatBestOf(match)}
            </p>
          </div>
          <Badge variant={getMatchStatusVariant(match)}>{isLive ? 'LIVE' : match.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time and Venue */}
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{match.displayTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{getVenueDisplay(match)}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          {hasMultiple ? (
            // Multiple participants (track & field, swimming, etc.)
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                <span>{formatParticipantCount(match)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {match.match_participants?.slice(0, 4).map((participant, _index) => (
                  <div
                    key={participant.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border p-2',
                      winner?.id === participant.id && 'border-green-200 bg-green-50'
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={participant.schools_teams?.school?.logo_url ?? undefined}
                        alt={participant.schools_teams?.school?.abbreviation ?? ''}
                      />
                      <AvatarFallback className="text-xs">
                        {participant.schools_teams?.school?.abbreviation ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {participant.schools_teams?.school?.abbreviation ?? ''}
                      </p>
                      {participant.match_score !== null && (
                        <p className="text-muted-foreground text-xs">{participant.match_score}</p>
                      )}
                    </div>
                    {winner?.id === participant.id && (
                      <Trophy className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                ))}
                {match.match_participants && match.match_participants.length > 4 && (
                  <div className="flex items-center justify-center rounded-md border border-dashed p-2">
                    <span className="text-muted-foreground text-xs">
                      +{match.match_participants.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Two participants (traditional matches)
            <div className="space-y-2">
              {match.match_participants?.slice(0, 2).map((participant, _index) => (
                <div
                  key={participant.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border p-2',
                    winner?.id === participant.id && 'border-green-200 bg-green-50'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={participant.schools_teams?.school?.logo_url ?? undefined}
                      alt={participant.schools_teams?.school?.abbreviation ?? ''}
                    />
                    <AvatarFallback>
                      {participant.schools_teams?.school?.abbreviation ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {participant.schools_teams?.school?.abbreviation ?? ''}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {participant.schools_teams?.school?.name ?? ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {participant.match_score !== null ? (
                      <p className="text-lg font-bold">{participant.match_score}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">-</p>
                    )}
                  </div>
                  {winner?.id === participant.id && <Trophy className="h-5 w-5 text-yellow-500" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relative time */}
        <div className="text-muted-foreground text-xs">{getRelativeTime(match)}</div>
      </CardContent>
    </Card>
  );
}
