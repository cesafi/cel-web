'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModalLayout } from '@/components/ui/modal-layout';
import { toast } from 'sonner';
import { Play, Square, Timer, Trophy, Users, Clock, Calendar } from 'lucide-react';
import { GameWithDetails, GameUpdate } from '@/lib/types/games';
import { GameScore, GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { MatchParticipantWithTeamDetailsOnly } from '@/lib/types/match-participants';
import { 
  gameTimingUpdateSchema, 
  scoreSubmissionSchema,
  scoreSchema,
  formatDurationToHHMMSS,
  validateAndFormatDuration
} from '@/lib/validations/match-game-scores-modal';
import { z } from 'zod';
import { formatSmartDate } from '@/lib/utils/date';

interface MatchGameScoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: GameWithDetails;
  participants: MatchParticipantWithTeamDetailsOnly[];
  gameScores: GameScore[];
  onSaveScores: (scores: (GameScoreInsert | GameScoreUpdate)[]) => Promise<void>;
  onUpdateGame?: (game: GameUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export function MatchGameScoresModal({
  open,
  onOpenChange,
  game,
  participants,
  gameScores,
  onSaveScores,
  onUpdateGame,
  isSubmitting
}: MatchGameScoresModalProps) {
  const [scores, setScores] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [gameStatus, setGameStatus] = useState<'scheduled' | 'in_progress' | 'completed'>();
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [durationError, setDurationError] = useState<string>('');

  // Initialize scores and game status when modal opens or data changes
  useEffect(() => {
    if (open) {
      const initialScores: Record<number, string> = {};

      // Set existing scores
      gameScores.forEach(score => {
        if (score.match_participant_id) {
          initialScores[score.match_participant_id] = score.score.toString();
        }
      });

      // Set default scores for participants without scores
      participants.forEach(participant => {
        if (!(participant.id in initialScores)) {
          initialScores[participant.id] = '0';
        }
      });

      setScores(initialScores);
      setErrors({});

      // Set game status based on timing
      if (game.start_at && game.end_at) {
        setGameStatus('completed');
      } else if (game.start_at) {
        setGameStatus('in_progress');
      } else {
        setGameStatus('scheduled');
      }

      // Set time inputs
      setStartTime(game.start_at ? new Date(game.start_at).toISOString().slice(0, 16) : '');
      setEndTime(game.end_at ? new Date(game.end_at).toISOString().slice(0, 16) : '');
      setDuration(game.duration || '');
      setDurationError('');
    }
  }, [open, gameScores, participants, game]);

  const getGameStatusBadge = () => {
    if (game.start_at && game.end_at) {
      return <Badge variant="default">Completed</Badge>;
    } else if (game.start_at) {
      return <Badge variant="secondary">In Progress</Badge>;
    } else {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const handleScoreChange = (participantId: number, value: string) => {
    if (value === '') { // Allow empty string
      setScores(prev => ({ ...prev, [participantId]: '' }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[participantId];
        return newErrors;
      });
      return;
    }

    // Validate score using Zod schema
    try {
      scoreSchema.parse(value);
      // Clear error if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[participantId];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ 
          ...prev, 
          [participantId]: error.issues[0]?.message || 'Invalid score format' 
        }));
        return;
      }
    }

    setScores(prev => ({ ...prev, [participantId]: value }));
  };

  const handleStartGame = async () => {
    if (!onUpdateGame) return;

    const now = new Date().toISOString();
    try {
      await onUpdateGame({
        id: game.id,
        start_at: now
      });
      setGameStatus('in_progress');
      setStartTime(now.slice(0, 16));
      toast.success('Game started successfully');
    } catch {
      toast.error('Failed to start game');
    }
  };

  const handleEndGame = async () => {
    if (!onUpdateGame) return;

    const now = new Date().toISOString();
    try {
      await onUpdateGame({
        id: game.id,
        end_at: now
      });
      setGameStatus('completed');
      setEndTime(now.slice(0, 16));
      toast.success('Game ended successfully');
    } catch {
      toast.error('Failed to end game');
    }
  };

  const handleUpdateTiming = async () => {
    if (!onUpdateGame) return;

    try {
      // Validate timing data
      const timingData = {
        startTime,
        endTime,
        duration
      };

      const validationResult = gameTimingUpdateSchema.safeParse(timingData);
      if (!validationResult.success) {
        validationResult.error.issues.forEach((error: z.ZodIssue) => {
          if (error.path.includes('duration')) {
            setDurationError(error.message);
          }
        });
        return;
      }

      // Clear any previous errors
      setDurationError('');

      const updateData: GameUpdate = { id: game.id };

      if (startTime) {
        updateData.start_at = new Date(startTime).toISOString();
      }
      if (endTime) {
        updateData.end_at = new Date(endTime).toISOString();
      }
      if (duration) {
        // Format duration to HH:MM:SS before saving
        const formattedDuration = formatDurationToHHMMSS(duration);
        updateData.duration = formattedDuration;
      }

      await onUpdateGame(updateData);
      toast.success('Game timing updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Validation failed. Please check your input.');
      } else {
        toast.error('Failed to update game timing');
      }
    }
  };

  const handleSubmit = async () => {
    // Clear any existing errors
    setErrors({});

    // Validate score submission data
    const scoreData = {
      scores,
      gameId: game.id
    };

    const validationResult = scoreSubmissionSchema.safeParse(scoreData);
    if (!validationResult.success) {
      const newErrors: Record<number, string> = {};
      validationResult.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path.includes('scores')) {
          // Handle nested score validation errors
          const scoreErrors = issue.message;
          if (typeof scoreErrors === 'string') {
            // If it's a general scores error, apply to all scores
            Object.keys(scores).forEach(participantId => {
              newErrors[parseInt(participantId)] = scoreErrors;
            });
          }
        }
      });
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    try {
      // Prepare score data for submission
      const scoreUpdates: (GameScoreInsert | GameScoreUpdate)[] = [];

      Object.entries(scores).forEach(([participantId, score]) => {
        const participantIdNum = parseInt(participantId);
        const existingScore = gameScores.find(s => s.match_participant_id === participantIdNum);

        if (existingScore) {
          // Update existing score
          scoreUpdates.push({
            id: existingScore.id,
            match_participant_id: participantIdNum,
            game_id: game.id,
            score: parseInt(score)
          });
        } else {
          // Create new score
          scoreUpdates.push({
            match_participant_id: participantIdNum,
            game_id: game.id,
            score: parseInt(score)
          });
        }
      });

      await onSaveScores(scoreUpdates);
    } catch (error) {
      console.error('Failed to save scores:', error);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={`Manage Game ${game.game_number} - Scores & Status`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Scores'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Game Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Game Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Game Status & Actions */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getGameStatusBadge()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Game {game.game_number}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {gameStatus === 'scheduled' && (
                  <Button
                    onClick={handleStartGame}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                )}

                {gameStatus === 'in_progress' && (
                  <Button
                    onClick={handleEndGame}
                    size="sm"
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Game
                  </Button>
                )}
              </div>
            </div>

            {/* Game Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={!onUpdateGame}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!onUpdateGame}
                />
              </div>
            </div>

            {/* Duration Input */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duration (HH:MM:SS format)
              </Label>
              <Input
                id="duration"
                type="text"
                value={duration}
                placeholder="00:00:00"
                onChange={e => {
                  const value = e.target.value;
                  setDuration(value);
                  
                  // Clear error when user starts typing
                  if (durationError) {
                    setDurationError('');
                  }
                  
                  // Validate in real-time but don't save
                  if (value) {
                    const validation = validateAndFormatDuration(value);
                    if (!validation.isValid) {
                      setDurationError(validation.error || 'Invalid duration format');
                    }
                  }
                }}
                disabled={!onUpdateGame}
                className={durationError ? 'border-red-500' : ''}
              />
              {durationError && (
                <p className="text-xs text-red-500">{durationError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter duration in HH:MM:SS format (01:30:45) or natural format (1h 30m, 90m)
              </p>
            </div>

            {onUpdateGame && (
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateTiming}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Update Timing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Game Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {game.start_at && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Started:</span>
                  </div>
                  <div className="font-medium pl-6">{formatSmartDate(game.start_at, { showTime: true })}</div>
                </div>
              )}
              {game.end_at && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Square className="h-4 w-4 text-red-600" />
                    <span className="text-muted-foreground">Ended:</span>
                  </div>
                  <div className="font-medium pl-6">{formatSmartDate(game.end_at, { showTime: true })}</div>
                </div>
              )}
              {game.duration && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Duration:</span>
                  </div>
                  <div className="font-medium pl-6">{game.duration}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Team Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Team Scores
              <span className="text-sm text-muted-foreground">({participants.length} teams)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No participating teams found for this game</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">
                        {participant.schools_teams.schools.abbreviation} {participant.schools_teams.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {participant.schools_teams.schools.name}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`score-${participant.id}`} className="text-sm font-medium">
                        Score:
                      </Label>
                      <div className="relative">
                        <Input
                          id={`score-${participant.id}`}
                          type="text"
                          value={scores[participant.id] || ''}
                          onChange={(e) => handleScoreChange(participant.id, e.target.value)}
                          className={`w-20 text-center ${errors[participant.id] ? 'border-red-500' : ''}`}
                          placeholder="0"
                          disabled={isSubmitting}
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          pts
                        </span>
                      </div>
                    </div>

                    {errors[participant.id] && (
                      <div className="text-xs text-red-500 mt-1">
                        {errors[participant.id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Note */}
        <div className="p-3 bg-muted border rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You can manage game status, timing, and scores all in one place.
            Start the game when it begins, end it when finished, and update scores as needed.
          </p>
        </div>
      </div>
    </ModalLayout>
  );
}
