'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, TrendingUp } from 'lucide-react';
import { GroupStageStandings } from '@/lib/types/standings';
import { cn } from '@/lib/utils';
import { useSchoolLogoByAbbreviationGetter } from '@/hooks/use-school-logos';

interface GroupStageTableProps {
  standings: GroupStageStandings;
  loading?: boolean;
}

export default function GroupStageTable({ standings, loading }: GroupStageTableProps) {
  // Get real school logos by abbreviation
  const getSchoolLogo = useSchoolLogoByAbbreviationGetter();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position <= 3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return null;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 font-bold';
    if (position <= 3) return 'text-green-500 font-semibold';
    if (position <= 6) return 'text-blue-500 font-medium';
    return 'text-muted-foreground';
  };

  // Check if standings data exists and is valid
  if (!standings?.groups || !Array.isArray(standings.groups) || standings.groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 text-lg font-medium">No standings data available</h3>
            <p>There is no standings data available for this stage.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {standings.groups.map((group, groupIndex) => (
        <Card key={groupIndex}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {group.group_name ?? standings.stage_name}
              <Badge variant="outline" className="ml-auto">
                {group.teams?.length ?? 0} Teams
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-12 cursor-help">Pos</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Position</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TableHead>Team</TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-16 cursor-help text-center">MP</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Matches Played</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-16 cursor-help text-center">W</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Wins</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-16 cursor-help text-center">D</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Draws</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-16 cursor-help text-center">L</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Losses</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-20 cursor-help text-center">GF</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Goals For</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-20 cursor-help text-center">GA</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Goals Against</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-20 cursor-help text-center">GD</TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Goal Difference</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableHead className="w-16 cursor-help text-center font-bold">
                            Pts
                          </TableHead>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Points</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.teams?.map((team) => (
                    <TableRow
                      key={team.team_id}
                      className={cn(
                        'hover:bg-muted/50',
                        team.position <= 3 && 'bg-green-50/20',
                        team.position === 1 && 'bg-yellow-50/20'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPositionIcon(team.position)}
                          <span className={cn('font-medium', getPositionColor(team.position))}>
                            {team.position}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-muted/30 relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={getSchoolLogo(team.school_abbreviation)}
                              alt={team.school_name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{team.team_name}</div>
                            <div className="text-muted-foreground text-sm">{team.school_name}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">{team.matches_played}</TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {team.wins}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600">{team.draws}</TableCell>
                      <TableCell className="text-center text-red-600">{team.losses}</TableCell>
                      <TableCell className="text-center">{team.goals_for}</TableCell>
                      <TableCell className="text-center">{team.goals_against}</TableCell>
                      <TableCell
                        className={cn(
                          'text-center font-medium',
                          team.goal_difference > 0 && 'text-green-600',
                          team.goal_difference < 0 && 'text-red-600'
                        )}
                      >
                        {team.goal_difference > 0 ? '+' : ''}
                        {team.goal_difference}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold">
                          {team.points}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {group.teams?.map((team) => (
                <Card
                  key={team.team_id}
                  className={cn(
                    'p-4',
                    team.position <= 3 && 'border-green-200 bg-green-50/20',
                    team.position === 1 && 'border-yellow-200 bg-yellow-50/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getPositionIcon(team.position)}
                        <span className={cn('text-lg font-bold', getPositionColor(team.position))}>
                          {team.position}
                        </span>
                      </div>

                      <div className="bg-muted/30 relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={getSchoolLogo(team.school_abbreviation)}
                          alt={team.school_name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">{team.team_name}</div>
                        <div className="text-muted-foreground text-sm">{team.school_name}</div>
                      </div>

                      <Badge variant="secondary" className="font-bold">
                        {team.points} pts
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <div className="text-muted-foreground">MP</div>
                            <div className="font-medium">{team.matches_played}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Matches Played</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <div className="text-muted-foreground">W-D-L</div>
                            <div className="font-medium">
                              <span className="text-green-600">{team.wins}</span>-
                              <span className="text-yellow-600">{team.draws}</span>-
                              <span className="text-red-600">{team.losses}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Wins-Draws-Losses</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <div className="text-muted-foreground">GF-GA</div>
                            <div className="font-medium">
                              {team.goals_for}-{team.goals_against}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Goals For-Goals Against</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <div className="text-muted-foreground">GD</div>
                            <div
                              className={cn(
                                'font-medium',
                                team.goal_difference > 0 && 'text-green-600',
                                team.goal_difference < 0 && 'text-red-600'
                              )}
                            >
                              {team.goal_difference > 0 ? '+' : ''}
                              {team.goal_difference}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Goal Difference</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
