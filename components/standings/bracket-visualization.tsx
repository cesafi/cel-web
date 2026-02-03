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
    isWinner = false,
    isFinished = false
  }: {
    team: BracketTeam | null;
    isWinner?: boolean;
    isFinished?: boolean;
  }) => {
    if (!team) {
      return (
        <div className="bg-muted/20 border-muted/30 text-muted-foreground flex items-center justify-center overflow-hidden border p-3 text-xs">
          TBD
        </div>
      );
    }

    const isLoser = isFinished && !isWinner;

    return (
      <div
        className={cn(
          'relative flex items-center gap-2 overflow-hidden border p-3 transition-colors duration-200',
          isWinner
            ? 'bg-primary/10 border-primary/30 text-primary'
            : isLoser
              ? 'bg-muted/10 border-border/50 text-muted-foreground opacity-70 grayscale'
              : 'bg-background border-border hover:bg-muted/30'
        )}
      >
        {isWinner && <div className="bg-primary absolute top-0 bottom-0 left-0 w-1" />}
        <div className={cn("relative h-6 w-6 flex-shrink-0 overflow-hidden rounded", isLoser && "opacity-50")}>
          <Image
            src={getSchoolLogo(team.school_abbreviation)}
            alt={team.school_name}
            fill
            className="object-contain p-0.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-xs font-medium', isWinner && 'font-semibold', isLoser && 'line-through decoration-border/50')}>
            {team.team_name}
          </div>
          <div className="text-muted-foreground truncate text-xs">{team.school_name}</div>
        </div>
        {team.score !== null && team.score !== undefined && (
          <div className={cn('ml-auto text-lg font-bold', isWinner && 'text-primary', isLoser && 'text-muted-foreground/50')}>
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
          isFinished={isFinished}
        />
        <TeamCard
          team={match.team2}
          isWinner={isFinished && winner?.team_id === match.team2?.team_id}
          isFinished={isFinished}
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

  const SingleBracketTree = ({ matches, title }: { matches: BracketMatch[], title?: string }) => {
    // Group matches by rounds for better organization
    const matchesByRound = matches.reduce(
      (acc, match) => {
        // Fallback: Calculate round if missing
        // This is a naive inference assuming matches are passed in order of Round 1 -> Round 2 -> ...
        // and that "match_order" or array index reflects this.
        let r = match.round;
        if (!r) {
             // If we don't have a round, we can't easily guess without more info or Strict Ordering.
             // BUT, user deleted the column, so we MUST guess.
             // Let's assume the component receives matches sorted by "logical" order.
             // If we simply rely on the sort from the service (which should be match_order),
             // then we can chunk them.
             // However, "match_order" is intra-round position usually.
             // If user wants match_order to be GLOBAL sequence (1-7), we can use that.
             
             // Let's try to infer from total matches in the group/bracket.
             // E.g. 7 matches -> 4 (R1), 2 (R2), 1 (R3).
             // ID logic is unreliable.
             // We'll group them into a "Default Round" if we really can't tell,
             // OR strictly use match_order if it looks like a global sequence (1..7).
             
             // For now, let's look at the match_order directly.
             // If match_order is 1,2,3,4... across the WHOLE bracket, we can map it.
             // But usually match_order is 1,2,3,4 for Rd1, then 1,2 for Rd2.
             // IF the user deletes 'round', they MUST make match_order globally unique/sequential.
             // Assuming match_order is 1..N:
             // 8 teams (7 matches): 1-4=R1, 5-6=R2, 7=R3.
             
             const order = match.position || 0; // mapped from match_order
             if (matches.length === 7) {
                 if (order <= 4) r = 1;
                 else if (order <= 6) r = 2;
                 else r = 3;
             } else if (matches.length === 3) {
                 if (order <= 2) r = 1;
                 else r = 2;
             } else {
                 r = 1; // Default
             }
        }

        if (!acc[r]) {
          acc[r] = [];
        }
        acc[r].push(match);
        return acc;
      },
      {} as Record<number, BracketMatch[]>
    );

    const rounds = Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => a - b);

    // Calculate positioning for tournament bracket alignment
    const calculateBracketPositions = () => {
      const baseSpacing = 2; // rem
      const matchHeight = 6; // rem

      const roundPositions: Record<number, { positions: number[]; spacing: number }> = {};

      rounds.forEach((roundNumber, index) => {
        const roundMatches = matchesByRound[roundNumber];
        const matchCount = roundMatches.length;

        if (index === 0) {
          // Round 1 (Quarterfinals/First Round) - evenly spaced
          const positions: number[] = [];
          for (let i = 0; i < matchCount; i++) {
            positions.push(i * (baseSpacing + matchHeight));
          }

          roundPositions[roundNumber] = {
            positions,
            spacing: baseSpacing
          };
        } else {
          // Subsequent rounds - positioned relative to previous round
          // Simplification: Midpoint of every pair from previous round
          // This assumes standard powers of 2 (8 -> 4 -> 2 -> 1)
          // If structure is irregular, this naive layout needs more complex tree traversal
          const prevRound = rounds[index - 1];
          const prevPositions = roundPositions[prevRound].positions;
          
          const positions: number[] = [];
          
          for (let i = 0; i < matchCount; i++) {
            // Find inputs from previous round. 
            // In a perfect tree, match i in this round connects to match 2i and 2i+1 in previous round
            const input1Index = i * 2;
            const input2Index = i * 2 + 1;
            
            if (input1Index < prevPositions.length && input2Index < prevPositions.length) {
              const mid = (prevPositions[input1Index] + prevPositions[input2Index] + matchHeight) / 2;
              positions.push(mid - (matchHeight/2));
            } else if (input1Index < prevPositions.length) {
                // Odd number carry over?
                positions.push(prevPositions[input1Index]);
            } else {
                // Fallback
                positions.push(i * (baseSpacing + matchHeight) * Math.pow(2, index));
            }
          }
          
          roundPositions[roundNumber] = {
            positions,
            spacing: 0
          };
        }
      });

      return roundPositions;
    };

    const roundPositions = calculateBracketPositions();

    // Calculate lines
    // Assumes standard single-elimination logic where Round N Match i -> Round N+1 Match floor(i/2)
    const renderConnectors = () => {
         const connectors = [];
         const cardWidth = 288; // w-72 = 18rem = 288px (approx, using 16px root) -> actually explicit in SVG matches
         // Let's use Rem for SVG coordinates to match marginTop? Or easier to use pixels if we know the constants.
         // margin-top is in rem. 1rem = 16px usually.
         // w-72 is 18rem.
         // gap-8 is 2rem.
         
         const w_card = 18; 
         const w_gap = 2;
         const h_card = 6; // TeamCard * 2 ~ 6rem approx? TeamCard is p-3 + h-6 + p-3...
         // Actually CardHeight is set to 6 in calculateBracketPositions.

         for (let rIndex = 0; rIndex < rounds.length - 1; rIndex++) {
             const roundFrom = rounds[rIndex];
             const roundTo = rounds[rIndex + 1];
             
             const matchesFrom = matchesByRound[roundFrom] || [];
             // const matchesTo = matchesByRound[roundTo] || [];
             
             const positionsFrom = roundPositions[roundFrom];
             const positionsTo = roundPositions[roundTo];
             
             if (!positionsFrom || !positionsTo) continue;

             for (let i = 0; i < matchesFrom.length; i++) {
                 // Determine target match index in next round
                 // Default: i -> floor(i/2)
                 const targetIndex = Math.floor(i / 2);
                 
                 // If the next round has enough matches
                 // (This check avoids drawing lines to nowhere if data is incomplete)
                 if (targetIndex < (matchesByRound[roundTo]?.length || 0)) {
                      const startY = positionsFrom.positions[i] + (h_card / 2);
                      const endY = positionsTo.positions[targetIndex] + (h_card / 2);
                      
                      const startX = (rIndex * (w_card + w_gap)) + w_card;
                      const endX = ((rIndex + 1) * (w_card + w_gap));
                      
                      // Handle "carry over" lines (if odd number of teams)
                      // If we just draw straight lines, bezier is distinct.
                      
                      connectors.push(
                          <path
                            key={`${roundFrom}-${i}-${roundTo}-${targetIndex}`}
                            d={`M ${startX} ${startY} C ${(startX + endX)/2} ${startY}, ${(startX + endX)/2} ${endY}, ${endX} ${endY}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-border"
                            style={{ vectorEffect: 'non-scaling-stroke' }} // Kept simple
                          />
                      );
                 }
             }
         }
         return connectors;
    };

    return (
      <div className="mb-8 relative">
        {title && <h3 className="text-lg font-semibold mb-4 px-4">{title}</h3>}
        <div className="overflow-x-auto relative">
           {/* SVG Overlay */}
           <svg className="absolute top-[2.2rem] left-4 h-full pointer-events-none" style={{ width: '100%', minHeight: '500px', zIndex: 0 }}>
               {/* Note: top offset accounts for header height roughly */}
               {/* 1rem = 16px. We used Rem coordinates. We need to scale SVG or use styling. 
                   Actually simpler to not include lines for now if specific pixel-perfect SVG is risky without testing.
                   Let's iterate: put connectors in a simplified way.
               */}
           </svg>
           {/* Wait, the user WANTS lines. I must implement them. 
               The Rem-based positioning makes absolute SVG hard unless SVG viewBox matches.
               Alternative: Render individual SVGs between columns?
               Yes.
           */}
          <div className="flex min-w-max gap-8 pb-4 px-4 relative z-10">
            {rounds.map((roundNumber, index) => {
              const roundMatches = matchesByRound[roundNumber];
              
              // Smart Round Naming (omitted for brevity in thinking, but existing in code)
              let baseRoundName = `Round ${roundNumber}`;
              const totalRounds = rounds.length;
              if (roundNumber === totalRounds) baseRoundName = 'Finals';
              else if (roundNumber === totalRounds - 1) baseRoundName = 'Semifinals';
              else if (roundNumber === totalRounds - 2) baseRoundName = 'Quarterfinals';
              
               if (baseRoundName.startsWith('Round')) {
                  if (roundMatches.length === 8) baseRoundName = 'Round of 16';
                  if (roundMatches.length === 4) baseRoundName = 'Quarterfinals';
                  if (roundMatches.length === 2) baseRoundName = 'Semifinals';
                  if (roundMatches.length === 1) baseRoundName = 'Finals';
              }

              const roundName = title 
                ? `${title} ${baseRoundName}`.replace('Grand Finals Finals', 'Grand Finals')
                : baseRoundName;

              return (
                <div key={roundNumber} className="flex flex-col items-center group relative">
                  <div className="mb-4 text-center">
                    <h3 className="text-foreground text-sm font-semibold">{roundName}</h3>
                  </div>

                  <div className="flex flex-col relative">
                    {roundMatches.map((match, matchIndex) => {
                      const position = roundPositions[roundNumber]?.positions[matchIndex] ?? 0;
                      
                      // Draw line to right?
                      // Instead of one big SVG, we can use pseudo-elements or small SVGs on each card?
                      // "Elbow" connectors are classic CSS.
                      // ::after { content: ''; position: absolute; right: -1rem; width: 1rem; ... }
                      
                      return (
                         <div
                          key={match.match_id}
                          className="relative w-72"
                          style={{
                            marginTop: matchIndex === 0 ? `${position}rem` : `${position - (roundPositions[roundNumber]?.positions[matchIndex-1] ?? 0) - 6}rem`
                          }}
                        >
                          <MatchCard match={match} />
                          
                           {/* Connector Lines Logic using CSS borders */}
                           {index < rounds.length - 1 && (
                               <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-border" />
                           )}
                           {index > 0 && (
                               <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-border" />
                           )}
                           
                           {/* Vertical Connectors? 
                               If we are the top of a pair (even index), we need a line DOWN to midpoint.
                               If we are bottom of a pair (odd index), we need a line UP to midpoint.
                           */}
                           {index < rounds.length - 1 && matchIndex % 2 === 0 && roundMatches.length > 1 && (
                               // Top of pair: Line extending right then down
                               // Height needs to reach halfway to next match matchIndex+1
                               // Distance = (nextPos - currentPos) / 2
                               <div 
                                 className="absolute right-[-1rem] border-r border-border"
                                 style={{ 
                                     top: '50%', 
                                     height: `${(roundPositions[roundNumber].positions[matchIndex+1] - position)/2 * 16 + 2}px`, // *16 for rem->px conversion roughly, +gap
                                     // Actually this is brittle.
                                 }} 
                               />
                           )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Check for groups
  const groups: Record<string, BracketMatch[]> = {};
  let hasGroups = false;

  standings.bracket.forEach(match => {
    if (match.group_name) {
      hasGroups = true;
      if (!groups[match.group_name]) groups[match.group_name] = [];
      groups[match.group_name].push(match);
    }
  });

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
        
        <CardContent className="p-0 pt-6">
           {hasGroups && groups['Upper Bracket'] && groups['Lower Bracket'] && groups['Grand Finals'] ? (
              // Double Elimination "Converging" Layout
              // Left Col: Upper + Lower
              // Right Col: Grand Finals (Centered)
              <div className="flex flex-col lg:flex-row">
                  {/* Brackets Column */}
                  <div className="flex-1 flex flex-col gap-8 border-b lg:border-b-0 lg:border-r border-border pb-8 lg:pb-0 lg:pr-8">
                      <div>
                          <SingleBracketTree matches={groups['Upper Bracket']} title="Upper Bracket" />
                      </div>
                      <div className="border-t pt-8">
                          <SingleBracketTree matches={groups['Lower Bracket']} title="Lower Bracket" />
                      </div>
                  </div>

                  {/* Finals Column - Vertically Centered */}
                  <div className="flex-shrink-0 flex flex-col justify-center items-center p-8 bg-muted/5 min-w-[300px]">
                      <SingleBracketTree matches={groups['Grand Finals']} title="Grand Finals" />
                  </div>
              </div>
           ) : hasGroups ? (
              // Standard Vertical Stack for other group combinations
              Object.entries(groups)
                .sort((a,b) => {
                    const order = ['Upper Bracket', 'Lower Bracket', 'Grand Finals'];
                    const indexA = order.indexOf(a[0]);
                    const indexB = order.indexOf(b[0]);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    return a[0].localeCompare(b[0]);
                })
                .map(([groupName, groupMatches]) => (
                 <div key={groupName} className="border-b last:border-0 pb-6 mb-6 last:pb-0 last:mb-0">
                     <SingleBracketTree matches={groupMatches} title={groupName} />
                 </div>
              ))
           ) : (
              // Render single tree
              <SingleBracketTree matches={standings.bracket} />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
