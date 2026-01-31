'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Game } from '@/lib/types/matches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy } from 'lucide-react';
import { getValorantStatsByGameId } from '@/actions/stats-valorant';
import { getMlbbStatsByGameId } from '@/actions/stats-mlbb';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PublicMatchStatsProps {
  games: Game[];
  sport: 'Valorant' | 'Mobile Legends: Bang Bang' | string;
}

export function PublicMatchStats({ games, sport }: PublicMatchStatsProps) {
  const [activeGameId, setActiveGameId] = useState<string>(games[0]?.id.toString());
  
  // Sort games by sequence
  const sortedGames = [...games].sort((a, b) => a.game_number - b.game_number);

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No games recorded for this match yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={sortedGames[0]?.id.toString()} onValueChange={setActiveGameId}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {sortedGames.map((game) => (
            <TabsTrigger key={game.id} value={game.id.toString()}>
              Game {game.game_number}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedGames.map((game) => (
          <TabsContent key={game.id} value={game.id.toString()}>
            <GameStatsViewer gameId={game.id} sport={sport} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function GameStatsViewer({ gameId, sport }: { gameId: number; sport: string }) {
  const isValorant = sport === 'Valorant';
  const isMlbb = sport === 'Mobile Legends: Bang Bang';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['game-stats', gameId, sport],
    queryFn: async () => {
      if (isValorant) {
        const res = await getValorantStatsByGameId(gameId);
        if (!res.success) throw new Error(res.error);
        return res.data;
      } else if (isMlbb) {
        const res = await getMlbbStatsByGameId(gameId);
        if (!res.success) throw new Error(res.error);
        return res.data;
      }
      return [];
    },
    enabled: !!gameId && (isValorant || isMlbb),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || stats.length === 0) {
     return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
             No statistics available for this game.
          </CardContent>
        </Card>
     );
  }

  // Group by team
  // We need to know which team is home/away OR just group by team_id
  // The stats object has schools_teams relation
  const teams = Array.from(new Set(stats.map((s: any) => s.schools_teams?.id))).filter(Boolean);
  
  return (
    <div className="space-y-8">
      {teams.map((teamId) => {
        const teamStats = stats.filter((s: any) => s.schools_teams?.id === teamId);
        const teamInfo = teamStats[0]?.schools_teams;
        if (!teamInfo) return null;

        return (
          <div key={teamId} className="space-y-4">
             <div className="flex items-center gap-3 border-b pb-2">
                   <div className="relative">
                    <Image 
                      src={teamInfo.schools?.logo_url || '/placeholder.png'} 
                      alt={teamInfo.name} 
                      width={40} 
                      height={40} 
                      className="rounded-full object-cover border"
                    />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold font-mango-grotesque">
                      {teamInfo.schools?.name} ({teamInfo.name})
                    </h3>
                 </div>
             </div>

             <div className="rounded-md border overflow-hidden">
                <Table>
                   <TableHeader className="bg-muted/50">
                      <TableRow>
                         <TableHead>Player</TableHead>
                         {isValorant && (
                           <>
                             <TableHead>Agent</TableHead>
                             <TableHead className="text-center">ACS</TableHead>
                             <TableHead className="text-center">K</TableHead>
                             <TableHead className="text-center">D</TableHead>
                             <TableHead className="text-center">A</TableHead>
                           </>
                         )}
                         {isMlbb && (
                           <>
                             <TableHead>Hero</TableHead>
                             <TableHead className="text-center">K</TableHead>
                             <TableHead className="text-center">D</TableHead>
                             <TableHead className="text-center">A</TableHead>
                             <TableHead className="text-center">Gold</TableHead>
                           </>
                         )}
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {teamStats.map((stat: any) => (
                        <TableRow key={stat.id}>
                           <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {stat.players?.ign || 'Unknown'}
                                {/* Use realName if available? */}
                              </div>
                           </TableCell>
                           {isValorant && (
                             <>
                               <TableCell>{stat.agent_name}</TableCell>
                               <TableCell className="text-center font-mono">{stat.acs}</TableCell>
                               <TableCell className="text-center font-mono text-green-600">{stat.kills}</TableCell>
                               <TableCell className="text-center font-mono text-red-600">{stat.deaths}</TableCell>
                               <TableCell className="text-center font-mono">{stat.assists}</TableCell>
                             </>
                           )}
                           {isMlbb && (
                             <>
                               <TableCell>{stat.hero_name}</TableCell>
                               <TableCell className="text-center font-mono text-green-600">{stat.kills}</TableCell>
                               <TableCell className="text-center font-mono text-red-600">{stat.deaths}</TableCell>
                               <TableCell className="text-center font-mono">{stat.assists}</TableCell>
                               <TableCell className="text-center font-mono text-yellow-600">
                                 {(stat.gold || 0).toLocaleString()}
                               </TableCell>
                             </>
                           )}
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </div>
          </div>
        );
      })}
    </div>
  );
}
