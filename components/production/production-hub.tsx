'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Copy, ExternalLink, ChevronDown, ChevronRight, Search, BarChart3,
  Users, Swords, Trophy, Map, Gamepad2, Star, Shield, Eye, EyeOff,
  Check, RefreshCw, Radio, Zap,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Types ──────────────────────────────────────────
interface FilterState {
  game: 'mlbb' | 'valorant';
  seasonId: string;
  categoryId: string;
  stageId: string;
  teamA: string;
  teamB: string;
  playerA: string;
  playerB: string;
  h2hMode: 'direct' | 'overall' | 'both';
  metric: string;
  leaderboardLimit: string;
  matchId: string;
}

interface LinkCard {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  buildUrl: (baseUrl: string, filters: FilterState) => string;
  game?: 'mlbb' | 'valorant' | 'both';
}

// ─── Link Cards ─────────────────────────────────────
const LINK_CARDS: LinkCard[] = [
  {
    id: 'player-stats', title: 'Player Statistics', description: 'KDA, GPM/ACS, damage, win rate',
    category: 'players', icon: Users, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.seasonId) p.set('seasonId', f.seasonId);
      if (f.stageId) p.set('stageId', f.stageId);
      if (f.categoryId) p.set('categoryId', f.categoryId);
      return `${b}/api/export/player-stats?${p}`;
    },
  },
  {
    id: 'leaderboard', title: 'Player Leaderboard', description: 'Top N players by metric',
    category: 'players', icon: Star, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game, metric: f.metric || 'total_kills', limit: f.leaderboardLimit || '5' });
      if (f.seasonId) p.set('seasonId', f.seasonId);
      return `${b}/api/export/leaderboard?${p}`;
    },
  },
  {
    id: 'character-stats', title: 'Hero / Agent Stats', description: 'Pick/ban rates, win rates, avg KDA',
    category: 'characters', icon: Shield, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.seasonId) p.set('seasonId', f.seasonId);
      if (f.stageId) p.set('stageId', f.stageId);
      if (f.categoryId) p.set('categoryId', f.categoryId);
      return `${b}/api/export/character-stats?${p}`;
    },
  },
  {
    id: 'team-stats', title: 'Team Statistics', description: 'Aggregate W/L, KDA, damage',
    category: 'teams', icon: Gamepad2, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.seasonId) p.set('seasonId', f.seasonId);
      if (f.stageId) p.set('stageId', f.stageId);
      if (f.categoryId) p.set('categoryId', f.categoryId);
      return `${b}/api/export/team-stats?${p}`;
    },
  },
  {
    id: 'h2h-teams', title: 'Head-to-Head: Teams', description: 'Side-by-side team comparison',
    category: 'h2h', icon: Swords, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.teamA) p.set('teamA', f.teamA);
      if (f.teamB) p.set('teamB', f.teamB);
      if (f.seasonId) p.set('seasonId', f.seasonId);
      return `${b}/api/export/h2h-teams?${p}`;
    },
  },
  {
    id: 'h2h-players', title: 'Head-to-Head: Players', description: 'Side-by-side player comparison',
    category: 'h2h', icon: Swords, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.playerA) p.set('playerA', f.playerA);
      if (f.playerB) p.set('playerB', f.playerB);
      if (f.seasonId) p.set('seasonId', f.seasonId);
      return `${b}/api/export/h2h-players?${p}`;
    },
  },
  {
    id: 'map-stats', title: 'Map Statistics', description: 'Pick/ban rates per map',
    category: 'maps', icon: Map, game: 'valorant',
    buildUrl: (b, f) => {
      const p = new URLSearchParams();
      if (f.seasonId) p.set('seasonId', f.seasonId);
      if (f.stageId) p.set('stageId', f.stageId);
      return `${b}/api/export/map-stats?${p}`;
    },
  },
  {
    id: 'match-overview', title: 'Match Overview', description: 'Scores, teams, schedule, stream',
    category: 'match', icon: Trophy, game: 'both',
    buildUrl: (b, f) => `${b}/api/export/match-overview?matchId=${f.matchId || '0'}`,
  },
  {
    id: 'draft', title: 'Draft + Character Stats', description: 'Live draft with pick/ban rates',
    category: 'match', icon: Shield, game: 'both',
    buildUrl: (b, f) => `${b}/api/games/draft/${f.matchId || '0'}`,
  },
  {
    id: 'game-stats', title: 'Per-Game Stats', description: 'Individual game player stats',
    category: 'match', icon: BarChart3, game: 'both',
    buildUrl: (b, f) => `${b}/api/games/game-results/${f.matchId || '0'}`,
  },
  {
    id: 'standings', title: 'Standings', description: 'League standings by stage',
    category: 'standings', icon: Trophy, game: 'both',
    buildUrl: (b, f) => {
      const p = new URLSearchParams({ game: f.game });
      if (f.seasonId) p.set('seasonId', f.seasonId);
      if (f.stageId) p.set('stageId', f.stageId);
      if (f.categoryId) p.set('categoryId', f.categoryId);
      return `${b}/api/export/standings?${p}`;
    },
  },
];

// ─── Metrics ────────────────────────────────────────
const MLBB_METRICS = [
  { value: 'total_kills', label: 'Total Kills' },
  { value: 'total_assists', label: 'Total Assists' },
  { value: 'total_deaths', label: 'Total Deaths' },
  { value: 'kills_per_game', label: 'Kills / Game' },
  { value: 'assists_per_game', label: 'Assists / Game' },
  { value: 'deaths_per_game', label: 'Deaths / Game' },
  { value: 'avg_gpm', label: 'Gold / Min (GPM)' },
  { value: 'total_gold', label: 'Total Gold' },
  { value: 'total_damage_dealt', label: 'Total Damage Dealt' },
  { value: 'total_damage_taken', label: 'Total Damage Taken' },
  { value: 'total_turret_damage', label: 'Turret Damage' },
  { value: 'total_turtle_slain', label: 'Turtles Slain' },
  { value: 'total_lord_slain', label: 'Lords Slain' },
  { value: 'avg_teamfight_percent', label: 'Teamfight %' },
  { value: 'avg_rating', label: 'Rating' },
  { value: 'mvp_count', label: 'MVP Count' },
  { value: 'wins', label: 'Total Wins' },
  { value: 'games_played', label: 'Games Played' },
];

const VALORANT_METRICS = [
  { value: 'avg_acs', label: 'ACS (Avg Combat Score)' },
  { value: 'avg_econ_rating', label: 'Econ Rating' },
  { value: 'total_kills', label: 'Total Kills' },
  { value: 'total_assists', label: 'Total Assists' },
  { value: 'total_deaths', label: 'Total Deaths' },
  { value: 'total_first_bloods', label: 'First Bloods' },
  { value: 'avg_kills', label: 'Kills / Game' },
  { value: 'avg_assists', label: 'Assists / Game' },
  { value: 'avg_deaths', label: 'Deaths / Game' },
  { value: 'avg_first_bloods', label: 'First Bloods / Game' },
  { value: 'total_plants', label: 'Spike Plants' },
  { value: 'total_defuses', label: 'Spike Defuses' },
  { value: 'mvp_count', label: 'MVP Count' },
  { value: 'wins', label: 'Total Wins' },
  { value: 'games_played', label: 'Games Played' },
];

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  h2h: { label: 'Head-to-Head', emoji: '⚔️' },
  match: { label: 'Match-Specific', emoji: '🎮' },
  characters: { label: 'Hero / Agent Meta', emoji: '🎭' },
  maps: { label: 'Maps (Valorant)', emoji: '🗺️' },
  players: { label: 'Player Stats', emoji: '👤' },
  teams: { label: 'Team Stats', emoji: '🏫' },
  standings: { label: 'Standings', emoji: '🏆' },
};

// ─── Helper: Labeled Select using shadcn ─────────────
function FilterSelect({ label, value, onChange, placeholder, children, className }: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {label}
        </label>
      )}
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────
export default function ProductionHub() {
  const [filters, setFilters] = useState<FilterState>({
    game: 'mlbb', seasonId: '', categoryId: '', stageId: '',
    teamA: '', teamB: '', playerA: '', playerB: '',
    h2hMode: 'both', metric: 'total_kills', leaderboardLimit: '5', matchId: '',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_META)));
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [seasons, setSeasons] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allStages, setAllStages] = useState<any[]>([]);
  const [teamAPlayers, setTeamAPlayers] = useState<any[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // ─── Initial Fetch ───────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/production/filters?format=json');
        const json = await res.json();
        if (json.success) {
          setSeasons(json.data.seasons || []);
          setAllTeams(json.data.teams || []);
          setAllMatches(json.data.matches || []);
          setAllCategories(json.data.categories || []);
          setLiveMatches(json.data.live_matches || []);
        }
      } catch (e) { console.error('Failed to fetch filters:', e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  // ─── Fetch stages when season changes ────────
  useEffect(() => {
    if (!filters.seasonId) { setAllStages([]); return; }
    async function fetchStages() {
      try {
        const res = await fetch('/api/production/filters?format=json');
        const json = await res.json();
        // Extract unique stages from matches for this season
        if (json.success) {
          const matchesForSeason = (json.data.matches || []).filter((m: any) =>
            m.esports_seasons_stages?.season_id === parseInt(filters.seasonId)
          );
          const stageObj: Record<number, any> = {};
          for (const m of matchesForSeason) {
            const stage = m.esports_seasons_stages;
            if (stage && !stageObj[stage.id]) {
              stageObj[stage.id] = {
                id: stage.id,
                competition_stage: stage.competition_stage,
                category: stage.esports_categories,
              };
            }
          }
          setAllStages(Object.values(stageObj));
        }
      } catch (e) { /* non-fatal */ }
    }
    fetchStages();
  }, [filters.seasonId]);

  // ─── Fetch team players ─────────────────────
  useEffect(() => {
    if (!filters.teamA) { setTeamAPlayers([]); return; }
    fetch(`/api/production/filters?format=json&teamId=${filters.teamA}`)
      .then(r => r.json()).then(j => { if (j.success) setTeamAPlayers(j.data.players || []); })
      .catch(() => {});
  }, [filters.teamA]);

  useEffect(() => {
    if (!filters.teamB) { setTeamBPlayers([]); return; }
    fetch(`/api/production/filters?format=json&teamId=${filters.teamB}`)
      .then(r => r.json()).then(j => { if (j.success) setTeamBPlayers(j.data.players || []); })
      .catch(() => {});
  }, [filters.teamB]);

  // ─── Derived: categories for the selected game ─
  const gameCategories = useMemo(() => {
    return allCategories.filter((c: any) => {
      const name = (c.esport_name || c.esport_abbreviation || '').toLowerCase();
      if (filters.game === 'mlbb') return name.includes('mlbb') || name.includes('mobile legends');
      return name.includes('valorant') || name.includes('val');
    });
  }, [allCategories, filters.game]);

  // ─── Derived: stages filtered by selected category ─
  const filteredStages = useMemo(() => {
    if (!filters.categoryId) return allStages;
    return allStages.filter((s: any) => s.category?.id === parseInt(filters.categoryId));
  }, [allStages, filters.categoryId]);

  // ─── Derived: teams filtered by game + season + category ─
  const filteredTeams = useMemo(() => {
    return allTeams.filter((t: any) => {
      const eName = (t.esports_categories?.esports?.name || t.esports_categories?.esports?.abbreviation || '').toLowerCase();
      const gameMatch = filters.game === 'mlbb'
        ? (eName.includes('mlbb') || eName.includes('mobile legends'))
        : (eName.includes('valorant') || eName.includes('val'));
      if (!gameMatch) return false;
      if (filters.seasonId && t.season_id !== parseInt(filters.seasonId)) return false;
      if (filters.categoryId) return t.esport_category_id === parseInt(filters.categoryId);
      return true;
    });
  }, [allTeams, filters.game, filters.seasonId, filters.categoryId]);

  // ─── Derived: teams grouped by category for SelectGroup ─
  const groupedTeams = useMemo(() => {
    const groups: Record<string, { label: string; teams: any[] }> = {};
    for (const t of filteredTeams) {
      const cat = t.esports_categories;
      const catLabel = cat
        ? `${cat.division || ''} ${cat.levels || ''}`.trim()
        : 'Unknown';
      const seasonInfo = t.season_id ? ` — Season ${t.season_id}` : '';
      const key = `${catLabel}${seasonInfo}`;
      if (!groups[key]) groups[key] = { label: key, teams: [] };
      groups[key].teams.push(t);
    }
    return Object.values(groups);
  }, [filteredTeams]);

  // ─── Derived: matches filtered by game + category + stage ─
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m: any) => {
      const stage = m.esports_seasons_stages;
      if (!stage) return false;
      const eName = (stage.esports_categories?.esports?.name || stage.esports_categories?.esports?.abbreviation || '').toLowerCase();
      const gameMatch = filters.game === 'mlbb'
        ? (eName.includes('mlbb') || eName.includes('mobile legends'))
        : (eName.includes('valorant') || eName.includes('val'));
      if (!gameMatch) return false;
      if (filters.seasonId && stage.season_id !== parseInt(filters.seasonId)) return false;
      if (filters.categoryId && stage.esports_categories?.id !== parseInt(filters.categoryId)) return false;
      if (filters.stageId && stage.id !== parseInt(filters.stageId)) return false;
      return true;
    });
  }, [allMatches, filters.game, filters.seasonId, filters.categoryId, filters.stageId]);

  // ─── Derived: matches grouped by stage for SelectGroup ─
  const groupedMatches = useMemo(() => {
    const groups: Record<string, { label: string; matches: any[] }> = {};
    for (const m of filteredMatches) {
      const stage = m.esports_seasons_stages;
      const catInfo = stage?.esports_categories;
      const catLabel = catInfo ? `${catInfo.division || ''} ${catInfo.levels || ''}`.trim() : '';
      const stageLabel = stage?.competition_stage || 'Unknown';
      const key = catLabel ? `${catLabel} · ${stageLabel}` : stageLabel;
      if (!groups[key]) groups[key] = { label: key, matches: [] };
      groups[key].matches.push(m);
    }
    return Object.values(groups);
  }, [filteredMatches]);

  // ─── Derived: filtered link cards ─
  const filteredCards = useMemo(() => {
    return LINK_CARDS.filter(card => {
      if (card.game !== 'both' && card.game !== filters.game) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filters.game, searchQuery]);

  const groupedCards = useMemo(() => {
    const g: Record<string, LinkCard[]> = {};
    for (const c of filteredCards) { if (!g[c.category]) g[c.category] = []; g[c.category].push(c); }
    return g;
  }, [filteredCards]);

  const metrics = filters.game === 'mlbb' ? MLBB_METRICS : VALORANT_METRICS;

  // ─── Callbacks ──────────────────────────────
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Reset dependents
      if (key === 'game') { next.metric = value === 'mlbb' ? 'total_kills' : 'avg_acs'; next.categoryId = ''; next.stageId = ''; next.teamA = ''; next.teamB = ''; next.playerA = ''; next.playerB = ''; next.matchId = ''; }
      if (key === 'seasonId') { next.stageId = ''; }
      if (key === 'categoryId') { next.stageId = ''; next.teamA = ''; next.teamB = ''; next.playerA = ''; next.playerB = ''; }
      if (key === 'teamA') next.playerA = '';
      if (key === 'teamB') next.playerB = '';
      return next;
    });
  }, []);

  const clearFilter = useCallback((key: keyof FilterState) => {
    updateFilter(key, '');
  }, [updateFilter]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
  }, []);

  const copyToClipboard = useCallback(async (url: string, cardId: string) => {
    try { await navigator.clipboard.writeText(url); setCopiedId(cardId); setTimeout(() => setCopiedId(null), 2000); } catch {}
  }, []);

  const fetchPreview = useCallback(async (url: string, cardId: string) => {
    if (previewId === cardId) { setPreviewId(null); setPreviewData(null); return; }
    setPreviewId(cardId); setPreviewLoading(true);
    try { const r = await fetch(url); setPreviewData(await r.text()); } catch { setPreviewData('Error: Failed to fetch'); }
    finally { setPreviewLoading(false); }
  }, [previewId]);

  // ─── Helpers ────────────────────────────────
  const getMatchLabel = (m: any) => {
    const parts = m.match_participants || [];
    const names = parts.map((p: any) => {
      const s = Array.isArray(p.schools_teams?.schools) ? p.schools_teams.schools[0] : p.schools_teams?.schools;
      return s?.abbreviation || p.schools_teams?.name || '???';
    });
    const vs = names.length === 2 ? `${names[0]} vs ${names[1]}` : m.name || `Match #${m.id}`;
    const stage = m.esports_seasons_stages?.competition_stage || '';
    const d = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    return `${vs}${stage ? ` · ${stage}` : ''}${d ? ` · ${d}` : ''}`;
  };

  const getTeamLabel = (t: any) => {
    const s = Array.isArray(t.schools) ? t.schools[0] : t.schools;
    const cat = t.esports_categories;
    const catLabel = cat ? ` (${cat.division || ''} ${cat.levels || ''})`.replace(/\s+/g, ' ').trim() : '';
    return `${s?.abbreviation || ''} — ${t.name}${catLabel}`;
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading production data...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-10">
      {/* ═══════ HEADER ═══════ */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Production Hub</h1>
              <p className="text-sm text-muted-foreground">Generate API links for overlays, caster prep & graphics</p>
            </div>
          </div>
          {/* Game Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
            {(['mlbb', 'valorant'] as const).map(g => (
              <button key={g} onClick={() => updateFilter('game', g)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  filters.game === g
                    ? 'bg-card shadow-sm border border-border/50 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                <Image src={`/img/${g}.webp`} alt={g.toUpperCase()} width={20} height={20} className="rounded" />
                <span className="hidden sm:inline">{g === 'mlbb' ? 'MLBB' : 'Valorant'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ LIVE MATCH ═══════ */}
      {liveMatches.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-400">Live Now</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveMatches.map((m: any) => (
              <button key={m.id} onClick={() => updateFilter('matchId', String(m.id))}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  filters.matchId === String(m.id)
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-card/50 border-border/50 text-muted-foreground hover:bg-card hover:text-foreground')}>
                <Zap className="h-3 w-3 inline mr-1" />{getMatchLabel(m)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ CASCADING FILTERS ═══════ */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Global Filters</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Season */}
          <FilterSelect label="Season" value={filters.seasonId} onChange={(v) => updateFilter('seasonId', v)} placeholder="All Seasons">
            <SelectItem value="__all__" onClick={() => clearFilter('seasonId')}>All Seasons</SelectItem>
            {seasons.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name || `Season ${s.id}`}</SelectItem>)}
          </FilterSelect>

          {/* Category (Men's College, Women's College, etc.) */}
          <FilterSelect label="Category" value={filters.categoryId} onChange={(v) => v === '__all__' ? clearFilter('categoryId') : updateFilter('categoryId', v)} placeholder="All Categories">
            <SelectItem value="__all__">All Categories</SelectItem>
            {gameCategories.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.label || `${c.division} ${c.levels}`}
              </SelectItem>
            ))}
          </FilterSelect>

          {/* Stage (Groupstage, Playoffs, etc.) */}
          <FilterSelect label="Stage" value={filters.stageId} onChange={(v) => v === '__all__' ? clearFilter('stageId') : updateFilter('stageId', v)} placeholder="All Stages">
            <SelectItem value="__all__">All Stages</SelectItem>
            {filteredStages.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.competition_stage}</SelectItem>
            ))}
          </FilterSelect>

          {/* Metric */}
          <FilterSelect label="Leaderboard Metric" value={filters.metric} onChange={(v) => updateFilter('metric', v)} placeholder="Select metric">
            {metrics.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </FilterSelect>

          {/* Top N */}
          <FilterSelect label="Top N" value={filters.leaderboardLimit} onChange={(v) => updateFilter('leaderboardLimit', v)} placeholder="Top 5">
            {[3, 5, 10, 15, 20].map(n => <SelectItem key={n} value={String(n)}>Top {n}</SelectItem>)}
          </FilterSelect>

          {/* Match */}
          <FilterSelect label="Match" value={filters.matchId} onChange={(v) => v === '__all__' ? clearFilter('matchId') : updateFilter('matchId', v)} placeholder="Select match...">
            <SelectItem value="__all__">None</SelectItem>
            {groupedMatches.length === 0 && (
              <SelectItem value="__none__" disabled>No matches found</SelectItem>
            )}
            {groupedMatches.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.matches.map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.status === 'live' ? '🔴 ' : ''}{getMatchLabel(m)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </FilterSelect>
        </div>
      </div>

      {/* ═══════ HEAD-TO-HEAD BUILDER ═══════ */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Head-to-Head Builder</h2>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/30 w-fit">
          {(['direct', 'overall', 'both'] as const).map(mode => (
            <button key={mode} onClick={() => updateFilter('h2hMode', mode)}
              className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all',
                filters.h2hMode === mode
                  ? 'bg-card shadow-sm border border-border/50 text-foreground'
                  : 'text-muted-foreground hover:text-foreground')}>
              {mode === 'direct' ? 'Direct Matchup' : mode === 'overall' ? 'Overall Season' : 'Both'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Side A */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Side A</span>
            </div>
            <FilterSelect label="Team" value={filters.teamA} onChange={(v) => updateFilter('teamA', v)} placeholder="Select team...">
              {groupedTeams.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.teams.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{getTeamLabel(t)}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </FilterSelect>
            <FilterSelect label="Player" value={filters.playerA} onChange={(v) => updateFilter('playerA', v)}
              placeholder={filters.teamA ? (teamAPlayers.length ? 'Select player...' : 'Loading...') : 'Select a team first'}>
              {teamAPlayers.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>
              ))}
            </FilterSelect>
          </div>

          {/* Side B */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Side B</span>
            </div>
            <FilterSelect label="Team" value={filters.teamB} onChange={(v) => updateFilter('teamB', v)} placeholder="Select team...">
              {groupedTeams.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.teams.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{getTeamLabel(t)}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </FilterSelect>
            <FilterSelect label="Player" value={filters.playerB} onChange={(v) => updateFilter('playerB', v)}
              placeholder={filters.teamB ? (teamBPlayers.length ? 'Select player...' : 'Loading...') : 'Select a team first'}>
              {teamBPlayers.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>
              ))}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* ═══════ SEARCH ═══════ */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input type="text" placeholder="Search links..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>

      {/* ═══════ LINK CARDS ═══════ */}
      <div className="space-y-3 pb-8">
        {Object.entries(CATEGORY_META).map(([catKey, catMeta]) => {
          const cards = groupedCards[catKey];
          if (!cards || !cards.length) return null;
          const isExpanded = expandedCategories.has(catKey);

          return (
            <div key={catKey} className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <button onClick={() => toggleCategory(catKey)}
                className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/30 transition-colors text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{catMeta.emoji}</span>
                  <span className="text-sm font-semibold">{catMeta.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full">{cards.length}</span>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground/50" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
              </button>
              {isExpanded && (
                <div className="border-t border-border/30">
                  {cards.map((card, idx) => {
                    const url = card.buildUrl(baseUrl, filters);
                    const isCopied = copiedId === card.id;
                    const isPrev = previewId === card.id;

                    return (
                      <div key={card.id} className={cn('px-5 py-4 space-y-2.5', idx > 0 && 'border-t border-border/20')}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 flex-shrink-0 mt-0.5">
                              <card.icon className="h-3.5 w-3.5 text-primary/70" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium">{card.title}</h4>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">{card.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={() => fetchPreview(url, card.id)}
                              className={cn('p-2 rounded-lg transition-all duration-200',
                                isPrev ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground')}
                              title={isPrev ? 'Hide preview' : 'Show preview'}>
                              {isPrev ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => copyToClipboard(url, card.id)}
                              className={cn('p-2 rounded-lg transition-all duration-200',
                                isCopied ? 'bg-green-500/10 text-green-400' : 'hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground')}
                              title="Copy URL">
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-all duration-200"
                              title="Open in new tab"><ExternalLink className="h-3.5 w-3.5" /></a>
                          </div>
                        </div>
                        <div onClick={() => copyToClipboard(url, card.id)}
                          className="bg-muted/20 hover:bg-muted/30 border border-border/20 rounded-lg px-3 py-2 font-mono text-[11px] text-muted-foreground/70 break-all cursor-pointer select-all transition-colors">
                          {url}
                        </div>
                        {isPrev && (
                          <div className="bg-muted/10 border border-border/20 rounded-lg overflow-hidden">
                            {previewLoading
                              ? <div className="flex items-center gap-2 text-xs text-muted-foreground/60 p-3"><RefreshCw className="h-3 w-3 animate-spin" />Loading...</div>
                              : previewData ? (() => {
                                const csvText = typeof previewData === 'string' ? previewData : String(previewData);
                                const csvRows = csvText.split(/\r?\n/).filter(r => r.trim());
                                const parsed = csvRows.map(r => {
                                  const cols: string[] = [];
                                  let current = '';
                                  let inQuotes = false;
                                  for (let i = 0; i < r.length; i++) {
                                    if (r[i] === '"') { inQuotes = !inQuotes; }
                                    else if (r[i] === ',' && !inQuotes) { cols.push(current); current = ''; }
                                    else { current += r[i]; }
                                  }
                                  cols.push(current);
                                  return cols;
                                });
                                return (
                                  <div className="max-h-72 overflow-auto">
                                    <table className="w-full text-[11px] border-collapse">
                                      <tbody>
                                        {parsed.map((cols, ri) => {
                                          const isEmpty = cols.every(c => !c.trim());
                                          if (isEmpty) return <tr key={ri} className="h-3" />;
                                          const isHeader = ri === 0;
                                          return (
                                            <tr key={ri} className={cn(
                                              isHeader ? 'bg-primary/10 font-semibold text-foreground/90' : 'hover:bg-muted/30',
                                              ri > 0 && ri % 2 === 0 && 'bg-muted/10'
                                            )}>
                                              {cols.map((c, ci) => (
                                                <td key={ci} className={cn(
                                                  'px-2 py-1 whitespace-nowrap border-b border-border/10',
                                                  !c.trim() && 'opacity-0',
                                                  ci === 0 && 'sticky left-0 bg-inherit z-10'
                                                )}>
                                                  {c || '\u00A0'}
                                                </td>
                                              ))}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })() : <div className="text-xs text-muted-foreground/50 p-3">No data</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
