'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchByIdWithFullDetails } from '@/hooks/use-matches'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Swords, Trophy, Timer, MonitorPlay } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ActiveGameCard } from '@/components/admin/matches/active-game-card';

// Updated to use matchId to align with directory slug
export default function AdminMatchManagePage({ params }: { params: Promise<{ matchId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const matchId = parseInt(resolvedParams.matchId);

  // Use the correct hook
  const { data: match, isLoading, error } = useMatchByIdWithFullDetails(matchId);

  if (isLoading) {
    return <MatchManageSkeleton />;
  }

  if (error || !match) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load match details. {error?.message}</AlertDescription>
      </Alert>
    );
  }

  const handleLobbyRedirect = () => {
    router.push(`/lobby/${matchId}`);
  };

  const completedGames = match.games?.filter(g => g.status === 'completed') || [];
  const activeGame = match.games?.find(g => ['drafting', 'in_progress'].includes(g.status || ''));
  const nextGameNumber = (match.games?.length || 0) + 1;

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-muted-foreground w-fit">
              {match.esports_seasons_stages?.stage_type} • {match.round ? `Round ${match.round}` : match.group_name}
            </Badge>
            <Badge className={
              match.status === 'completed' ? 'bg-green-500' : 
              match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }>
              {match.status?.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{match.name}</h1>
          <p className="text-muted-foreground">
             {match.scheduled_at ? format(new Date(match.scheduled_at), 'PPP p') : 'Unscheduled'}
          </p>
        </div>

        <div className="flex gap-2">
           <Button variant="outline" onClick={handleLobbyRedirect}>
            <MonitorPlay className="w-4 h-4 mr-2" />
            Open Captain's Lobby
          </Button>
          <Button disabled={match.status === 'completed'}>
            <Swords className="w-4 h-4 mr-2" />
            {activeGame ? 'Manage Active Game' : `Start Game ${nextGameNumber}`}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Teams Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-muted/30 p-6 rounded-xl border">
         {match.match_participants?.map((participant, idx) => (
           <div key={participant.id} className={`flex flex-col items-center gap-3 ${idx === 1 ? 'md:order-3' : ''}`}>
             <div className="w-20 h-20 bg-background rounded-full border-4 border-muted flex items-center justify-center shadow-sm">
                {/* Logo Placeholder */}
                <span className="text-2xl font-bold">
                    {/* Accessing schools_teams correctly */}
                    {participant.schools_teams?.name?.substring(0, 1)}
                </span>
             </div>
             <div className="text-center">
               <h3 className="font-bold text-lg">{participant.schools_teams?.name}</h3>
               <p className="text-sm text-muted-foreground">{participant.schools_teams?.school?.name}</p>
             </div>
             <div className="text-4xl font-bold tabular-nums">
               {completedGames.reduce((acc, g) => {
                 // Placeholder score logic
                  return acc; 
               }, 0)}
             </div>
           </div>
         ))}
         
         <div className="flex flex-col items-center justify-center gap-2 md:order-2">
            <span className="text-muted-foreground font-medium uppercase tracking-wider text-sm">VS</span>
            <div className="px-3 py-1 bg-background border rounded text-xs font-mono">
              BO{match.best_of}
            </div>
         </div>
      </div>

      {/* Games Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Game Timeline
            </h2>
        </div>
        
        {/* If no games, show empty state */}
        {(!match.games || match.games.length === 0) && (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Swords className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No Games Started</h3>
                    <p className="text-muted-foreground max-w-sm mb-4">
                        Start the first game of the series to begin drafting and tracking stats.
                    </p>
                    <Button>Start Game 1</Button>
                </CardContent>
            </Card>
        )}

        {/* Game List */}
        <div className="grid gap-4">
             {/* Active Game */}
             {activeGame && (
                <div className="border-l-4 border-l-blue-500 pl-4 py-2">
                    <h3 className="font-bold text-blue-500 mb-2">Currently Live</h3>
                    <ActiveGameCard 
                      game={activeGame} 
                      matchId={matchId} 
                      esportId={match.esports_seasons_stages?.esports_categories?.esports?.id || 0}
                      team1Id={match.match_participants?.[0]?.team_id || ''}
                      team2Id={match.match_participants?.[1]?.team_id || ''}
                    />
                </div>
             )}

             {/* Completed Games */}
             {completedGames.length > 0 && (
                 <div className="space-y-2">
                    <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">Completed</h3>
                    {completedGames.map(game => (
                        <Card key={game.id} className="opacity-75 hover:opacity-100 transition-opacity">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm">Game {game.game_number}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}

function MatchManageSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
