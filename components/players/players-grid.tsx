'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { roboto } from '@/lib/fonts';
import { Search, X, Loader2 } from 'lucide-react';
import { getMlbbStats, getValorantStats, getAvailableSeasons, getTeamStats } from '@/actions/statistics';
import { CompactGameSelector, GameOption } from '@/components/shared/filters/compact-game-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toPlayerSlug } from '@/lib/utils/player-slug';
import { RichSportCategory } from '../schedule/schedule-content';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type GameType = 'mlbb' | 'valorant' | 'all';
type FilterOption = { id: number | string; label: string; value: string };

export default function PlayersGrid( { availableRichSports }: { availableRichSports: RichSportCategory[]; }) {
  const [game, setGame] = useState<GameType | string>('all');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [seasons, setSeasons] = useState<FilterOption[]>([]);
  const [teams, setTeams] = useState<FilterOption[]>([]);

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const uniqueEsports = useMemo(() => {
    if (!availableRichSports || availableRichSports.length === 0) return [];
    
    const map = new Map();
    availableRichSports.forEach(cat => {
      if (cat.esport && !map.has(cat.esport.id)) {
        map.set(cat.esport.id, cat.esport);
      }
    });
    return Array.from(map.values());
  }, [availableRichSports]);

  const gameOptions: GameOption[] = useMemo(() => {
      const options: GameOption[] = [{ id: 'all', name: 'All Esports', shortName: 'All Games' }];
      
      const sortedEsports = [...uniqueEsports].sort((a, b) => {
        if (a.name.toLowerCase().includes('mobile legends')) return -1;
        if (b.name.toLowerCase().includes('mobile legends')) return 1;
        return 0;
      });

      sortedEsports.forEach(esport => {
        const gameId = esport.name.toLowerCase().includes('valorant') ? 'valorant' : 'mlbb';
        options.push({
          id: gameId,
          name: esport.name,
          shortName: esport.abbreviation || gameId.toUpperCase(),
          logoUrl: esport.logo_url
        });
      });
      return options;
    }, [uniqueEsports]);

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
      
      const isMLBB = game === 'all' || game === 'mlbb' || game === '2';
      const isVAL = game === 'all' || game === 'valorant' || game === '1';

      let allTeams: FilterOption[] = [];

      if (isMLBB) {
        const result = await getTeamStats('mlbb', selectedSeason);
        if (result.success && result.data) {
          const mapped = (result.data as any[]).map((t: any) => ({
            id: `mlbb-${t.team_id}`,
            label: t.team_name,
            value: t.team_id
          }));
          allTeams = [...allTeams, ...mapped];
        }
      }

      if (isVAL) {
        const result = await getTeamStats('valorant', selectedSeason);
        if (result.success && result.data) {
          const mapped = (result.data as any[]).map((t: any) => ({
            id: `val-${t.team_id}`,
            label: t.team_name,
            value: t.team_id
          }));
          allTeams = [...allTeams, ...mapped];
        }
      }

      const unique = Array.from(new Map(allTeams.map((t: any) => [t.value, t])).values());
      setTeams(unique as FilterOption[]);
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

      const isMLBB = game === 'all' || game === 'mlbb' || game === '2';
      const isVAL = game === 'all' || game === 'valorant' || game === '1';

      let combinedPlayers: any[] = [];

      if (isMLBB) {
        const result = await getMlbbStats(filters);
        if (result.success && result.data) {
          combinedPlayers = [...combinedPlayers, ...(result.data as any[]).map(p => ({ ...p, game: 'mlbb' }))];
        }
      }

      if (isVAL) {
        const result = await getValorantStats(filters);
        if (result.success && result.data) {
          combinedPlayers = [...combinedPlayers, ...(result.data as any[]).map(p => ({ ...p, game: 'valorant' }))];
        }
      }

      // De-duplicate if same player ID shows up in both? (unlikely but safe)
      // and sort by IGN
      combinedPlayers.sort((a, b) => (a.player_ign || '').localeCompare(b.player_ign || ''));
      
      setPlayers(combinedPlayers);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [game, selectedSeason, selectedTeam, debouncedSearch]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleGameChange = (newGame: string) => {
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
      {/* Search and Filters Container */}
      <div className="w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-lg rounded-xl overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4">
          {/* Left: Game Selector Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <CompactGameSelector 
              options={gameOptions}
              value={game}
              onChange={(val) => handleGameChange(val)}
              variant="buttons"
            />
          </div>

          {/* Right: Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 text-sm border transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Second Row for individual filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 p-3 sm:p-4 bg-muted/20 border-t border-border/50">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground mr-1 hidden sm:inline-block">Filters:</span>

          {/* Mobile Game Selector */}
          <div className="sm:hidden col-span-2">
            <CompactGameSelector 
              options={gameOptions}
              value={game}
              onChange={(val) => handleGameChange(val)}
              variant="dropdown"
              className="w-full"
            />
          </div>

          {/* Season */}
          <div className="col-span-2 sm:col-span-auto w-full sm:w-auto">
            <Select
              value={selectedSeason?.toString() || "all"}
              onValueChange={(val) => handleSeasonChange(val === "all" ? null : Number(val))}
              disabled={filtersLoading}
            >
              <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
                <SelectValue placeholder="All Seasons" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="all">All Seasons</SelectItem>
                  {seasons.map((s: FilterOption) => (
                    <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div className="col-span-2 sm:col-span-auto w-full sm:w-auto">
            <Select
              value={selectedTeam || "all"}
              onValueChange={(val) => setSelectedTeam(val === "all" ? null : val)}
              disabled={!selectedSeason || teams.length === 0}
            >
              <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((t: FilterOption) => (
                    <SelectItem key={t.id} value={t.value.toString()}>{t.label}</SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground col-span-2 sm:col-span-auto hover:text-destructive transition-colors h-9 ml-auto"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className={`${roboto.className} text-xs text-muted-foreground/50 mb-4`}>
        {loading ? 'Searching...' : `${players.length} player${players.length !== 1 ? 's' : ''} found`}
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
                  const playerHref = `/players/${toPlayerSlug(player.player_ign || '')}`;
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
                  return (
                    <Link href={playerHref} className="group block">{cardContent}</Link>
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
