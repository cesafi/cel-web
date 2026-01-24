'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from '@/services/statistics';
import { Trophy, Medal, Award } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  title: string;
  game: 'mlbb' | 'valorant';
  metric: string;
  data: LeaderboardEntry[];
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'red' | 'yellow' | 'green';
}

const accentColors = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/20',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20',
  },
  yellow: {
    gradient: 'from-yellow-500 to-amber-600',
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'shadow-yellow-500/20',
  },
  green: {
    gradient: 'from-green-500 to-emerald-600',
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/20',
  },
};

const rankIcons = [
  <Trophy key="1" className="w-4 h-4 text-yellow-500" />,
  <Medal key="2" className="w-4 h-4 text-gray-400" />,
  <Award key="3" className="w-4 h-4 text-amber-700" />,
];

const rankBadgeColors = [
  'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
  'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
  'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
];

export function LeaderboardCard({
  title,
  game,
  metric,
  data,
  icon,
  accentColor = game === 'mlbb' ? 'blue' : 'red'
}: LeaderboardCardProps) {
  const colors = accentColors[accentColor];

  return (
    <Card className={cn(
      'h-full relative overflow-hidden transition-all duration-300',
      'hover:shadow-xl hover:-translate-y-1',
      `hover:${colors.glow}`,
      'border-border/50'
    )}>
      {/* Accent gradient top border */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        `bg-gradient-to-r ${colors.gradient}`
      )} />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon container with accent background */}
            <div className={cn(
              'p-2.5 rounded-xl',
              colors.bg,
              colors.text
            )}>
              {icon || <Trophy className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{game}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
              No data available yet
            </div>
          ) : (
            data.map((player, index) => (
              <div
                key={player.player_id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  index === 0 && 'bg-yellow-500/5 border border-yellow-500/10',
                  index > 0 && 'hover:bg-muted/50'
                )}
              >
                {/* Rank Badge */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  index < 3 ? rankBadgeColors[index] : 'bg-muted text-muted-foreground'
                )}>
                  {index < 3 ? rankIcons[index] : index + 1}
                </div>

                {/* Player Avatar */}
                <Avatar className={cn(
                  'h-10 w-10 border-2',
                  index === 0 ? 'border-yellow-500/50' : 'border-border'
                )}>
                  <AvatarImage src={player.player_photo_url || ''} alt={player.player_ign} />
                  <AvatarFallback className="text-xs font-semibold">
                    {player.player_ign.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold truncate',
                    index === 0 ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {player.player_ign}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {player.team_logo_url && (
                      <div className="relative w-3.5 h-3.5 flex-shrink-0">
                        <Image
                          src={player.team_logo_url}
                          alt={player.team_name || ''}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="truncate">{player.team_name || 'No Team'}</span>
                  </div>
                </div>

                {/* Value */}
                <div className={cn(
                  'text-right',
                  index === 0 ? colors.text : ''
                )}>
                  <span className={cn(
                    'font-bold text-lg',
                    index === 0 && 'text-xl'
                  )}>
                    {typeof player.value === 'number' && !Number.isInteger(player.value)
                      ? player.value.toFixed(1)
                      : player.value}
                  </span>
                  <p className="text-xs text-muted-foreground">{metric}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
