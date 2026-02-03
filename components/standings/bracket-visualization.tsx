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
            ? 'bg-cel-yale/10 border-cel-yale/30 text-cel-yale'
            : isLoser
              ? 'bg-muted/5 border-border/30 text-muted-foreground opacity-80 grayscale'
              : 'bg-background border-border hover:bg-muted/30'
        )}
      >
        {isWinner && <div className="bg-cel-yale absolute top-0 bottom-0 left-0 w-1" />}
        <div className={cn("relative h-6 w-6 flex-shrink-0 overflow-hidden rounded", isLoser && "opacity-80")}>
          <Image
            src={getSchoolLogo(team.school_abbreviation)}
            alt={team.school_name}
            fill
            className="object-contain p-0.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-xs font-medium', isWinner && 'font-semibold', isLoser && 'decoration-border/80')}>
            {team.team_name}
          </div>
          <div className="text-muted-foreground truncate text-xs">{team.school_name}</div>
        </div>
        {team.score !== null && team.score !== undefined && (
          <div className={cn('ml-auto text-lg font-bold', isWinner && 'text-cel-yale', isLoser && 'text-muted-foreground/80')}>
            {team.score}
          </div>
        )}
      </div>
    );
  };

  const MatchCard = ({ match }: { match: BracketMatch }) => {
    const isFinished = match.match_status === 'finished' || match.match_status === 'completed';
    
    // Determine winner ID: Prioritize Score Comparison as requested
    // Fallback to explicit winner object if scores are missing or equal
    let winnerId = match.winner?.team_id;

    if (isFinished && match.team1?.score != null && match.team2?.score != null) {
        if (match.team1.score > match.team2.score) winnerId = match.team1.team_id;
        else if (match.team2.score > match.team1.score) winnerId = match.team2.team_id;
    }

    return (
      <div>
        <TeamCard
          team={match.team1}
          isWinner={isFinished && winnerId === match.team1?.team_id}
          isFinished={isFinished}
        />
        <TeamCard
          team={match.team2}
          isWinner={isFinished && winnerId === match.team2?.team_id}
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

  const SingleBracketTree = ({ matches, title, hideRoundHeaders = false }: { matches: BracketMatch[], title?: string, hideRoundHeaders?: boolean }) => {
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
      const matchHeight = 6; // rem - Synced with CARD_HEIGHT

      const roundPositions: Record<number, { positions: number[]; flow: 'straight' | 'converge' }> = {};

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
            flow: 'converge' // Default for first round
          };
        } else {
          // Check flow from previous round
          const prevRound = rounds[index - 1];
          const prevMatchesCount = matchesByRound[prevRound].length;
          
          // Heuristic: If counts are equal, it's straight flow (1->1). If prev is double, it's converge (2->1).
          // Ideally we check match IDs but we lack explicit next_match_id data here.
          // Note: Standard double elim LB has R1(4)->R2(4)->R3(2)... wait.
          // Correct structure:
          // LB R1 (Losers of UB R1): 4 matches.
          // LB R2 (Winners of LB R1 vs Losers UB R2): 4 matches.  <-- Parallel Flow (1->1)
          // LB R3 (Winners of LB R2): 2 matches.                 <-- Converging Flow (2->1)
          
          const isStraightFlow = prevMatchesCount === matchCount;
          const prevPositions = roundPositions[prevRound].positions;
          
          const positions: number[] = [];
          
          for (let i = 0; i < matchCount; i++) {
            if (isStraightFlow) {
                 // Align with the corresponding match in previous round
                 // Assuming strict ordering 0->0, 1->1
                 if (i < prevPositions.length) {
                     positions.push(prevPositions[i]);
                 } else {
                     positions.push(i * (baseSpacing + matchHeight));
                 }
            } else {
                 // Converge: Match i connects to 2i and 2i+1 in prev round
                const input1Index = i * 2;
                const input2Index = i * 2 + 1;
                
                if (input1Index < prevPositions.length && input2Index < prevPositions.length) {
                  const mid = (prevPositions[input1Index] + prevPositions[input2Index] + matchHeight) / 2;
                  positions.push(mid - (matchHeight/2));
                } else if (input1Index < prevPositions.length) {
                    positions.push(prevPositions[input1Index]);
                } else {
                    positions.push(i * (baseSpacing + matchHeight) * Math.pow(2, index));
                }
            }
          }
          
          roundPositions[roundNumber] = {
            positions,
            flow: isStraightFlow ? 'straight' : 'converge'
          };
        }
      });

      return roundPositions;
    };

    const roundPositions = calculateBracketPositions();

    // Calculate lines
    // Assumes standard single-elimination logic where Round N Match i -> Round N+1 Match floor(i/2)
    // Dedicated Connector Component for "Stepped" lines
    const ConnectorLine = ({ 
        startX, 
        startY, 
        endX, 
        endY, 
        type 
    }: { 
        startX: number; 
        startY: number; 
        endX: number; 
        endY: number; 
        type: 'straight' | 'converge' 
    }) => {
        // Lolesports Style: Right -> Up/Down -> Right
        // Midpoint X for the vertical segment
        const midX = (startX + endX) / 2;
        
        // Colors - use muted-foreground for better visibility on dark backgrounds
        const lineColor = "bg-muted-foreground/50"; 

        return (
            <>
                {/* Horizontal Out */}
                <div 
                    className={`absolute ${lineColor}`}
                    style={{
                        left: `${startX}rem`,
                        top: `${startY}rem`,
                        width: `${midX - startX}rem`,
                        height: '1px'
                    }}
                />
                
                {/* Vertical Bridge */}
                <div 
                    className={`absolute ${lineColor}`}
                    style={{
                        left: `${midX}rem`,
                        top: `${Math.min(startY, endY)}rem`,
                        width: '1px',
                        height: `${Math.abs(endY - startY)}rem`
                    }}
                />
                
                {/* Horizontal In */}
                <div 
                    className={`absolute ${lineColor}`}
                    style={{
                        left: `${midX}rem`,
                        top: `${endY}rem`,
                        width: `${endX - midX}rem`,
                        height: '1px'
                    }}
                />
            </>
        );
    };

    // Constants matching layout
    const CARD_WIDTH = 18; // rem (w-72)
    const GAP_WIDTH = 2.6; // rem (gap-8)
    const CARD_HEIGHT = 5; // rem
    const HALF_CARD_HEIGHT = CARD_HEIGHT / 2;
    const COLUMN_WIDTH = CARD_WIDTH + GAP_WIDTH;
    const VERTICAL_OFFSET = 3.4; // Target middle of bottom row (2.5 + 1.25 = 3.75)

    const renderConnectors = () => {
         const connectors = [];

         for (let rIndex = 0; rIndex < rounds.length - 1; rIndex++) {
             const roundFrom = rounds[rIndex];
             const roundTo = rounds[rIndex + 1];
             
             const matchesFrom = matchesByRound[roundFrom] || [];
             const positionsFrom = roundPositions[roundFrom];
             const positionsTo = roundPositions[roundTo];
             
             if (!positionsFrom || !positionsTo) continue;
             
             // Detect flow type for THIS round transition
             const flowType = positionsTo.flow; 

             for (let i = 0; i < matchesFrom.length; i++) {
                 // Determine Target
                 let targetIndex = -1;
                 
                 if (flowType === 'straight') {
                     // 1-to-1 mapping
                     if (i < (matchesByRound[roundTo]?.length || 0)) targetIndex = i;
                 } else {
                     // 2-to-1 mapping (Standard Converge)
                     targetIndex = Math.floor(i / 2);
                 }
                 
                 if (targetIndex !== -1 && targetIndex < (matchesByRound[roundTo]?.length || 0)) {
                      // Coordinates in REM
                      // Start X: Right edge of current card relative to column start.
                      // Relative to the connector container (which starts at first column),
                      // the first match is at X=0, so its right edge is CARD_WIDTH.
                      const startX = (rIndex * COLUMN_WIDTH) + CARD_WIDTH; 
                      const endX = ((rIndex + 1) * COLUMN_WIDTH);
                      
                      const isBottomMatch = i % 2 !== 0;
                      // Additional offset for bottom matches in a pair as requested
                      const adjustment = isBottomMatch ? 2.2 : 0; 

                      const startY = positionsFrom.positions[i] + HALF_CARD_HEIGHT + VERTICAL_OFFSET + adjustment;
                      const endY = positionsTo.positions[targetIndex] + HALF_CARD_HEIGHT + VERTICAL_OFFSET;
                      
                      connectors.push(
                          <ConnectorLine 
                            key={`conn-${roundFrom}-${i}`}
                            startX={startX} 
                            startY={startY} 
                            endX={endX} 
                            endY={endY}
                            type={flowType}
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
        <div className="overflow-x-auto lg:overflow-visible relative min-h-0">
           
           <div className="flex min-w-max gap-10 pb-4 px-4 relative z-10">
             {/* Render Connectors Layer */}
             <div className="absolute top-0 left-4 w-full h-full pointer-events-none z-0">
                  <div className="relative w-full h-full"> 
                      {renderConnectors()}
                  </div>
             </div>

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
                  {!hideRoundHeaders && (
                    <div className="mb-4 text-center">
                      <h3 className="text-foreground text-sm font-semibold">{roundName}</h3>
                    </div>
                  )}

                  <div className="flex flex-col relative">
                    {roundMatches.map((match, matchIndex) => {
                      const position = roundPositions[roundNumber]?.positions[matchIndex] ?? 0;
                      

 
                       return (
                          <div
                           key={match.match_id}
                           className="relative w-72"
                           style={{
                             marginTop: matchIndex === 0 ? `${position}rem` : `${position - (roundPositions[roundNumber]?.positions[matchIndex-1] ?? 0) - CARD_HEIGHT}rem`
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
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {formatCompetitionStage(standings.competition_stage)} - {standings.stage_name}
            <Badge variant="outline" className="ml-auto">
              <Users className="mr-1 h-3 w-3" />
              {standings.bracket?.length || 0} Matches
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 pt-6 bg-background">
           {hasGroups && groups['Upper Bracket'] && groups['Lower Bracket'] && groups['Grand Finals'] ? (
              // Double Elimination "Converging" Layout
              // Left Col: Upper + Lower
              // Right Col: Grand Finals (Centered)
              <div className="flex flex-col lg:flex-row">
                  {/* Brackets Column */}
                  <div className="flex-1 flex flex-col gap-8 border-b lg:border-b-0 pb-8 lg:pb-0">
                      <div>
                          <SingleBracketTree matches={groups['Upper Bracket']} title="Upper Bracket" />
                      </div>
                      <div className="pt-8">
                          <SingleBracketTree matches={groups['Lower Bracket']} title="Lower Bracket" />
                      </div>
                  </div>

                  {/* Finals Column - Vertically Centered */}
                  <div className="flex-shrink-0 flex flex-col justify-center items-center p-8 min-w-[300px]">
                      <SingleBracketTree matches={groups['Grand Finals']} title="Grand Finals" hideRoundHeaders={true} />
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
