'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMatchByIdWithFullDetails, matchKeys } from '@/hooks/use-matches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchModal } from '@/components/shared/matches/match-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { updateMatchById, deleteMatchById } from '@/actions/matches';
import { createGame, updateGameById } from '@/actions/games';
import { MatchInsert, MatchUpdate } from '@/lib/types/matches';
import { MapVetoPanel } from '@/components/veto/map-veto-panel';
import { getValorantMapVetoesByMatchId } from '@/actions/valorant-map-vetoes';
import { getActiveValorantMaps } from '@/actions/valorant-maps';
import { getActiveMlbbMaps } from '@/actions/mlbb-maps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getActiveApiExports, setActiveApiExportMatch } from '@/actions/active-api-exports';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Gamepad2,
  MonitorPlay,
  Swords,
  Trophy,
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Info,
  Timer,
  ExternalLink,
  Video,
  Link2,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Status badge config
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  upcoming: { label: 'Upcoming', variant: 'outline', className: 'border-blue-500/50 text-blue-500' },
  live: { label: 'Live', variant: 'destructive', className: 'animate-pulse' },
  finished: { label: 'Finished', variant: 'secondary', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  completed: { label: 'Completed', variant: 'secondary', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  rescheduled: { label: 'Rescheduled', variant: 'outline', className: 'border-orange-500/50 text-orange-500' },
  canceled: { label: 'Canceled', variant: 'destructive' },
};

const gameStatusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_progress: <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />,
  drafting: <Circle className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const matchId = Number(params.matchId);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);

  const { data: match, isLoading, error } = useMatchByIdWithFullDetails(matchId);

  const team1 = match?.match_participants?.[0];
  const team2 = match?.match_participants?.[1];

  const esportName = match?.esports_seasons_stages?.esports_categories?.esports?.name?.toLowerCase() || '';
  const isMlbb = esportName.includes('mobile legends') || esportName.includes('mlbb');
  const isValorant = esportName.includes('valorant');

  // Global Valorant Maps for assignment
  const { data: valorantMaps = [] } = useQuery({
    queryKey: ['valorant-maps-active'],
    queryFn: async () => {
      const result = await getActiveValorantMaps();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isValorant,
  });

  // Global MLBB Maps for assignment
  const { data: mlbbMaps = [] } = useQuery({
    queryKey: ['mlbb-maps-active'],
    queryFn: async () => {
      const result = await getActiveMlbbMaps();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isMlbb,
  });

  // Fetch active exports
  const { data: activeExports = [] } = useQuery({
    queryKey: ['active-api-exports'],
    queryFn: async () => {
      const result = await getActiveApiExports();
      return result.success ? result.data : [];
    }
  });

  const activeMapVetoMatchId = activeExports.find((e: any) => e.title === 'valorant-map-veto')?.match_id;

  const handleSetActiveMapVetoExport = async () => {
    setIsSettingActive(true);
    try {
      const result = await setActiveApiExportMatch('valorant-map-veto', matchId);
      if (result.success) {
        toast.success('Active map veto export updated');
        queryClient.invalidateQueries({ queryKey: ['active-api-exports'] });
      } else {
        toast.error(result.error || 'Failed to update active export');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSettingActive(false);
    }
  };

  if (isLoading) {
    return <MatchDetailSkeleton />;
  }

  if (error || !match) {
    return (
      <div className="w-full space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load match details. {(error as Error)?.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const nextGameNumber = (match?.games?.length || 0) + 1;
  const activeGame = match?.games?.find(g => ['drafting', 'in_progress'].includes(g.status || ''));
  const status = match ? (statusConfig[match.status] || statusConfig.upcoming) : statusConfig.upcoming;

  const handleMapAssign = async (gameId: number, mapIdStr: string) => {
    const mapId = mapIdStr === 'unassigned' ? null : Number(mapIdStr);
    try {
      const updateData = isMlbb ? { id: gameId, mlbb_map_id: mapId } : { id: gameId, valorant_map_id: mapId };
      const result = await updateGameById(updateData);
      if (result.success) {
        toast.success('Map assigned to game');
        queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      } else {
        toast.error(result.error || 'Failed to assign map');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleVetoComplete = async () => {
    // Fetch fresh vetoes directly to avoid race conditions with the cache
    const result = await getValorantMapVetoesByMatchId(matchId);
    if (!result.success || !result.data) return;
    
    const vetoes = result.data;
    const pickedVetoes = vetoes.filter(v => v.action === 'pick' || v.action === 'remain');

    // Map veto text names to map database IDs
    const pickedMapIds = pickedVetoes.map(v => {
      const mapObj = valorantMaps.find(m => m.name === v.map_name);
      return mapObj?.id;
    }).filter(Boolean);

    let sortedGames = match?.games ? [...match.games].sort((a, b) => a.game_number - b.game_number) : [];
    let updateCount = 0;

    // Auto-create missing games if needed
    const gamesNeeded = pickedMapIds.length;
    for (let i = sortedGames.length; i < gamesNeeded; i++) {
      const result = await createGame({
        match_id: matchId,
        game_number: i + 1,
      });
      if (result.success && result.data) {
        sortedGames.push(result.data as any);
      }
    }

    for (let i = 0; i < pickedMapIds.length; i++) {
      const game = sortedGames[i];
      if (!game) continue;

      const newMapId = pickedMapIds[i];

      if (game.valorant_map_id !== newMapId) {
        await updateGameById({ id: game.id, valorant_map_id: newMapId });
        updateCount++;
      }
    }

    if (updateCount > 0) {
      toast.success(`Auto-assigned ${updateCount} map(s) to games from Map Veto`);
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    }
  };

  const handleStartGame = async () => {
    try {
      const result = await createGame({
        match_id: matchId,
        game_number: nextGameNumber,
      });

      if (result.success) {
        toast.success(`Game ${nextGameNumber} created`);
        queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      } else {
        toast.error(result.error || 'Failed to create game');
      }
    } catch {
      toast.error('Failed to create game');
    }
  };

  const handleUpdateMatch = async (data: MatchInsert | MatchUpdate) => {
    setIsSubmitting(true);
    try {
      if ('id' in data && data.id) {
        const result = await updateMatchById(data as MatchUpdate & { id: number });
        if (result.success) {
          toast.success('Match updated');
          setEditModalOpen(false);
          queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
        } else {
          toast.error(result.error || 'Failed to update match');
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMatchById(matchId);
      if (result.success) {
        toast.success('Match deleted');
        setDeleteModalOpen(false);
        router.push('/admin/matches');
      } else {
        toast.error(result.error || 'Failed to delete match');
        setIsDeleting(false);
      }
    } catch {
      toast.error('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Navigation */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground -mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matches
      </Button>

      {/* ── Match Header ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={match.status || 'upcoming'}
              onValueChange={(val) => handleUpdateMatch({ id: match.id, status: val as any })}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`h-6 text-xs px-2.5 py-0.5 rounded-full border shadow-none font-semibold ${status.className} bg-background w-auto`}>
                <div className="flex items-center gap-1">
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              {match.esports_seasons_stages?.competition_stage?.replace(/_/g, ' ') || 'Stage'}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              Best of {match.best_of}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-3 items-center gap-4 max-w-2xl mx-auto">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {team1?.schools_teams?.school?.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={team1.schools_teams.school.logo_url}
                    alt={team1.schools_teams.school.abbreviation || 'T1'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-muted-foreground">
                    {team1?.schools_teams?.school?.abbreviation?.substring(0, 3) || 'T1'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base">{team1?.schools_teams?.name || 'Team 1'}</p>
                <p className="text-xs text-muted-foreground">{team1?.schools_teams?.school?.name || 'TBD'}</p>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3 md:gap-5">
                <span className="text-4xl md:text-5xl font-bold tabular-nums">{team1?.match_score ?? 0}</span>
                <span className="text-lg text-muted-foreground font-medium">:</span>
                <span className="text-4xl md:text-5xl font-bold tabular-nums">{team2?.match_score ?? 0}</span>
              </div>
              {activeGame && (
                <Badge variant="destructive" className="animate-pulse text-xs mt-1">
                  GAME {activeGame.game_number} LIVE
                </Badge>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {team2?.schools_teams?.school?.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={team2.schools_teams.school.logo_url}
                    alt={team2.schools_teams.school.abbreviation || 'T2'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-muted-foreground">
                    {team2?.schools_teams?.school?.abbreviation?.substring(0, 3) || 'T2'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base">{team2?.schools_teams?.name || 'Team 2'}</p>
                <p className="text-xs text-muted-foreground">{team2?.schools_teams?.school?.name || 'TBD'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Match meta */}
        <div className="px-6 py-3 border-t bg-muted/20 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5" />
            {match.esports_seasons_stages?.esports_categories?.esports?.name || 'Esport'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {match.scheduled_at ? format(new Date(match.scheduled_at), 'PPP p') : 'Unscheduled'}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {match.venue}
            </span>
          )}
          {match.stream_url && (
            <a
              href={match.stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Video className="h-3.5 w-3.5" />
              Watch Stream
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* ── Match Details Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competition Context */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Competition
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Game</p>
              <p className="font-medium">{match.esports_seasons_stages?.esports_categories?.esports?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Stage</p>
              <p className="font-medium">
                {match.esports_seasons_stages?.competition_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Division</p>
              <p className="font-medium">
                {match.esports_seasons_stages?.esports_categories?.division || 'N/A'} • {match.esports_seasons_stages?.esports_categories?.levels || 'N/A'}
              </p>
            </div>
            {(match.round || match.group_name) && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Group / Round</p>
                <p className="font-medium">
                  {match.group_name && `Group ${match.group_name}`}
                  {match.group_name && match.round && ' • '}
                  {match.round && `Round ${match.round}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Details */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Info className="h-4 w-4" />
            Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Date</p>
              <p className="font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {match.scheduled_at ? format(new Date(match.scheduled_at), 'PPP') : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Time</p>
              <p className="font-medium flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                {match.scheduled_at ? format(new Date(match.scheduled_at), 'p') : 'TBD'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-1">Venue</p>
              <p className="font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {match.venue || 'TBD'}
              </p>
            </div>
          </div>
          {match.description && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground text-xs mb-1">Description</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{match.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Map Veto Section ── */}
      {isValorant && team1?.schools_teams && team2?.schools_teams && (
        <div className="space-y-4">
          {/* ── API Export Link (Map Veto) ── */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                API Export (Map Veto)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">
                  {activeMapVetoMatchId === matchId ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={activeMapVetoMatchId === matchId}
                  onCheckedChange={handleSetActiveMapVetoExport}
                  disabled={isSettingActive}
                  title="Set this match as the active map veto for API exports"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted rounded-lg px-3 py-2.5 text-muted-foreground truncate">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/export/valorant-map-veto`}
              </code>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/export/valorant-map-veto`);
                toast.success('Map Veto API link copied to clipboard');
              }}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Map Veto
          </h2>
          <MapVetoPanel
            matchId={matchId}
            bestOf={match.best_of || 3}
            team1={{
              id: team1.schools_teams.id,
              name: team1.schools_teams.name || 'Team 1',
              abbreviation: team1.schools_teams.school?.abbreviation || 'T1',
              logoUrl: team1.schools_teams.school?.logo_url,
            }}
            team2={{
              id: team2.schools_teams.id,
              name: team2.schools_teams.name || 'Team 2',
              abbreviation: team2.schools_teams.school?.abbreviation || 'T2',
              logoUrl: team2.schools_teams.school?.logo_url,
            }}
            coinTossWinnerId={match.coin_toss_winner_id}
            coinTossResult={match.coin_toss_result}
            isAdmin={true}
            onVetoComplete={handleVetoComplete}
          />
        </div>
      )}

      {/* ── Games Section ── */}
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Games
          </h2>
          <Button
            size="sm"
            onClick={handleStartGame}
            disabled={match.status === 'completed' || match.status === 'canceled'}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Game {nextGameNumber}
          </Button>
        </div>

        {(!match.games || match.games.length === 0) ? (
          /* Empty state */
          <div className="rounded-xl border-2 border-dashed bg-muted/20 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">No games yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-5">
              Create the first game to start managing drafts, map vetoes, and stats.
            </p>
            <Button onClick={handleStartGame}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Game 1
            </Button>
          </div>
        ) : (
          /* Game cards */
          <div className="space-y-3">
            {match.games.map((game) => {
              const isActive = ['drafting', 'in_progress'].includes(game.status || '');
              const isCompleted = game.status === 'completed';

              return (
                <div
                  key={game.id}
                  onClick={() => router.push(`/admin/matches/${matchId}/games/${game.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/admin/matches/${matchId}/games/${game.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left rounded-xl border bg-card p-4 md:p-5 flex items-center justify-between gap-4 transition-all hover:bg-accent/50 hover:border-primary/30 group cursor-pointer ${isActive ? 'border-blue-500/40 bg-blue-500/5' : ''
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Game number circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isActive
                      ? 'bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30'
                      : isCompleted
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                      {game.game_number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Game {game.game_number}</span>
                        {isActive && (
                          <Badge variant="destructive" className="animate-pulse text-xs px-1.5 py-0">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {gameStatusIcons[game.status || 'pending']}
                        <span className="capitalize">{(game.status || 'pending').replace(/_/g, ' ')}</span>
                        {game.start_at && (
                          <>
                            <span>•</span>
                            <span>{format(new Date(game.start_at), 'p')}</span>
                          </>
                        )}
                        {/* Inline Valorant Map Selector */}
                        {isValorant && (
                          <>
                            <span>•</span>
                            <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                              <Select
                                value={game.valorant_map_id ? String(game.valorant_map_id) : 'unassigned'}
                                onValueChange={(val) => handleMapAssign(game.id, val)}
                              >
                                <SelectTrigger className="h-6 text-xs bg-muted/50 border-transparent hover:border-border w-[130px] px-2 py-0">
                                  <SelectValue placeholder="Assign map" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned" className="text-muted-foreground italic">None</SelectItem>
                                  {valorantMaps.map((m: any) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Match Edit Modal ── */}
      {match && (
        <MatchModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          mode="edit"
          match={match}
          selectedStageId={match.stage_id}
          onSubmit={handleUpdateMatch}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMatch}
        title="Delete Match"
        message="Are you sure you want to delete this match? This action cannot be undone and will delete all associated games and scores."
        type="delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="w-full space-y-8">
      <Skeleton className="h-8 w-40" />
      <div className="rounded-xl border overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <div className="p-8 flex items-center justify-center gap-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
