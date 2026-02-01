'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMatchById } from '@/actions/matches';
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
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Gamepad2,
  Map,
  BarChart3,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

// Status badge colors
const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  live: 'bg-green-500/10 text-green-500 border-green-500/20',
  finished: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  completed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  rescheduled: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  canceled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Fetch match data
  const { data: match, isLoading, error } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const result = await getMatchById(matchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!matchId,
  });

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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">Failed to load match details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine game type from esport name
  const esportName = match.esports_seasons_stages?.esports_categories?.esports?.name?.toLowerCase() || '';
  const isMlbb = esportName.includes('mobile legends') || esportName.includes('mlbb');
  const isValorant = esportName.includes('valorant');

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matches
      </Button>

      {/* Match Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Match Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{match.name}</h1>
                <Badge 
                  variant="outline" 
                  className={statusColors[match.status] || statusColors.upcoming}
                >
                  {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {match.scheduled_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(match.scheduled_at), 'PPP p')}
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.venue}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4" />
                  Best of {match.best_of}
                </div>
              </div>
            </div>

            {/* Teams Display */}
            <div className="flex items-center gap-4">
              {/* Team 1 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-1">
                  {team1?.schools_teams?.school?.abbreviation?.substring(0, 2) || '?'}
                </div>
                <p className="text-sm font-medium truncate max-w-[80px]">
                  {team1?.schools_teams?.school?.abbreviation || 'TBD'}
                </p>
                {team1?.match_score !== null && team1?.match_score !== undefined && (
                  <p className="text-2xl font-bold">{team1?.match_score}</p>
                )}
              </div>

              <span className="text-muted-foreground font-bold">VS</span>

              {/* Team 2 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-1">
                  {team2?.schools_teams?.school?.abbreviation?.substring(0, 2) || '?'}
                </div>
                <p className="text-sm font-medium truncate max-w-[80px]">
                  {team2?.schools_teams?.school?.abbreviation || 'TBD'}
                </p>
                {team2?.match_score !== null && team2?.match_score !== undefined && (
                  <p className="text-2xl font-bold">{team2?.match_score}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          {isMlbb && (
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Draft</span>
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
            <span className="hidden sm:inline">Games</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stage</p>
                  <p className="font-medium">
                    {match.esports_seasons_stages?.competition_stage || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Game</p>
                  <p className="font-medium">
                    {match.esports_seasons_stages?.esports_categories?.esports?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {match.esports_seasons_stages?.esports_categories?.division} - {match.esports_seasons_stages?.esports_categories?.levels}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{match.description || 'No description'}</p>
                </div>
              </div>
              
              {match.stream_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Stream</p>
                  <a 
                    href={match.stream_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {match.stream_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Draft Tab (MLBB) */}
        {isMlbb && (
          <TabsContent value="draft" className="mt-6">
            {/* Game Selector */}
            <div className="mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Select Game</CardTitle>
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
                        >
                          Game {game.game_number}
                        </Button>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No games created yet. Create games in the Games tab first.</p>
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
              <CardTitle>Games</CardTitle>
            </CardHeader>
            <CardContent>
              {match.games && match.games.length > 0 ? (
                <div className="space-y-4">
                  {match.games.map((game, index) => (
                    <div key={game.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Game {game.game_number}</span>
                        {game.map_name && (
                          <Badge variant="outline">{game.map_name}</Badge>
                        )}
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
          {isValorant ? (
            <>
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
                          >
                            Game {game.game_number}
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No games created yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedGameId && team1?.schools_teams && team2?.schools_teams ? (
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
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {!selectedGameId 
                        ? 'Select a game above to upload stats.'
                        : 'Missing team information.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : isMlbb ? (
            <>
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
                          >
                            Game {game.game_number}
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No games created yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedGameId && team1?.schools_teams && team2?.schools_teams ? (
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
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {!selectedGameId 
                        ? 'Select a game above to upload stats.'
                        : 'Missing team information.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Match statistics coming soon for this sport...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="w-full space-y-6">
      <Skeleton className="h-10 w-40" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-16 w-16 rounded-full" />
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
