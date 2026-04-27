'use client';

import { useState, useTransition } from 'react';
import { getRoleMastery } from '@/actions/statistics';
import { MLBB_ROLE_CONFIGS, VALORANT_ROLE_CONFIGS } from '@/lib/types/stats-enhanced';
import { cn } from '@/lib/utils';
import { roboto } from '@/lib/fonts';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type GameType = 'mlbb' | 'valorant';

interface RoleMasteryToggleProps {
  initialData: any[];
  initialGame: GameType;
  initialRole: string;
  seasonId?: number;
}

const gameAccents: Record<GameType, { gradient: string; border: string; text: string; bg: string; glow: string }> = {
  mlbb: {
    gradient: 'from-blue-500/80 to-blue-700/80',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    glow: 'shadow-[0_0_40px_-8px_var(--tw-shadow-color)] shadow-blue-500/30',
  },
  valorant: {
    gradient: 'from-red-500/80 to-rose-700/80',
    border: 'border-red-500/30',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    glow: 'shadow-[0_0_40px_-8px_var(--tw-shadow-color)] shadow-red-500/30',
  },
};

const rankIcons = [
  <Trophy key="1" className="w-5 h-5 text-yellow-400 drop-shadow-sm" />,
  <Medal key="2" className="w-5 h-5 text-zinc-300 drop-shadow-sm" />,
  <Award key="3" className="w-5 h-5 text-amber-700 drop-shadow-sm" />,
];

const rankBadgeColors = [
  'border-2 border-yellow-500/50 text-yellow-500 bg-yellow-500/10',
  'border-2 border-zinc-400/50 text-zinc-400 bg-zinc-400/10',
  'border-2 border-amber-600/50 text-amber-600 bg-amber-600/10',
];

export function RoleMasteryToggle({ initialData, initialGame, initialRole, seasonId }: RoleMasteryToggleProps) {
  const [division, setDivision] = useState<"Men's" | "Women's">("Men's");
  const [game, setGame] = useState<GameType>(initialGame);
  const [activeRole, setActiveRole] = useState(initialRole);
  const [data, setData] = useState<any[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const roleConfigs = game === 'mlbb' ? MLBB_ROLE_CONFIGS : VALORANT_ROLE_CONFIGS;
  const activeConfig = roleConfigs.find(r => r.role === activeRole) || roleConfigs[0];

  const fetchRole = (newGame: GameType, newRole: string, newDivision: "Men's" | "Women's") => {
    startTransition(async () => {
      const minGames = newDivision === "Men's" ? 3 : 1;
      const result = await getRoleMastery(newGame, newRole, 3, seasonId, newDivision, minGames);
      setData(result.data || []);
    });
  };

  const handleDivisionChange = (newDivision: "Men's" | "Women's") => {
    if (newDivision === division) return;
    setDivision(newDivision);
    fetchRole(game, activeRole, newDivision);
  };

  const handleGameChange = (newGame: GameType) => {
    if (newGame === game) return;
    setGame(newGame);
    const firstRole = newGame === 'mlbb' ? MLBB_ROLE_CONFIGS[0].role : VALORANT_ROLE_CONFIGS[0].role;
    setActiveRole(firstRole);
    fetchRole(newGame, firstRole, division);
  };

  const handleRoleChange = (newRole: string) => {
    if (newRole === activeRole) return;
    setActiveRole(newRole);
    fetchRole(game, newRole, division);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {division === "Men's" && (
        <p className="text-sm tracking-wider text-muted-foreground/80 text-center mb-4 mt-1 animate-in fade-in duration-300">
          (Minimum 3 Games Played)
        </p>
      )}

      {/* Toggles Container */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
        {/* Division Toggle */}
        <div className="inline-flex items-center rounded-xl bg-muted/40 border border-border/40 p-1.5 backdrop-blur-sm">
          <button
            onClick={() => handleDivisionChange("Men's")}
            className={cn(
              `${roboto.className} px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 min-w-[110px]`,
              division === "Men's"
                ? 'bg-foreground text-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Men&apos;s
          </button>
          <button
            onClick={() => handleDivisionChange("Women's")}
            className={cn(
              `${roboto.className} px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 min-w-[110px]`,
              division === "Women's"
                ? 'bg-foreground text-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Women&apos;s
          </button>
        </div>

        {/* Game Toggle */}
        <div className="inline-flex items-center rounded-xl bg-muted/40 border border-border/40 p-1.5 backdrop-blur-sm">
          <button
            onClick={() => handleGameChange('mlbb')}
            className={cn(
              `${roboto.className} px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 min-w-[110px]`,
              game === 'mlbb'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            MLBB
          </button>
          <button
            onClick={() => handleGameChange('valorant')}
            className={cn(
              `${roboto.className} px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 min-w-[110px]`,
              game === 'valorant'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Valorant
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex flex-wrap items-center justify-center gap-2">
          {roleConfigs.map((config) => {
            const isActive = activeRole === config.role;
            return (
              <button
                key={config.role}
                onClick={() => handleRoleChange(config.role)}
                className={cn(
                  `${roboto.className} px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border`,
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Board */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <div className={cn(
          'bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-opacity duration-300',
          isPending && 'opacity-50'
        )}>
          {/* Header */}
          <div className="bg-muted/30 p-5 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl tracking-tight text-foreground flex items-center gap-2">
                {activeConfig.label} Mastery
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeConfig.description}
              </p>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 bg-background/80 px-3 py-1.5 rounded-md border border-border/40 inline-block w-fit">
              Mastery Score
            </div>
          </div>

          {/* Player List */}
          <div className="p-2 sm:p-4 space-y-1">
            {data.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12 flex flex-col items-center gap-3">
                <Trophy className="w-10 h-10 opacity-10" />
                <span>No data for this role yet</span>
              </div>
            ) : (
              data.map((player: any, index: number) => {
                const isFirst = index === 0;
                return (
                  <motion.div
                    key={`${activeRole}-${player.player_id}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex items-center gap-3.5 p-3 sm:p-4 rounded-xl transition-all duration-300 border border-transparent',
                      'hover:bg-muted/40 relative overflow-hidden',
                      isFirst && 'bg-primary/5 border-primary/20 shadow-sm'
                    )}
                  >
                    {/* Rank Badge */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 z-10',
                      index < 3 ? rankBadgeColors[index] : 'bg-muted text-muted-foreground font-semibold'
                    )}>
                      {index < 3 ? rankIcons[index] : index + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0 z-10">
                      <p className={cn(
                        'font-bold text-base truncate tracking-tight',
                        isFirst ? 'text-primary' : 'text-foreground'
                      )}>
                        {player.player_ign}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {player.team_logo_url && (
                          <div className="relative w-4 h-4 flex-shrink-0">
                            <Image src={player.team_logo_url} alt={player.team_name || ''} fill className="object-contain" />
                          </div>
                        )}
                        <span className="truncate font-medium">{player.team_name || 'No Team'}</span>
                      </div>
                      
                      {/* Breakdown tags */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {player.breakdown?.map((b: { label: string; value: string }, bi: number) => (
                          <span
                            key={bi}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50"
                          >
                            <span className="text-foreground">{b.value}</span> {b.label}
                          </span>
                        ))}
                        <span className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5 before:content-['•'] before:opacity-50 ml-1">
                          {player.games_played}G
                          {player.unique_characters > 0 && ` · ${player.unique_characters} ${game === 'mlbb' ? 'heroes' : 'agents'}`}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className={cn('text-right z-10', isFirst ? 'text-primary' : 'text-foreground')}>
                      <span className="font-black text-2xl sm:text-3xl tabular-nums tracking-tighter">
                        {(player.mastery_score || 0).toFixed(3)}
                      </span>
                    </div>
                  </motion.div>
                  );
                })
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
