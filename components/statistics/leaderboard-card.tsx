'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/services/statistics';
import { Trophy, Medal, Award } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardCardProps {
  title: string;
  game: 'mlbb' | 'valorant';
  metric: string;
  data: LeaderboardEntry[];
  icon?: React.ReactNode;
  iconImage?: string;
  accentColor?: 'blue' | 'red' | 'yellow' | 'green';
  delay?: number;
}

const accentColors = {
  blue: {
    gradient: 'from-blue-500/80 to-blue-700/80',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-blue-500/30',
  },
  red: {
    gradient: 'from-red-500/80 to-rose-700/80',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-red-500/30',
  },
  yellow: {
    gradient: 'from-amber-400/80 to-orange-600/80',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-amber-500/30',
  },
  green: {
    gradient: 'from-emerald-400/80 to-green-600/80',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-emerald-500/30',
  },
};

const rankIcons = [
  <Trophy key="1" className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />,
  <Medal key="2" className="w-5 h-5 text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]" />,
  <Award key="3" className="w-5 h-5 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />,
];

const rankBadgeColors = [
  'bg-gradient-to-br from-yellow-300 to-amber-600 text-white shadow-lg shadow-yellow-500/20',
  'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white shadow-lg shadow-zinc-500/20',
  'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/20',
];

export function LeaderboardCard({
  title,
  game,
  metric,
  data,
  icon,
  iconImage,
  accentColor = game === 'mlbb' ? 'blue' : 'red',
  delay = 0,
}: LeaderboardCardProps) {
  const colors = accentColors[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="h-full group"
    >
      <Card className={cn(
        'h-full relative overflow-hidden transition-all duration-500',
        'hover:-translate-y-2 hover:bg-card/80 backdrop-blur-sm',
        colors.glow,
        'border-border/30 hover:border-border/60'
      )}>
        {/* Accent gradient top border */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity',
          `bg-gradient-to-r ${colors.gradient}`
        )} />
        
        {/* Subtle background glow from top border */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-24 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity -z-10',
          `bg-gradient-to-b ${colors.gradient} to-transparent`
        )} />

        <CardHeader className="pb-5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon container with accent background */}
              <div className={cn(
                'p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-inner',
                colors.bg,
                colors.text,
                colors.border,
                'border'
              )}>
                {iconImage ? (
                  <div className="relative w-6 h-6">
                    <Image src={iconImage} alt={game} fill className="object-contain drop-shadow-md" />
                  </div>
                ) : icon ? (
                  icon
                ) : (
                  <Trophy className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-xl tracking-tight">{title}</h3>
                <p className={cn(
                  "text-xs uppercase tracking-widest font-semibold mt-0.5",
                  colors.text
                )}>{game}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 relative z-10">
          <div className="space-y-2">
            {data.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10 flex flex-col items-center gap-3">
                <Trophy className="w-10 h-10 opacity-10" />
                <span>No data available yet</span>
              </div>
            ) : (
              data.map((player, index) => (
                <div
                  key={`${player.player_id}-${index}`}
                  className={cn(
                    'flex items-center gap-3.5 p-2.5 rounded-xl transition-all duration-300',
                    'hover:bg-muted/60 relative overflow-hidden',
                    index === 0 && `bg-gradient-to-r ${colors.bg} to-transparent border-l-2 ${colors.border}`
                  )}
                >
                  {/* Rank Badge */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 z-10',
                    index < 3 ? rankBadgeColors[index] : 'bg-muted/50 text-muted-foreground font-semibold'
                  )}>
                    {index < 3 ? rankIcons[index] : index + 1}
                  </div>

                  {/* Player Avatar */}
                  <Avatar className={cn(
                    'h-11 w-11 border-2 shadow-sm z-10 transition-transform duration-300 group-hover/row:scale-105',
                    index === 0 ? `border-${accentColor}-500/50 shadow-${accentColor}-500/20` : 'border-border'
                  )}>
                    <AvatarImage src={player.player_photo_url || ''} alt={player.player_ign} className="object-cover" />
                    <AvatarFallback className="text-xs font-bold bg-background">
                      {player.player_ign.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0 z-10">
                    <p className={cn(
                      'font-bold truncate tracking-tight transition-colors',
                      index === 0 ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                    )}>
                      {player.player_ign}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      {player.team_logo_url && (
                        <div className="relative w-4 h-4 flex-shrink-0">
                          <Image
                            src={player.team_logo_url}
                            alt={player.team_name || ''}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span className="truncate flex-1 font-medium">{player.team_name || 'No Team'}</span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className={cn(
                    'text-right z-10',
                    index === 0 ? colors.text : 'text-foreground/90'
                  )}>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        'font-black tabular-nums tracking-tighter',
                        index === 0 ? 'text-2xl drop-shadow-sm' : 'text-lg'
                      )}>
                        {typeof player.value === 'number' && !Number.isInteger(player.value)
                          ? player.value.toFixed(1)
                          : player.value}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 -mt-1 tracking-wider">{metric}</span>
                    </div>
                  </div>
                  
                  {/* Subtle highlight effect for 1st place row */}
                  {index === 0 && (
                     <div className={cn(
                       "absolute right-0 top-0 bottom-0 w-24 opacity-10 bg-gradient-to-l to-transparent pointer-events-none",
                       colors.gradient
                     )} />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
