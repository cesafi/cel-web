'use client';

import { useState, useEffect, useTransition } from 'react';
import { getRoleMastery } from '@/actions/statistics';
import { MLBB_ROLE_CONFIGS, VALORANT_ROLE_CONFIGS, RoleMasteryConfig } from '@/lib/types/stats-enhanced';
import { cn } from '@/lib/utils';
import { roboto } from '@/lib/fonts';
import { Trophy, Medal, Award, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type GameType = 'mlbb' | 'valorant';

interface RoleMasteryTableProps {
  game: GameType;
  seasonId?: number | null;
  stageId?: number | null;
  division?: string;
}

const rankIcons = [
  <Trophy key="1" className="w-4 h-4 text-yellow-400 drop-shadow-sm" />,
  <Medal key="2" className="w-4 h-4 text-zinc-300 drop-shadow-sm" />,
  <Award key="3" className="w-4 h-4 text-amber-700 drop-shadow-sm" />,
];

const rankBadgeColors = [
  'border-2 border-yellow-500/50 text-yellow-500 bg-yellow-500/10',
  'border-2 border-zinc-400/50 text-zinc-400 bg-zinc-400/10',
  'border-2 border-amber-600/50 text-amber-600 bg-amber-600/10',
];

function RoleMasterySection({
  config,
  game,
  seasonId,
  division,
}: {
  config: RoleMasteryConfig;
  game: GameType;
  seasonId?: number | null;
  division?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const minGames = division === "Women's" ? 1 : 3;

    getRoleMastery(game, config.role, 10, seasonId || undefined, division, minGames).then(result => {
      if (mounted) {
        setData(result.data || []);
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, [game, config.role, seasonId, division]);

  return (
    <div className={cn(
      'rounded-2xl border border-border/50 overflow-hidden transition-all duration-500 backdrop-blur-sm',
      'bg-card shadow-sm'
    )}>

      {/* Header — clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between p-4 sm:p-5 transition-colors hover:bg-muted/40 bg-muted/20 border-b border-border/30'
        )}
      >
        <div className="flex flex-col text-left">
          <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
            {config.label}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-muted-foreground transition-transform duration-300',
          expanded && 'rotate-180'
        )} />
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:px-0 sm:pb-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : data.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">
                  No players found for this role
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[700px] w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-[3rem_1.5fr_3rem_3.5rem_repeat(4,minmax(0,1fr))_5rem] gap-2 px-5 py-3 text-[10px] sm:text-xs font-bold text-muted-foreground/70 uppercase tracking-wider border-b border-border/30 bg-muted/10">
                      <span className="text-center">Rank</span>
                      <span>Player</span>
                      <span className="text-right">G</span>
                      <span className="text-right">{game === 'mlbb' ? 'Heroes' : 'Agents'}</span>
                      {data[0]?.breakdown?.map((b: { label: string }, bi: number) => (
                        <span key={bi} className="text-right">{b.label}</span>
                      ))}
                      <span className="text-right">Score</span>
                    </div>

                    {/* Rows */}
                    <div className="space-y-0 pb-2">
                      {data.map((player: any, index: number) => {
                        const isFirst = index === 0;
                        return (
                          <motion.div
                            key={`${player.player_id}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.25 }}
                            className={cn(
                              'grid grid-cols-[3rem_1.5fr_3rem_3.5rem_repeat(4,minmax(0,1fr))_5rem] gap-2 items-center px-5 py-3 transition-all duration-200 border-b border-border/20 last:border-0',
                              'hover:bg-muted/30',
                              isFirst && 'bg-primary/5'
                            )}
                          >
                            {/* Rank */}
                            <div className="flex justify-center">
                              <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0',
                                index < 3 ? rankBadgeColors[index] : 'bg-muted text-muted-foreground font-semibold'
                              )}>
                                {index < 3 ? rankIcons[index] : index + 1}
                              </div>
                            </div>

                            {/* Player */}
                            <div className="min-w-0 flex flex-col justify-center">
                              <p className={cn("font-bold text-sm truncate", isFirst ? "text-primary" : "text-foreground")}>{player.player_ign}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                {player.team_logo_url && (
                                  <div className="relative w-3.5 h-3.5 flex-shrink-0">
                                    <Image src={player.team_logo_url} alt={player.team_name || ''} fill className="object-contain" />
                                  </div>
                                )}
                                <span className="truncate">{player.team_name || 'No Team'}</span>
                              </div>
                            </div>

                            {/* Games Played */}
                            <div className="text-right text-sm font-medium tabular-nums text-muted-foreground">
                              {player.games_played}
                            </div>

                            {/* Unique Characters */}
                            <div className="text-right text-sm font-medium tabular-nums text-muted-foreground">
                              {player.unique_characters || '-'}
                            </div>

                            {/* Breakdown Columns */}
                            {player.breakdown?.map((b: { label: string; value: string }, bi: number) => (
                              <div key={bi} className={cn(
                                'text-right text-sm font-semibold tabular-nums text-foreground/80'
                              )}>
                                {b.value}
                              </div>
                            ))}

                            {/* Score */}
                            <div className={cn(
                              'text-right font-black tabular-nums tracking-tight text-base',
                              isFirst ? 'text-primary' : 'text-foreground'
                            )}>
                              {(player.mastery_score || 0).toFixed(3)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoleMasteryTable({ game, seasonId, stageId, division }: RoleMasteryTableProps) {
  const roleConfigs = game === 'mlbb' ? MLBB_ROLE_CONFIGS : VALORANT_ROLE_CONFIGS;
  const [activeRole, setActiveRole] = useState(roleConfigs[0].role);

  // When game changes, reset to the first role of the new game
  useEffect(() => {
    setActiveRole(game === 'mlbb' ? MLBB_ROLE_CONFIGS[0].role : VALORANT_ROLE_CONFIGS[0].role);
  }, [game]);

  const activeConfig = roleConfigs.find(r => r.role === activeRole) || roleConfigs[0];

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 backdrop-blur-sm',
        roboto.className
      )}>
        <div className="text-2xl"><Trophy className="w-6 h-6 text-primary" /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">Role Mastery Rankings</p>
          <p className="text-xs text-muted-foreground">
            Players are scored on a 0–1 index using composite formulas. A confidence multiplier penalizes players with fewer games.
            {game === 'mlbb'
              ? ' e.g. Roamers are weighted by TF%, Assists, and Dmg Taken.'
              : ' e.g. Duelists are weighted by First Bloods, ACS, and Kills.'}
          </p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {roleConfigs.map((config) => {
          const isActive = activeRole === config.role;
          return (
            <button
              key={config.role}
              onClick={() => setActiveRole(config.role)}
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

      {/* Active Role Section */}
      <RoleMasterySection
        config={activeConfig}
        game={game}
        seasonId={seasonId}
        division={division}
      />
    </div>
  );
}
