'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from '@/services/statistics';
import Link from 'next/link';
import { ChevronRight, Trophy } from 'lucide-react';
import Image from 'next/image';

interface LeaderboardCardProps {
  title: string;
  game: 'mlbb' | 'valorant';
  metric: string;
  data: LeaderboardEntry[];
  icon?: React.ReactNode;
}

export function LeaderboardCard({ title, game, metric, data, icon }: LeaderboardCardProps) {
  const gameColor = game === 'mlbb' ? 'text-blue-500' : 'text-red-500';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {icon || <Trophy className={`h-5 w-5 ${gameColor}`} />}
            {title}
          </CardTitle>
          <Badge variant="outline" className="uppercase text-xs font-semibold">
            {game}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No data available yet.
            </div>
          ) : (
            data.map((player, index) => (
              <div key={player.player_id} className="flex items-center gap-3">
                <div className="font-mono text-sm font-bold text-muted-foreground w-4">
                  {index + 1}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.player_photo_url || ''} alt={player.player_ign} />
                  <AvatarFallback>{player.player_ign.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{player.player_ign}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {player.team_logo_url && (
                        <div className="relative w-3 h-3">
                            <Image 
                                src={player.team_logo_url} 
                                alt={player.team_name || ''}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                    <span className="truncate">{player.team_name}</span>
                  </div>
                </div>
                
                <div className="font-bold text-sm">
                  {typeof player.value === 'number' && !Number.isInteger(player.value) 
                    ? player.value.toFixed(1) 
                    : player.value}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Link 
            href="/statistics" 
            className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 transition-colors"
          >
            View Full Leaderboard <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
