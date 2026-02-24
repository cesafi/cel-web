'use client';

import { useState } from 'react';
import { useGameScoresByGameId, useCreateGameScore, useUpdateGameScore } from '@/hooks/use-game-scores';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2 } from 'lucide-react';

interface GameWinnerSelectorProps {
  gameId: number;
  team1: {
    matchParticipantId: number;
    name: string;
    abbreviation: string;
  };
  team2: {
    matchParticipantId: number;
    name: string;
    abbreviation: string;
  };
}

export function GameWinnerSelector({ gameId, team1, team2 }: GameWinnerSelectorProps) {
  const { data: gameScores, isLoading: isScoresLoading } = useGameScoresByGameId(gameId);
  const createScore = useCreateGameScore();
  const updateScore = useUpdateGameScore();
  
  const [isUpdating, setIsUpdating] = useState(false);

  const team1Score = gameScores?.find(s => s.match_participant_id === team1.matchParticipantId);
  const team2Score = gameScores?.find(s => s.match_participant_id === team2.matchParticipantId);

  const team1Won = team1Score?.score === 1;
  const team2Won = team2Score?.score === 1;

  const handleSetWinner = async (winnerId: number | null) => {
    setIsUpdating(true);
    try {
      // If setting winnerId to team1.matchParticipantId
      const scoreT1 = winnerId === team1.matchParticipantId ? 1 : 0;
      const scoreT2 = winnerId === team2.matchParticipantId ? 1 : 0;

      // Update or create Team 1 score
      if (team1Score) {
        await updateScore.mutateAsync({ id: team1Score.id, score: scoreT1, game_id: gameId });
      } else {
        await createScore.mutateAsync({ game_id: gameId, match_participant_id: team1.matchParticipantId, score: scoreT1 });
      }

      // Update or create Team 2 score
      if (team2Score) {
        await updateScore.mutateAsync({ id: team2Score.id, score: scoreT2, game_id: gameId });
      } else {
        await createScore.mutateAsync({ game_id: gameId, match_participant_id: team2.matchParticipantId, score: scoreT2 });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isScoresLoading) {
    return <div className="animate-pulse h-10 bg-muted rounded-md w-full"></div>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-card border rounded-xl">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-auto">
        <Trophy className="h-4 w-4" />
        Record Game Winner:
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={team1Won ? "default" : "outline"}
          onClick={() => handleSetWinner(team1.matchParticipantId)}
          disabled={isUpdating || team1Won}
          className={team1Won ? "bg-green-600 hover:bg-green-700 text-white border-transparent" : ""}
          size="sm"
        >
          {isUpdating && !team1Won && !team2Won ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
          {team1.abbreviation} Win
        </Button>

        <Button
          variant={team2Won ? "default" : "outline"}
          onClick={() => handleSetWinner(team2.matchParticipantId)}
          disabled={isUpdating || team2Won}
          className={team2Won ? "bg-green-600 hover:bg-green-700 text-white border-transparent" : ""}
          size="sm"
        >
          {isUpdating && !team1Won && !team2Won ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
          {team2.abbreviation} Win
        </Button>
        
        {(team1Won || team2Won) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSetWinner(null)}
            disabled={isUpdating}
            className="text-muted-foreground ml-2"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
