'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMatchByIdWithFullDetails } from '@/hooks/use-matches'; 
import { useRealtimeDraft } from '@/hooks/use-realtime-draft';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, Trophy } from 'lucide-react';

// Components
import { DraftPanel } from '@/components/draft/draft-panel';

export default function LobbyPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = use(params);
  const matchId = parseInt(resolvedParams.matchId);
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('gameId');
  
  const { data: match, isLoading, error, refetch } = useMatchByIdWithFullDetails(matchId);
  
  // Find the active game
  const activeGame = match?.games?.find(g => 
    (gameIdParam ? g.id === parseInt(gameIdParam) : true) && 
    ['drafting', 'in_progress'].includes(g.status || '')
  ) || match?.games?.sort((a,b) => b.id - a.id)[0]; // Fallback to latest

  // Subscribe to Realtime Updates for this Game
  useRealtimeDraft(activeGame?.id || 0, (payload) => {
    // If we get an update, refetch the match data to stay in sync
    // In a highly optimized version, we'd update local state directly
    refetch(); 
  });

  if (isLoading) return <LobbySkeleton />;
  
  if (error || !match) return <ErrorDisplay error={error?.message} />;

  const isDrafting = activeGame?.status === 'drafting';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Match Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
           <div className="text-center md:text-left">
              <Badge variant="outline" className="mb-2 border-slate-700 text-slate-400">
                {match.esports_seasons_stages?.name}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {match.name}
              </h1>
           </div>
           
           {/* VS Display */}
           <div className="flex items-center gap-8 bg-slate-900/50 px-8 py-4 rounded-full border border-slate-800">
              {match.match_participants?.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                      {idx === 1 && <span className="text-slate-600 font-bold text-xl italic px-2">VS</span>}
                      <span className="font-bold text-lg text-slate-200">{p.schools_teams?.name}</span>
                  </div>
              ))}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar / Chat / Info */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Lobby Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Status</span>
                            <Badge variant={isDrafting ? "default" : "secondary"}>
                                {activeGame?.status?.toUpperCase() || 'WAITING'}
                            </Badge>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div className="space-y-2">
                           <p className="text-sm text-slate-400">Connected Captains</p>
                           {/* Presence List Stub */}
                           <div className="flex items-center gap-2 text-sm text-green-400">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Waiting for connection...
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stage: Draft / Game / Waiting */}
            <div className="lg:col-span-3">
                {isDrafting && activeGame && match.match_participants ? (
                    <DraftPanel 
                        gameId={activeGame.id}
                        matchId={matchId}
                        esportId={match.esports_seasons_stages?.esports_categories?.esports?.id || 0}
                        team1={{
                             id: match.match_participants[0]?.schools_teams?.id!,
                             name: match.match_participants[0]?.schools_teams?.name!,
                             abbreviation: match.match_participants[0]?.schools_teams?.school?.abbreviation || 'T1',
                             logoUrl: match.match_participants[0]?.schools_teams?.school?.logo_url
                        }}
                        team2={{
                             id: match.match_participants[1]?.schools_teams?.id!,
                             name: match.match_participants[1]?.schools_teams?.name!,
                             abbreviation: match.match_participants[1]?.schools_teams?.school?.abbreviation || 'T2',
                             logoUrl: match.match_participants[1]?.schools_teams?.school?.logo_url
                        }}
                        isAdmin={true} // In real app, check user role
                    />
                ) : (
                    <div className="h-[500px] flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                        <Trophy className="w-16 h-16 text-slate-700 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-400">Waiting for Admin to Start Game</h2>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

function LobbySkeleton() {
    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="h-24 w-full bg-slate-900" />
                <div className="grid grid-cols-4 gap-6">
                    <Skeleton className="h-96 col-span-1 bg-slate-900" />
                    <Skeleton className="h-96 col-span-3 bg-slate-900" />
                </div>
            </div>
        </div>
    )
}

function ErrorDisplay({ error }: { error?: string }) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
             <Alert variant="destructive" className="max-w-md border-red-900 bg-red-950 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lobby Error</AlertTitle>
                <AlertDescription>{error || 'Failed to load lobby'}</AlertDescription>
             </Alert>
        </div>
    )
}
