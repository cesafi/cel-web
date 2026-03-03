'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, CheckCircle2 } from 'lucide-react';
import { upsertGameScoresForGame } from '@/actions/game-scores';
import { updateGameById } from '@/actions/games';
import { toast } from 'sonner';

interface TeamInfo {
    id: string;
    abbreviation: string;
    logoUrl?: string | null;
    matchParticipantId: number;
}

interface ManualGameWinnerProps {
    gameId: number;
    team1: TeamInfo;
    team2: TeamInfo;
    isCompleted: boolean;
    isValorant?: boolean;
    onSaved: () => void;
}

export function ManualGameWinner({ gameId, team1, team2, isCompleted, isValorant, onSaved }: ManualGameWinnerProps) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSetWinner = async (winnerTeam: TeamInfo, loserTeam: TeamInfo) => {
        setIsSaving(true);
        try {
            // Upsert game scores: winner gets appropriate score based on game type
            const winnerScore = isValorant ? 13 : 1;
            const loserScore = 0;
            const scores = [
                { game_id: gameId, match_participant_id: winnerTeam.matchParticipantId, score: winnerScore },
                { game_id: gameId, match_participant_id: loserTeam.matchParticipantId, score: loserScore },
            ];
            const scoreResult = await upsertGameScoresForGame(gameId, scores);
            if (!scoreResult.success) {
                toast.error(scoreResult.error || 'Failed to set game scores');
                setIsSaving(false);
                return;
            }

            // Mark game as completed
            const updateResult = await updateGameById({ id: gameId, status: 'completed' });
            if (!updateResult.success) {
                toast.error(updateResult.error || 'Failed to update game status');
                setIsSaving(false);
                return;
            }

            toast.success(`${winnerTeam.abbreviation} set as winner for this game`);
            onSaved();
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Manual Game Winner
            </h3>
            <p className="text-xs text-muted-foreground">
                Set the winner manually when no stats or draft data is available. This will mark the game as completed and update the match score.
            </p>
            {isCompleted ? (
                <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Game already completed</span>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        className="flex items-center gap-2"
                        onClick={() => handleSetWinner(team1, team2)}
                    >
                        {team1.logoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team1.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        {team1.abbreviation} Wins
                    </Button>
                    <span className="text-xs text-muted-foreground">or</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        className="flex items-center gap-2"
                        onClick={() => handleSetWinner(team2, team1)}
                    >
                        {team2.logoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team2.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        {team2.abbreviation} Wins
                    </Button>
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
            )}
        </div>
    );
}
