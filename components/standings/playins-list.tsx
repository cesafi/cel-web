'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { PlayinsStandings } from '@/lib/types/standings';
import { useSchoolLogoByAbbreviationGetter } from '@/hooks/use-school-logos';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlayinsListProps {
  readonly standings: PlayinsStandings;
  readonly loading?: boolean;
}

export default function PlayinsList({ standings, loading }: PlayinsListProps) {
  const getSchoolLogoUrl = useSchoolLogoByAbbreviationGetter();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-row-${i + 1}`} className="bg-muted h-12 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Check if standings data exists and is valid
  if (!standings?.matches || !Array.isArray(standings.matches) || standings.matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 text-lg font-medium">No matches scheduled</h3>
            <p>There are no matches scheduled for this stage yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatScheduledTime = (scheduledAt: string | null) => {
    if (!scheduledAt) return 'TBD';
    try {
      return format(new Date(scheduledAt), 'MMM dd, yyyy • h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {standings.stage_name}
            <Badge variant="outline" className="ml-auto">
              {standings.matches.length} Matches
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-32">Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.matches.map((match, index) => (
                  <TableRow key={match.match_id}>
                    <TableCell className="py-4 font-medium">{index + 1}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={getSchoolLogoUrl(match.team1?.school_abbreviation ?? 'CESAFI')}
                            alt={match.team1?.school_name ?? 'Team 1'}
                            className="h-6 w-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/img/cesafi-logo.webp';
                            }}
                          />
                          <span
                            className={cn(
                              'font-medium',
                              match.winner?.team_id === match.team1?.team_id &&
                                'font-bold text-green-600'
                            )}
                          >
                            {match.team1?.team_name ?? 'TBD'}
                          </span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-medium',
                              match.winner?.team_id === match.team2?.team_id &&
                                'font-bold text-green-600'
                            )}
                          >
                            {match.team2?.team_name ?? 'TBD'}
                          </span>
                          <img
                            src={getSchoolLogoUrl(match.team2?.school_abbreviation ?? 'CESAFI')}
                            alt={match.team2?.school_name ?? 'Team 2'}
                            className="h-6 w-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/img/cesafi-logo.webp';
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {(() => {
                        if (
                          match.match_status === 'finished' &&
                          match.team1 &&
                          match.team2 &&
                          match.team1.score !== null &&
                          match.team2.score !== null
                        ) {
                          return (
                            <div className="text-center font-bold">
                              {match.team1.score} - {match.team2.score}
                            </div>
                          );
                        }
                        if (match.match_status === 'live') {
                          return <div className="text-muted-foreground text-center">TBD</div>;
                        }
                        return <div className="text-muted-foreground text-center">-</div>;
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 text-sm">
                      {formatScheduledTime(match.scheduled_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 text-sm">
                      {match.venue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {standings.matches.map((match, index) => (
              <Card key={match.match_id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">#{index + 1}</span>
                    <span className="font-medium">{match.match_name}</span>
                  </div>
                  <div className="text-right">
                    {(() => {
                      if (
                        match.match_status === 'finished' &&
                        match.team1 &&
                        match.team2 &&
                        match.team1.score !== null &&
                        match.team2.score !== null
                      ) {
                        return (
                          <div className="font-bold">
                            {match.team1.score} - {match.team2.score}
                          </div>
                        );
                      }
                      if (match.match_status === 'live') {
                        return <div className="text-muted-foreground">TBD</div>;
                      }
                      return <div className="text-muted-foreground">-</div>;
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Teams */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-2">
                      <img
                        src={getSchoolLogoUrl(match.team1?.school_abbreviation ?? 'CESAFI')}
                        alt={match.team1?.school_name ?? 'Team 1'}
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/img/cesafi-logo.webp';
                        }}
                      />
                      <span
                        className={cn(
                          'text-sm',
                          match.winner?.team_id === match.team1?.team_id &&
                            'font-bold text-green-600'
                        )}
                      >
                        {match.team1?.team_name ?? 'TBD'}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <span
                        className={cn(
                          'text-sm',
                          match.winner?.team_id === match.team2?.team_id &&
                            'font-bold text-green-600'
                        )}
                      >
                        {match.team2?.team_name ?? 'TBD'}
                      </span>
                      <img
                        src={getSchoolLogoUrl(match.team2?.school_abbreviation ?? 'CESAFI')}
                        alt={match.team2?.school_name ?? 'Team 2'}
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/img/cesafi-logo.webp';
                        }}
                      />
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatScheduledTime(match.scheduled_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.venue}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
