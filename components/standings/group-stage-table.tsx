import Link from 'next/link';
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
import { Trophy, TrendingUp, Minus, ArrowDown } from 'lucide-react';
import { GroupStageStandings } from '@/lib/types/standings';
import { cn } from '@/lib/utils';
import { useSchoolLogoByAbbreviationGetter } from '@/hooks/use-school-logos';
import { moderniz } from '@/lib/fonts';

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

  // Check if this is a Play-in stage
  const stageName = standings.stage_name?.toLowerCase().trim() || '';
  const isPlayIn = stageName.includes('play-in') || stageName.includes('playin');

  const getPositionInfo = (position: number) => {
    // Rank 1: Top Seed / Group Winner
    if (position === 1) return { 
        icon: <Trophy className="h-4 w-4 text-yellow-500" />, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/50',
        gradient: 'from-yellow-500 to-yellow-600'
    };

    // Rank 2: Direct Qualification
    if (position === 2) return { 
        icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/50',
        gradient: 'from-emerald-500 to-emerald-600'
    };

    // PLAY-INS Logic: Top 2 advance, everyone else eliminated
    if (isPlayIn) {
        return { 
            icon: <ArrowDown className="h-4 w-4 text-red-500" />,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/50',
            gradient: 'from-red-500 to-red-600'
        };
    }

    // REGULAR GROUP STAGE Logic
    
    // Rank 3 & 4: Play-ins (Yellow/Orange/Blue) - Let's use Blue to indicate "Still in it but different path"
    if (position === 3 || position === 4) return { 
        icon: <Minus className="h-4 w-4 text-blue-400" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/50',
        gradient: 'from-blue-500 to-blue-600'
    };

    // Rank 5+: Eliminated
    return { 
        icon: <ArrowDown className="h-4 w-4 text-red-500" />,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/50',
        gradient: 'from-red-500 to-red-600'
    };
  };

  // Check if standings data exists and is valid
  if (!standings?.groups || !Array.isArray(standings.groups) || standings.groups.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="py-12">
          <div className="text-muted-foreground text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <h3 className={`${moderniz.className} mb-2 text-2xl font-bold`}>No Data Available</h3>
            <p>Standings data is currently unavailable for this stage.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine columns based on esport type
  const type = standings.esport_type?.toLowerCase().trim() || '';
  const isValorant = type.includes('valorant');
  const isMLBB = type.includes('mobile legends') || type.includes('mlbb');

  return (
    <div className="space-y-8">
      {standings.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
            
            {/* Group Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                     <div className="h-8 w-1 bg-primary rounded-full" />
                     <h3 className={`${moderniz.className} text-xl md:text-2xl font-bold tracking-wide`}>
                        {group.group_name ?? standings.stage_name}
                     </h3>
                </div>
                <Badge variant="outline" className="text-xs uppercase tracking-widest bg-background/50 backdrop-blur-md">
                    {group.teams?.length ?? 0} Teams
                </Badge>
            </div>

            <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-md shadow-xl">
            <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block">
                <Table>
                    <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b border-white/5">
                        <TableHead className="w-20 pl-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Rank</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Team</TableHead>
                        <TableHead className="w-16 text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">MP</TableHead>
                        <TableHead className="w-16 text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">W-D-L</TableHead>
                        <TableHead className="w-20 text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">Pts</TableHead>
                        {isValorant && (
                            <TableHead className="w-24 text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground text-emerald-500">RND Δ</TableHead>
                        )}
                        {isMLBB && (
                            <TableHead className="w-24 text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground text-blue-400">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help border-b border-dotted border-blue-400/50">TIME</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-xs">
                                            <p>Average Win Duration. Used as a secondary tiebreaker (shorter is better).</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                        )}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {group.teams?.map((team) => {
                        const style = getPositionInfo(team.position);
                        const isRoundPositive = (team.round_difference || 0) > 0;
                        
                        return (
                        <TableRow
                            key={team.team_id}
                            className="group transition-colors hover:bg-muted/20 border-b border-border/30 last:border-0 relative"
                        >
                            <TableCell className="pl-6 py-4 font-medium relative">
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b", style.gradient)} />
                                <div className="flex items-center gap-2">
                                    <span className={cn(moderniz.className, "text-xl w-6 text-center", style.color)}>
                                        {team.position}
                                    </span>
                                    {style.icon}
                                </div>
                            </TableCell>

                            <TableCell className="py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-10 w-10 flex-shrink-0">
                                        <Image
                                            src={getSchoolLogo(team.school_abbreviation)}
                                            alt={team.school_name}
                                            fill
                                            className="object-contain drop-shadow-md"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                            {team.team_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                            {team.school_name}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell className="text-center py-4 text-muted-foreground font-medium">
                                {team.matches_played}
                            </TableCell>
                            <TableCell className="text-center py-4 font-medium">
                                <span className="text-emerald-500 font-bold">{team.wins}</span>
                                <span className="text-muted-foreground/30 mx-1">-</span>
                                <span className="text-muted-foreground">{team.draws}</span>
                                <span className="text-muted-foreground/30 mx-1">-</span>
                                <span className="text-red-500 font-bold">{team.losses}</span>
                            </TableCell>
                            
                            <TableCell className="text-center py-4">
                                <span className={cn(moderniz.className, "text-xl text-foreground font-bold")}>
                                    {team.points}
                                </span>
                            </TableCell>

                            {/* Round Differential (Valorant) */}
                            {isValorant && (
                                <TableCell className="text-center py-4">
                                    <span className={cn(
                                        "font-mono font-bold", 
                                        isRoundPositive ? "text-emerald-400" : (team.round_difference || 0) < 0 ? "text-red-400" : "text-muted-foreground"
                                    )}>
                                        {isRoundPositive ? '+' : ''}{team.round_difference}
                                    </span>
                                </TableCell>
                            )}

                            {/* Avg Win Time (MLBB) */}
                            {isMLBB && (
                                <TableCell className="text-center py-4">
                                    <span className="font-mono text-blue-400 font-medium tracking-tight">
                                        {team.avg_win_duration}
                                    </span>
                                </TableCell>
                            )}

                        </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
                </div>

                {/* Mobile Cards (Sleek List) */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                {group.teams?.map((team) => {
                    const style = getPositionInfo(team.position);
                    return (
                        <div
                        key={team.team_id}
                        className="relative bg-card/60 border border-border/40 rounded-xl overflow-hidden shadow-sm"
                        >
                        {/* Accent Strip */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b", style.gradient)} />

                        <div className="p-3 pl-5 flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex flex-col items-center justify-center w-8 gap-0.5">
                                <span className={cn(moderniz.className, "text-2xl leading-none", style.color)}>
                                    {team.position}
                                </span>
                                {style.icon && <div className="opacity-80">{style.icon}</div>}
                            </div>

                            {/* Team Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <Image
                                        src={getSchoolLogo(team.school_abbreviation)}
                                        alt={team.school_name}
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 object-contain"
                                    />
                                    <span className="font-bold text-sm truncate">{team.school_abbreviation}</span>
                                </div>
                                <div className="text-xs hidden md:flex text-muted-foreground truncate font-medium">
                                    {team.team_name}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                 {/* W-D-L Record */}
                                 <div className="flex flex-col items-center min-w-[2.5rem]">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">W-D-L</span>
                                    <div className="flex items-center gap-0.5 text-xs">
                                        <span className="font-bold text-emerald-500">{team.wins}</span>
                                        <span className="text-muted-foreground/30">-</span>
                                        <span className="text-muted-foreground">{team.draws}</span>
                                        <span className="text-muted-foreground/30">-</span>
                                        <span className="font-bold text-red-500">{team.losses}</span>
                                    </div>
                                 </div>

                                 {isValorant && (
                                     <div className="flex flex-col items-center min-w-[2.5rem]">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">RND</span>
                                         <span className={cn(
                                            "text-xs font-bold",
                                            (team.round_difference || 0) > 0 ? "text-emerald-500" : "text-muted-foreground"
                                        )}>
                                            {(team.round_difference || 0) > 0 ? '+' : ''}{team.round_difference}
                                        </span>
                                     </div>
                                 )}
                                 {isMLBB && (
                                     <div className="flex flex-col items-center min-w-[2.5rem]">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Time</span>
                                         <span className="text-xs font-bold text-blue-400">
                                            {team.avg_win_duration}
                                        </span>
                                     </div>
                                 )}

                                 <div className="flex flex-col items-center min-w-[3rem]">
                                     <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Pts</span>
                                     <span className={cn(moderniz.className, "text-xl text-foreground")}>
                                         {team.points}
                                     </span>
                                 </div>
                            </div>
                        </div>
                        </div>
                    );
                })}
                </div>
            </CardContent>
            </Card>
        </div>
      ))}
    </div>
  );
}
