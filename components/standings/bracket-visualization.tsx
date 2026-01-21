'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users } from 'lucide-react';
import { BracketStandings, BracketMatch, BracketTeam } from '@/lib/types/standings';
import { cn } from '@/lib/utils';
import { useSchoolLogoByAbbreviationGetter } from '@/hooks/use-school-logos';

interface BracketVisualizationProps {
  readonly standings: BracketStandings;
  readonly loading?: boolean;
}

export default function BracketVisualization({ standings, loading }: BracketVisualizationProps) {
  // Get real school logos by abbreviation
  const getSchoolLogo = useSchoolLogoByAbbreviationGetter();
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i + 1}`} className="bg-muted h-32 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const formatCompetitionStage = (stage: string) => {
    switch (stage) {
      case 'group_stage':
        return 'Group Stage';
      case 'playins':
        return 'Play-ins';
      case 'playoffs':
        return 'Playoffs';
      case 'finals':
        return 'Finals';
      default:
        return stage;
    }
  };

  const TeamCard = ({
    team,
    isWinner = false
  }: {
    team: BracketTeam | null;
    isWinner?: boolean;
  }) => {
    if (!team) {
      return (
        <div className="bg-muted/20 border-muted/30 text-muted-foreground flex items-center justify-center overflow-hidden border p-3 text-xs">
          TBD
        </div>
      );
    }

    return (
      <div
        className={cn(
          'relative flex items-center gap-2 overflow-hidden border p-3 transition-colors duration-200',
          isWinner
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-background border-border hover:bg-muted/30'
        )}
      >
        {isWinner && <div className="bg-primary absolute top-0 bottom-0 left-0 w-1" />}
        <div className="bg-muted/30 relative h-6 w-6 flex-shrink-0 overflow-hidden rounded">
          <Image
            src={getSchoolLogo(team.school_abbreviation)}
            alt={team.school_name}
            fill
            className="object-contain p-0.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-xs font-medium', isWinner && 'font-semibold')}>
            {team.team_name}
          </div>
          <div className="text-muted-foreground truncate text-xs">{team.school_name}</div>
        </div>
        {team.score !== null && team.score !== undefined && (
          <div className={cn('ml-auto text-lg font-bold', isWinner && 'text-primary')}>
            {team.score}
          </div>
        )}
      </div>
    );
  };

  const MatchCard = ({ match }: { match: BracketMatch }) => {
    const isFinished = match.match_status === 'finished';
    const winner = match.winner;

    return (
      <div>
        <TeamCard
          team={match.team1}
          isWinner={isFinished && winner?.team_id === match.team1?.team_id}
        />
        <TeamCard
          team={match.team2}
          isWinner={isFinished && winner?.team_id === match.team2?.team_id}
        />
      </div>
    );
  };

  // Check if bracket data exists and is valid
  if (!standings?.bracket || !Array.isArray(standings.bracket)) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 text-lg font-medium">No bracket data available</h3>
            <p>There is no bracket data available for this stage.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group matches by rounds for better organization
  const matchesByRound = standings.bracket.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, BracketMatch[]>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate positioning for tournament bracket alignment
  const calculateBracketPositions = () => {
    const baseSpacing = 2; // rem (32px) - base spacing between matches in first round
    const matchHeight = 6; // approximate height of each match card in rem

    // For a proper tournament bracket, we need to understand the tournament structure:
    // Round 1 (Quarterfinals): 4 matches feeding into Round 2 (Semifinals): 2 matches
    // Round 2 feeds into Round 3 (Final): 1 match

    const roundPositions: Record<number, { positions: number[]; spacing: number }> = {};

    rounds.forEach((roundNumber, index) => {
      const matches = matchesByRound[roundNumber];
      const matchCount = matches.length;

      if (index === 0) {
        // Round 1 (Quarterfinals) - evenly spaced
        const positions: number[] = [];
        for (let i = 0; i < matchCount; i++) {
          positions.push(i * (baseSpacing + matchHeight));
        }

        roundPositions[roundNumber] = {
          positions,
          spacing: baseSpacing
        };
      } else if (roundNumber === 2) {
        // Round 2 (Semifinals) - positioned at midpoints of Round 1 pairs
        const prevPositions = roundPositions[1].positions; // Round 1 positions

        // Semifinal 1: midpoint between Quarterfinals 1 and 2
        const semi1Midpoint = (prevPositions[0] + matchHeight + prevPositions[1]) / 2;
        // Semifinal 2: midpoint between Quarterfinals 3 and 4
        const semi2Midpoint = (prevPositions[2] + matchHeight + prevPositions[3]) / 2;

        roundPositions[roundNumber] = {
          positions: [semi1Midpoint, semi2Midpoint],
          spacing: semi2Midpoint - semi1Midpoint
        };
      } else if (roundNumber === 3) {
        // Round 3 (Final) - positioned at midpoint of Semifinals
        const prevPositions = roundPositions[2].positions; // Semifinal positions

        // Final: midpoint between Semifinals 1 and 2
        const finalMidpoint = (prevPositions[0] + matchHeight + prevPositions[1]) / 2;

        roundPositions[roundNumber] = {
          positions: [finalMidpoint],
          spacing: 0
        };
      }
    });

    return roundPositions;
  };

  const roundPositions = calculateBracketPositions();

  // Function to get round name based on number of matches and round number
  const getRoundName = (roundNumber: number, matchCount: number, totalRounds: number) => {
    if (roundNumber === totalRounds) {
      return 'Championship Final';
    } else if (roundNumber === totalRounds - 1) {
      return 'Semifinals';
    } else if (roundNumber === totalRounds - 2 && matchCount === 4) {
      return 'Quarterfinals';
    } else if (roundNumber === 1) {
      // First round naming based on match count
      if (matchCount >= 8) return 'Round of 16';
      if (matchCount >= 4) return 'Quarterfinals';
      if (matchCount === 2) return 'Semifinals';
      return `Round ${roundNumber}`;
    } else {
      return `Round ${roundNumber}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {formatCompetitionStage(standings.competition_stage)} - {standings.stage_name}
            <Badge variant="outline" className="ml-auto">
              <Users className="mr-1 h-3 w-3" />
              {standings.bracket?.length || 0} Matches
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tournament Bracket - Horizontal Layout */}
      {rounds.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-8 pb-4">
            {rounds.map((roundNumber) => {
              const roundMatches = matchesByRound[roundNumber];
              const roundName = getRoundName(roundNumber, roundMatches.length, rounds.length);

              return (
                <div key={roundNumber} className="flex flex-col items-center">
                  {/* Round Label */}
                  <div className="mb-4 text-center">
                    <h3 className="text-foreground text-sm font-semibold">{roundName}</h3>
                  </div>

                  {/* Matches in this round */}
                  <div className="flex flex-col">
                    {roundMatches.map((match, matchIndex) => {
                      const position = roundPositions[roundNumber].positions[matchIndex];

                      return (
                        <div
                          key={match.match_id}
                          className="relative w-72"
                          style={{
                            marginTop: `${position}rem`
                          }}
                        >
                          <MatchCard match={match} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-muted-foreground text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="mb-2 text-lg font-medium">No matches scheduled</h3>
              <p>There are no matches scheduled for this stage yet.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
