'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMatchByIdWithFullDetails, matchKeys } from '@/hooks/use-matches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DraftPanel } from '@/components/draft/draft-panel';
import { MapVetoPanel } from '@/components/veto/map-veto-panel';
import { ValorantStatsUpload } from '@/components/stats/valorant-stats-upload';
import { MlbbStatsUpload } from '@/components/stats/mlbb-stats-upload';
import { getPlayersByTeamId } from '@/actions/players';
import { Player } from '@/lib/types/players';
import { MatchModal } from '@/components/shared/matches/match-modal';
import { updateMatchById } from '@/actions/matches';
import { createGame } from '@/actions/games';
import { MatchInsert, MatchUpdate } from '@/lib/types/matches';
import { toast } from 'sonner';
import { ActiveGameCard } from '@/components/admin/matches/active-game-card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Gamepad2,
  Map,
  BarChart3,
  Info,
  MonitorPlay,
  Swords,
  Timer,
  Trophy,
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Status badge variants
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: 'outline',
  live: 'destructive',
  finished: 'secondary',
  completed: 'secondary',
  rescheduled: 'outline',
  canceled: 'destructive',
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const matchId = Number(params.matchId);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch match data with full details (real-time capable hook)
  const { data: match, isLoading, error } = useMatchByIdWithFullDetails(matchId);

  // Get participants (safe access)
  const team1 = match?.match_participants?.[0];
  const team2 = match?.match_participants?.[1];

  // Fetch players for stats mapping
  const { data: team1Players = [] } = useQuery({
    queryKey: ['players', team1?.schools_teams?.id],
    queryFn: async () => {
      if (!team1?.schools_teams?.id) return [];
      const result = await getPlayersByTeamId(team1.schools_teams.id);
      return result.success && result.data ? (result.data as Player[]) : [];
    },
    enabled: !!team1?.schools_teams?.id,
  });

  const { data: team2Players = [] } = useQuery({
    queryKey: ['players', team2?.schools_teams?.id],
    queryFn: async () => {
      if (!team2?.schools_teams?.id) return [];
      const result = await getPlayersByTeamId(team2.schools_teams.id);
      return result.success && result.data ? (result.data as Player[]) : [];
    },
    enabled: !!team2?.schools_teams?.id,
  });

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

  // Determine game type and logic
  const esportName = match.esports_seasons_stages?.esports_categories?.esports?.name?.toLowerCase() || '';
  const isMlbb = esportName.includes('mobile legends') || esportName.includes('mlbb');
  const isValorant = esportName.includes('valorant');
  
  const completedGames = match.games?.filter(g => g.status === 'completed') || [];
  const activeGame = match.games?.find(g => ['drafting', 'in_progress'].includes(g.status || ''));
  const nextGameNumber = (match.games?.length || 0) + 1;

  const handleLobbyRedirect = () => {
    router.push(`/lobby/${matchId}`);
  };

  const handleStartGame = async () => {
    try {
      const result = await createGame({
        match_id: matchId,
        game_number: nextGameNumber,
      });

      if (result.success) {
        toast.success(`Game ${nextGameNumber} started successfully`);
        queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      } else {
        toast.error(result.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('Start game error:', error);
      toast.error('Failed to start game');
    }
  };

  const handleUpdateMatch = async (data: MatchInsert | MatchUpdate, participantTeamIds?: string[]) => {
    setIsSubmitting(true);
    try {
      if ('id' in data && data.id) {
        // Safe check for ID existence
        const result = await updateMatchById(data as MatchUpdate & { id: number });
        if (result.success) {
          toast.success('Match updated successfully');
          setEditModalOpen(false);
          queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
        } else {
          toast.error(result.error || 'Failed to update match');
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>
      </div>

      {/* Match Header / Command Center */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Match Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="text-muted-foreground font-mono uppercase tracking-wider">
                   {match.esports_seasons_stages?.stage_type?.replace(/_/g, ' ') || 'STAGE'}
                 </Badge>
                 <Badge 
                   variant={statusVariants[match.status] || 'default'}
                   className={match.status === 'live' ? 'animate-pulse' : ''}
                 >
                   {match.status.toUpperCase()}
                 </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{match.name}</h1>
                <p className="text-muted-foreground">{match.esports_seasons_stages?.esports_categories?.esports?.name || 'Esports Match'}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                {match.scheduled_at ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(match.scheduled_at), 'PPP p')}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Unscheduled
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.venue}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Swords className="h-4 w-4" />
                  Best of {match.best_of}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} className="w-full sm:w-auto">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
               <Button variant="outline" size="sm" onClick={handleLobbyRedirect} className="w-full sm:w-auto">
                <MonitorPlay className="w-4 h-4 mr-2" />
                Open Captain's Lobby
              </Button>
              <Button 
                size="sm"
                disabled={match.status === 'completed'} 
                onClick={activeGame ? undefined : handleStartGame}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                {activeGame ? 'Manage Active Game' : `Start Game ${nextGameNumber}`}
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Team 1 */}
              <div className="flex flex-col items-center gap-3 md:order-1">
                <div className="w-20 h-20 bg-background rounded-full border-4 border-muted flex items-center justify-center shadow-sm relative overflow-hidden">
                   {team1?.schools_teams?.school?.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={team1.schools_teams.school.logo_url} 
                        alt={team1.schools_teams.school.abbreviation || 'T1'}
                        className="w-full h-full object-cover"
                      />
                   ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                          {team1?.schools_teams?.school?.abbreviation?.substring(0, 2) || 'T1'}
                      </span>
                   )}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{team1?.schools_teams?.name || 'Team 1'}</h3>
                  <p className="text-sm text-muted-foreground">{team1?.schools_teams?.school?.name || 'TBD'}</p>
                </div>
                <div className="text-4xl font-bold tabular-nums">
                  {team1?.match_score ?? 0}
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center justify-center gap-2 md:order-2">
                 <span className="text-muted-foreground font-medium uppercase tracking-wider text-sm">VS</span>
                 {activeGame && (
                    <Badge variant="destructive" className="animate-pulse">
                        GAME {activeGame.game_number} LIVE
                    </Badge> 
                 )}
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center gap-3 md:order-3">
                <div className="w-20 h-20 bg-background rounded-full border-4 border-muted flex items-center justify-center shadow-sm relative overflow-hidden">
                   {team2?.schools_teams?.school?.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={team2.schools_teams.school.logo_url} 
                        alt={team2.schools_teams.school.abbreviation || 'T2'}
                        className="w-full h-full object-cover"
                      />
                   ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                          {team2?.schools_teams?.school?.abbreviation?.substring(0, 2) || 'T2'}
                      </span>
                   )}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{team2?.schools_teams?.name || 'Team 2'}</h3>
                  <p className="text-sm text-muted-foreground">{team2?.schools_teams?.school?.name || 'TBD'}</p>
                </div>
                <div className="text-4xl font-bold tabular-nums">
                   {team2?.match_score ?? 0}
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Game Console */}
      {activeGame && (
        <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-primary flex items-center gap-2 text-lg">
                    <MonitorPlay className="w-5 h-5" />
                    Live Game Console
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ActiveGameCard 
                  game={activeGame} 
                  matchId={matchId} 
                  esportId={match.esports_seasons_stages?.esports_categories?.esports?.id || 0}
                  team1Id={team1?.schools_teams?.id || ''}
                  team2Id={team2?.schools_teams?.id || ''}
                />
            </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          {isMlbb && (
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Draft & Games</span>
            </TabsTrigger>
          )}
          {isValorant && (
            <TabsTrigger value="veto" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map Veto</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Games List</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Post-Game Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Context Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  Competition Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Game Title</p>
                      <p className="font-medium flex items-center gap-2">
                         {isValorant ? <Swords className="h-4 w-4" /> : isMlbb ? <Users className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
                         {match.esports_seasons_stages?.esports_categories?.esports?.name || 'N/A'}
                      </p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stage</p>
                      <Badge variant="secondary" className="font-semibold">
                        {match.esports_seasons_stages?.competition_stage || 'N/A'}
                      </Badge>
                   </div>
                   <div className="space-y-1 col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Division & Category</p>
                      <p className="font-medium">
                        {match.esports_seasons_stages?.esports_categories?.division} • {match.esports_seasons_stages?.esports_categories?.levels}
                      </p>
                   </div>
                   {(match.round || match.group_name) && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Grouping</p>
                        <p className="font-medium">
                           {match.group_name && `Group ${match.group_name}`}
                           {match.group_name && match.round && ' • '}
                           {match.round && `Round ${match.round}`}
                        </p>
                      </div>
                   )}
                </div>
              </CardContent>
            </Card>

            {/* Broadcast & Media */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MonitorPlay className="h-5 w-5 text-primary" />
                  Broadcast & Media
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                 {match.stream_url ? (
                    <div className="space-y-4">
                       <div className="rounded-md bg-muted aspect-video flex items-center justify-center relative overflow-hidden group">
                           {/* Placeholder pattern or thumbnail could go here */}
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-colors">
                              <MonitorPlay className="h-12 w-12 text-primary opacity-80" />
                              <p className="mt-2 text-sm font-medium text-muted-foreground">Official Stream Available</p>
                           </div>
                       </div>
                       <Button className="w-full" variant="outline" asChild>
                          <a href={match.stream_url} target="_blank" rel="noopener noreferrer">
                             Watch Stream <Swords className="ml-2 h-4 w-4" />
                          </a>
                       </Button>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                       <MonitorPlay className="h-10 w-10 text-muted-foreground/50 mb-3" />
                       <p className="text-muted-foreground">No official stream link provided for this match.</p>
                       <Button variant="link" size="sm" className="mt-2">Add Stream Link</Button>
                    </div>
                 )}
              </CardContent>
            </Card>

            {/* Schedule & Venue - Full Width Description */}
            <Card className="md:col-span-2">
               <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                     <Info className="h-5 w-5 text-primary" />
                     Additional Details
                  </CardTitle>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Match Description</p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                           {match.description || 'No additional description provided for this match.'}
                        </p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scheduled Date</p>
                          <p className="font-medium flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-muted-foreground" />
                             {match.scheduled_at ? format(new Date(match.scheduled_at), 'PPP') : 'TBD'}
                          </p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scheduled Time</p>
                          <p className="font-medium flex items-center gap-2">
                             <Timer className="h-4 w-4 text-muted-foreground" />
                             {match.scheduled_at ? format(new Date(match.scheduled_at), 'p') : 'TBD'}
                          </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Venue</p>
                          <p className="font-medium flex items-center gap-2">
                             <MapPin className="h-4 w-4 text-muted-foreground" />
                             {match.venue || 'TBD'}
                          </p>
                      </div>
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Draft Tab (MLBB) */}
        {isMlbb && (
          <TabsContent value="draft" className="mt-6">
            {/* Game Selector */}
            <div className="mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Select Game to Manage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {match.games && match.games.length > 0 ? (
                      match.games.map((game) => (
                        <Button
                          key={game.id}
                          variant={selectedGameId === game.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedGameId(game.id)}
                          className={game.id === activeGame?.id ? "border-green-500 text-green-500" : ""}
                        >
                          Game {game.game_number} {game.id === activeGame?.id && '(LIVE)'}
                        </Button>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No games created yet. Start a game to begin drafting.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Draft Panel */}
            {selectedGameId && team1?.schools_teams && team2?.schools_teams ? (
              <DraftPanel
                gameId={selectedGameId}
                matchId={matchId}
                esportId={match.esports_seasons_stages?.esports_categories?.esports?.id || 0}
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
                isAdmin={true}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {!selectedGameId 
                      ? 'Select a game above to start the draft.'
                      : 'Missing team information for draft.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Map Veto Tab (Valorant) */}
        {isValorant && (
          <TabsContent value="veto" className="mt-6">
            {team1?.schools_teams && team2?.schools_teams ? (
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
                isAdmin={true}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Missing team information for map veto.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Games Tab */}
        <TabsContent value="games" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Games History</CardTitle>
            </CardHeader>
            <CardContent>
              {match.games && match.games.length > 0 ? (
                <div className="space-y-4">
                  {match.games.map((game, index) => (
                    <div key={game.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                         <span className="font-bold mr-2">Game {game.game_number}</span>
                         <Badge variant="secondary">{game.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No games recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
            {/* Game Selector for Stats */}
            <div className="mb-6">
            <Card>
                <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Game for Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex gap-2 flex-wrap">
                    {match.games && match.games.length > 0 ? (
                    match.games.map((game) => (
                        <Button
                        key={game.id}
                        variant={selectedGameId === game.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGameId(game.id)}
                        disabled={game.status !== 'completed'}
                        >
                        Game {game.game_number} {game.status !== 'completed' && '(Not Finished)'}
                        </Button>
                    ))
                    ) : (
                    <p className="text-muted-foreground text-sm">No completed games available yet.</p>
                    )}
                </div>
                </CardContent>
            </Card>
            </div>

            {(isMlbb || isValorant) && selectedGameId && team1?.schools_teams && team2?.schools_teams ? (
                 isValorant ? (
                    <ValorantStatsUpload
                    gameId={selectedGameId}
                    team1={{
                        id: team1.schools_teams.id,
                        name: team1.schools_teams.name,
                        abbreviation: team1.schools_teams.school?.abbreviation || 'T1',
                        players: team1Players,
                    }}
                    team2={{
                        id: team2.schools_teams.id,
                        name: team2.schools_teams.name,
                        abbreviation: team2.schools_teams.school?.abbreviation || 'T2',
                        players: team2Players,
                    }}
                    />
                 ) : (
                    <MlbbStatsUpload
                    gameId={selectedGameId}
                    team1={{
                        id: team1.schools_teams.id,
                        name: team1.schools_teams.name,
                        abbreviation: team1.schools_teams.school?.abbreviation || 'T1',
                        players: team1Players,
                    }}
                    team2={{
                        id: team2.schools_teams.id,
                        name: team2.schools_teams.name,
                        abbreviation: team2.schools_teams.school?.abbreviation || 'T2',
                        players: team2Players,
                    }}
                    />
                 )
            ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                       {(!isMlbb && !isValorant) 
                          ? 'Statistics not available for this sport.' 
                          : !selectedGameId 
                             ? 'Select a completed game above to manage statistics.'
                             : 'Match data incomplete.'}
                    </p>
                  </CardContent>
                </Card>
            )}
        </TabsContent>
      </Tabs>
      {/* Match Edit Modal */}
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
    </div>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="w-full space-y-6">
      <Skeleton className="h-10 w-40" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="flex items-center justify-between px-12">
               <Skeleton className="h-24 w-24 rounded-full" />
               <Skeleton className="h-8 w-12" />
               <Skeleton className="h-24 w-24 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-12 w-full" />
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
