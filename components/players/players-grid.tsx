'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { roboto } from '@/lib/fonts';
import { Search, X, Loader2 } from 'lucide-react';
import { getMlbbStats, getValorantStats, getAvailableSeasons, getTeamStats } from '@/actions/statistics';
import { GameModeSelector } from '@/components/statistics/game-mode-selector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toPlayerSlug } from '@/lib/utils/player-slug';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type GameType = 'mlbb' | 'valorant';
type FilterOption = { id: number | string; label: string; value: string };

export default function PlayersGrid() {
  const [game, setGame] = useState<GameType>('mlbb');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [seasons, setSeasons] = useState<FilterOption[]>([]);
  const [teams, setTeams] = useState<FilterOption[]>([]);

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Fetch seasons on mount
  useEffect(() => {
    async function fetchSeasons() {
      setFiltersLoading(true);
      const result = await getAvailableSeasons();
      if (result.success && result.data) {
        const mapped = result.data.map((s: any) => ({
          id: s.id,
          label: s.name || `Season ${s.id}`,
          value: s.id.toString()
        }));
        setSeasons(mapped);
      }
      setFiltersLoading(false);
    }
    fetchSeasons();
  }, []);

  // Fetch teams when season or game changes (cascading)
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedSeason) {
        setTeams([]);
        return;
      }
      const result = await getTeamStats(game, selectedSeason);
      if (result.success && result.data) {
        const mapped = (result.data as any[]).map((t: any) => ({
          id: t.team_id,
          label: t.team_name,
          value: t.team_id
        }));
        const unique = Array.from(new Map(mapped.map((t: any) => [t.value, t])).values());
        setTeams(unique as FilterOption[]);
      }
    }
    fetchTeams();
  }, [selectedSeason, game]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch players based on filters
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        season_id: selectedSeason || undefined,
        team_id: selectedTeam || undefined,
        search_query: debouncedSearch || undefined,
      };

      const result = game === 'mlbb'
        ? await getMlbbStats(filters)
        : await getValorantStats(filters);

      if (result.success && result.data) {
        setPlayers(result.data as any[]);
      } else {
        setPlayers([]);
      }
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [game, selectedSeason, selectedTeam, debouncedSearch]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleGameChange = (newGame: GameType) => {
    setGame(newGame);
    setSelectedTeam(null);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleSeasonChange = (seasonId: number | null) => {
    setSelectedSeason(seasonId);
    setSelectedTeam(null);
  };

  const handleClearFilters = () => {
    setSelectedSeason(null);
    setSelectedTeam(null);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const hasActiveFilters = selectedSeason || selectedTeam || searchQuery;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Game Mode Selector — reused from statistics page */}
      <GameModeSelector
        game={game}
        onGameChange={handleGameChange}
        subtitle="Click to view players"
        className="mb-6"
      />

      {/* Cascading Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        {/* Season */}
        <select
          value={selectedSeason?.toString() || ''}
          onChange={(e) => handleSeasonChange(e.target.value ? Number(e.target.value) : null)}
          disabled={filtersLoading}
          className={cn(
            `${roboto.className} px-4 py-2.5 rounded-xl border border-border/50 bg-card/60 text-sm text-foreground`,
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all',
            'appearance-none cursor-pointer w-full sm:w-auto sm:min-w-[160px]',
            filtersLoading && 'opacity-50'
          )}
        >
          <option value="">All Seasons</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Team */}
        <select
          value={selectedTeam || ''}
          onChange={(e) => setSelectedTeam(e.target.value || null)}
          disabled={!selectedSeason || teams.length === 0}
          className={cn(
            `${roboto.className} px-4 py-2.5 rounded-xl border border-border/50 bg-card/60 text-sm text-foreground`,
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all',
            'appearance-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]',
            (!selectedSeason || teams.length === 0) && 'opacity-50'
          )}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by IGN, team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base border-2 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:shadow-lg focus:shadow-primary/20"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className={`${roboto.className} text-xs text-muted-foreground/50 mb-4`}>
        {loading ? 'Loading...' : `${players.length} player${players.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Players Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : players.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {players.map((player: any, index: number) => {
            const kda = player.total_deaths > 0
              ? ((player.total_kills + player.total_assists) / player.total_deaths).toFixed(2)
              : 'Perfect';
            return (
              <motion.div
                key={player.player_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
              >
                {(() => {
                  const schoolAbbr = player.school_abbreviation || player.team_name?.split(' ')[0] || '';
                  const playerHref = schoolAbbr
                    ? `/schools/${schoolAbbr.toLowerCase()}/players/${toPlayerSlug(player.player_ign || '')}`
                    : null;
                  const cardContent = (
                    <div className="rounded-xl border border-border/40 bg-card/60 hover:border-border/60 hover:bg-card/80 transition-all duration-300 p-3 sm:p-4 text-center">
                      {/* Photo */}
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14 mx-auto mb-2 sm:mb-3">
                        {player.player_photo_url ? (
                          <Image
                            src={player.player_photo_url}
                            alt={player.player_ign || ''}
                            fill
                            className="rounded-full object-cover border border-border/40"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-muted/50 flex items-center justify-center border border-border/40">
                            <span className="text-base sm:text-lg font-bold text-muted-foreground/30">
                              {player.player_ign?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* IGN */}
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {player.player_ign || 'Unknown'}
                      </h3>

                      {/* Team / School */}
                      <div className="mt-1 sm:mt-1.5 flex items-center justify-center gap-1.5">
                        {player.team_logo_url && (
                          <Image
                            src={player.team_logo_url}
                            alt=""
                            width={14}
                            height={14}
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full object-cover"
                          />
                        )}
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground/50 truncate">
                          {player.school_abbreviation || player.team_name || ''}
                        </span>
                      </div>

                      {/* Stats preview */}
                      <div className="mt-2 pt-2 border-t border-border/20 space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/40">KDA</span>
                          <span className="font-medium text-foreground/70">{kda}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/40">GP</span>
                          <span className="font-medium text-foreground/70">{player.games_played || 0}</span>
                        </div>
                        {game === 'mlbb' && player.avg_rating != null && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground/40">Rating</span>
                            <span className="font-medium text-foreground/70">{Number(player.avg_rating).toFixed(2)}</span>
                          </div>
                        )}
                        {game === 'valorant' && player.avg_acs != null && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground/40">ACS</span>
                            <span className="font-medium text-foreground/70">{Math.round(player.avg_acs)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  return playerHref ? (
                    <Link href={playerHref} className="group block">{cardContent}</Link>
                  ) : (
                    <div className="group block">{cardContent}</div>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-card/60 p-12 sm:p-16 text-center">
          <Search className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground/60 text-sm">
            No players found. Try adjusting your filters.
          </p>
        </div>
      )}
    </section>
  );
}
