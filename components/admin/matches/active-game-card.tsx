'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, MonitorPlay, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Components
import { PostGameStatsUploader } from '@/components/statistics/post-game-stats-uploader';

// Types
import { Database } from '@/database.types';

type Game = Database['public']['Tables']['games']['Row'];

interface ActiveGameCardProps {
  game: Game;
  matchId: number;
  esportId: number;
  team1Id: string;
  team2Id: string;
}

export function ActiveGameCard({ game, matchId, esportId, team1Id, team2Id }: ActiveGameCardProps) {
  const router = useRouter();
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Status Helpers
  const isDrafting = game.status === 'drafting';
  const isInProgress = game.status === 'in_progress';
  
  const handleResumeDraft = () => {
    router.push(`/lobby/${matchId}?gameId=${game.id}`);
  };

  const handleStatsSaved = () => {
      setIsStatsOpen(false);
      // Ideally we would also update game status here or trigger refetch
      toast.success("Game stats saved. You can now mark the game as completed.");
  };

  return (
    <Card className="border-blue-500/20 bg-blue-500/5 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    Game {game.game_number}
                    <Badge variant={isDrafting ? 'secondary' : 'default'} className="ml-2">
                        {game.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Started at {game.start_at ? new Date(game.start_at).toLocaleTimeString() : 'Just now'}
                </CardDescription>
            </div>
            {isDrafting && (
                <Button size="sm" variant="outline" onClick={handleResumeDraft} className="bg-background">
                    <MonitorPlay className="w-4 h-4 mr-2" />
                    Open Draft UI
                </Button>
            )}
        </div>
      </CardHeader>
      
      <CardContent>
         <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
                <span className="text-muted-foreground">Map / ID</span>
                <p className="font-medium">{game.valorant_map_id ? `Map #${game.valorant_map_id}` : 'Not Selected'}</p> 
            </div>
            <div className="space-y-1">
                <span className="text-muted-foreground">Duration</span>
                <p className="font-medium font-mono text-lg">00:00:00</p>
            </div>
         </div>
      </CardContent>

      <Separator />

      <CardFooter className="pt-4 flex justify-between">
         <Button variant="destructive" size="sm" disabled={isEnding}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Force Cancel
         </Button>
         
         <div className="flex gap-2">
            <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Upload Stats
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Post-Game Statistics</DialogTitle>
                        <DialogDescription>
                            Upload the endpoint screen to automatically extract and save player statistics.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <PostGameStatsUploader 
                        gameId={game.id}
                        matchId={matchId}
                        esportId={esportId}
                        team1Id={team1Id}
                        team2Id={team2Id}
                        onSuccess={handleStatsSaved}
                    />
                </DialogContent>
            </Dialog>

            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Completed
            </Button>
         </div>
      </CardFooter>
    </Card>
  );
}
