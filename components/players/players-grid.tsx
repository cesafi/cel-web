'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { roboto } from '@/lib/fonts';
import { Search, X, Loader2 } from 'lucide-react';
import { getMlbbStats, getValorantStats, getAvailableSeasons } from '@/actions/statistics';
import { CompactGameSelector, GameOption } from '@/components/shared/filters/compact-game-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toPlayerSlug } from '@/lib/utils/player-slug';
import { RichSportCategory } from '../schedule/schedule-content';
import { getAllSchoolsTeams } from '@/actions/schools-teams';
import { getAllSchools } from '@/actions/schools';
import { getAllPlayersWithTeams } from '@/actions/players';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type GameType = 'mlbb' | 'valorant' | 'all';
type FilterOption = { id: number | string; label: string; value: string };

export default function PlayersGrid({ availableRichSports }: { availableRichSports: RichSportCategory[]; }) {
  const [game, setGame] = useState<GameType | string>('mlbb');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [seasons, setSeasons] = useState<FilterOption[]>([]);

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Additional data for mapping missing relationships
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);

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
    const options: GameOption[] = [];

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

  // Fetch seasons and supporting data on mount
  useEffect(() => {
    async function fetchInitialData() {
      setFiltersLoading(true);
      // Fetch available seasons
      const result = await getAvailableSeasons();
      if (result.success && result.data) {
        const mapped = result.data.map((s: any) => ({
          id: s.id,
          label: s.name || `Season ${s.id}`,
          value: s.id.toString(),
          originalData: s
        }));
        setSeasons(mapped);

        // We leave the selectedSeason default to "All Seasons" by not overriding states here
      }

      // Fetch all teams and schools to properly map missing relationships
      try {
        const [teamsResult, schoolsResult] = await Promise.all([
          getAllSchoolsTeams(),
          getAllSchools()
        ]);

        if (teamsResult.success && teamsResult.data) {
          setAllTeams(teamsResult.data);
        }
        if (schoolsResult.success && schoolsResult.data) {
          setAllSchools(schoolsResult.data);
        }
      } catch (err) {
        console.error("Failed to fetch teams/schools for mapping", err);
      }

      setFiltersLoading(false);
    }
    fetchInitialData();
  }, []);



  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch players based on filters
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllPlayersWithTeams();
      if (result.success && result.data) {
        setAllPlayers(result.data);
      } else {
        setAllPlayers([]);
      }
    } catch (err) {
      console.error("Failed to fetch players", err);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Client-side filtering and grouping
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      // 1. Season Filter - Check if player has an entry in player_seasons for this season
      const playerSeasons = player.player_seasons || [];
      const hasSeasonMatch = selectedSeason === 'all' || playerSeasons.some((ps: any) => ps.team?.season_id?.toString() === selectedSeason);
      if (!hasSeasonMatch) return false;

      // 2. Game Filter
      // We need to determine the game. In the players table, we might need to look at the team assigned in that season.
      const targetSeasonEntry = selectedSeason !== 'all'
        ? playerSeasons.find((ps: any) => ps.team?.season_id?.toString() === selectedSeason)
        : playerSeasons[0]; // Default to latest/first if no season selected

      const teamGame = targetSeasonEntry?.team?.esports_categories?.esports?.name?.toLowerCase() || '';

      const isMLBB = game === 'all' || game === 'mlbb' || game === '2';
      const isVAL = game === 'all' || game === 'valorant' || game === '1';

      if (isMLBB && !isVAL && !teamGame.includes('mobile legends')) return false;
      if (isVAL && !isMLBB && !teamGame.includes('valorant')) return false;

      // 3. School Filter
      if (selectedSchool !== 'all') {
        const schoolId = targetSeasonEntry?.team?.schools?.id?.toString();
        const schoolAbbrev = targetSeasonEntry?.team?.schools?.abbreviation;
        if (schoolId !== selectedSchool && schoolAbbrev !== selectedSchool) return false;
      }

      // 4. Search Filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const ign = (player.ign || '').toLowerCase();
        const firstName = (player.first_name || '').toLowerCase();
        const lastName = (player.last_name || '').toLowerCase();
        if (!ign.includes(searchLower) && !firstName.includes(searchLower) && !lastName.includes(searchLower)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => (a.ign || '').localeCompare(b.ign || ''));
  }, [allPlayers, game, selectedSeason, selectedSchool, debouncedSearch]);

  const groupedPlayers = useMemo(() => {
    const groups: Record<string, { name: string; abbrev: string; logo: string | null; players: any[] }> = {};

    filteredPlayers.forEach(player => {
      const playerSeasons = player.player_seasons || [];
      const targetSeasonEntry = selectedSeason !== 'all'
        ? playerSeasons.find((ps: any) => ps.team?.season_id?.toString() === selectedSeason)
        : playerSeasons[0];

      const school = targetSeasonEntry?.team?.schools;
      const schoolName = school?.name || 'Unassigned';
      const schoolAbbrev = school?.abbreviation || '---';
      const schoolLogo = school?.logo_url || null;

      if (!groups[schoolName]) {
        groups[schoolName] = {
          name: schoolName,
          abbrev: schoolAbbrev,
          logo: schoolLogo,
          players: []
        };
      }
      groups[schoolName].players.push(player);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.name === 'Unassigned') return 1;
      if (b.name === 'Unassigned') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredPlayers, selectedSeason]);

  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    setSelectedSchool('all');
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeason(seasonId);
    setSelectedSchool('all');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedSchool('all');
    setSelectedSeason('all');
  };

  const hasActiveFilters = selectedSchool !== 'all' || selectedSeason !== 'all' || searchQuery;

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
              value={selectedSeason}
              onValueChange={handleSeasonChange}
              disabled={filtersLoading || seasons.length === 0}
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

          {/* School */}
          <div className="col-span-2 sm:col-span-auto w-full sm:w-auto">
            <Select
              value={selectedSchool}
              onValueChange={setSelectedSchool}
              disabled={allSchools.length === 0}
            >
              <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs truncate">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="all">All Schools</SelectItem>
                  {allSchools.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <div className="flex items-center gap-2">
                        {s.logo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.logo_url} alt={s.abbreviation || s.name} className="w-5 h-5 object-contain" />
                        )}
                        <span>{s.abbreviation || s.name}</span>
                      </div>
                    </SelectItem>
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
        {loading ? 'Searching...' : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Players Grid / Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="space-y-12 pb-16">
          {groupedPlayers.map(group => {
            return (
              <div key={group.name} className="space-y-6">
                {/* School Section Header */}
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  {group.logo && (
                    <Image
                      src={group.logo}
                      alt={`${group.name} logo`}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <h2 className="text-3xl hidden lg:block font-mango-grotesque font-bold tracking-wide">
                    {group.name}
                  </h2>
                  <h2 className="text-3xl lg:hidden font-mango-grotesque font-bold tracking-wide">
                    {group.abbrev}
                  </h2>
                </div>

                {/* School Players Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {group.players.map((player: any, index: number) => {
                    const playerHref = `/players/${toPlayerSlug(player.ign || '')}`;

                    // Prioritize primary photo, fallback to secondary
                    const playerPhoto = player.photo_url || player.photo_url_secondary || null;
                    const firstNameSpliced = `${player.first_name}`.trim().split(' ').slice(0, 2).join(' ')
                    const fullName = `${(firstNameSpliced)} ${player.last_name || ''}`.trim();

                    return (
                      <motion.div
                        key={player.id || player.ign + index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
                      >
                        <Link href={playerHref} className="group block h-full">
                          <div className="relative flex flex-col h-[320px] sm:h-[360px] w-full rounded-2xl border border-border/30 bg-gradient-to-b from-card/80 to-background overflow-hidden hover:border-primary/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

                            {/* Background School Logo Watermark */}
                            {group.logo && (
                              <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.05] dark:opacity-10 mix-blend-multiply dark:mix-blend-plus-lighter pointer-events-none p-6">
                                <Image
                                  src={group.logo}
                                  alt="School Watermark"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}

                            {/* Player Photo (Aesthetic leaning right) */}
                            <div className="absolute inset-y-0 left-8 w-[100%] z-10 flex items-end justify-center overflow-hidden grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500">
                              {playerPhoto && (
                                <Image
                                  src={playerPhoto}
                                  alt={`${player.ign} photo`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 300px"
                                  className="object-contain object-bottom sm:object-right-bottom drop-shadow-2xl opacity-95 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                                />
                              )}
                            </div>

                            {/* Text Information Sidebar (Left Side) */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent z-20 flex flex-col justify-end p-6">

                              <div className="w-full pr-2">
                                {/* IGN */}
                                <h3 className="text-3xl sm:text-xl font-mango-grotesque font-bold text-foreground group-hover:text-primary transition-colors tracking-widest uppercase drop-shadow-2xl break-words leading-[0.9] mb-4">
                                  {player.ign || 'Unknown'}
                                </h3>

                                {/* Divider */}
                                <div className="w-12 h-0.5 bg-primary/60 mb-5 group-hover:w-full transition-all duration-700"></div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Real Names Layout */}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-foreground/80 tracking-tight uppercase leading-tight">
                                      {fullName || '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
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
