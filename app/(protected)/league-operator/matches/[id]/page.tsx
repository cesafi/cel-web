'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Target,
  Clock
} from 'lucide-react';
import { MatchWithFullDetails, MatchInsert, MatchUpdate } from '@/lib/types/matches';
import { GameWithDetails } from '@/lib/types/games';
import { useMatchByIdWithFullDetails, useUpdateMatch } from '@/hooks/use-matches';
import { formatTime, formatSmartDate } from '@/lib/utils/date';
import { formatCategoryName } from '@/lib/utils/sports';
import { MatchModal } from '@/components/shared/matches';
import { MatchStatusModal } from '@/components/shared/matches';
import { MatchGameModal } from '@/components/shared/matches';
import { MatchGameScoresModal } from '@/components/shared/matches';
import { MatchParticipantsTable } from '@/components/shared/matches';
import { MatchGamesTable } from '@/components/shared/matches';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LeagueOperatorMatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<MatchWithFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isScoresModalOpen, setIsScoresModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameWithDetails | undefined>(undefined);

  const { data: matchData, isLoading: matchLoading, error: matchError } = useMatchByIdWithFullDetails(parseInt(matchId));
  const updateMatchMutation = useUpdateMatch();

  useEffect(() => {
    if (matchData) {
      setMatch(matchData);
      setLoading(false);
    } else if (matchError) {
      setError('Failed to fetch match details');
      setLoading(false);
    } else if (matchLoading) {
      setLoading(true);
    }
  }, [matchData, matchError, matchLoading]);

  const handleEditSubmit = async (data: MatchInsert | MatchUpdate) => {
    try {
      const updateData = data as MatchUpdate;
      await updateMatchMutation.mutateAsync({ 
        id: match!.id, 
        data: updateData 
      });
      setIsEditModalOpen(false);
      toast.success('Match updated successfully');
    } catch (_err) {
      toast.error('Failed to update match');
    }
  };


  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Error Loading Match</h2>
            <p className="text-muted-foreground">{error || 'Match not found'}</p>
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'postponed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{match.name}</h1>
            <p className="text-muted-foreground">{match.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(match.status)}>
            {getStatusDisplayName(match.status)}
          </Badge>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Match
          </Button>
        </div>
      </div>

      {/* Match Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Match Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sport</p>
                <p className="text-sm">{match.esports_seasons_stages?.esports_categories?.esports?.name || 'Unknown'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-sm">
                  {formatCategoryName(
                    match.esports_seasons_stages?.esports_categories?.division || '',
                    match.esports_seasons_stages?.esports_categories?.levels || ''
                  )}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {match.scheduled_at ? formatSmartDate(match.scheduled_at) : 'Not scheduled'}
                </span>
              </div>
              
              {match.start_at && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Start: {formatTime(new Date(match.start_at))}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{match.venue || 'Venue not specified'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>League Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Stage</p>
              <p className="text-sm">
                {(match.esports_seasons_stages as any)?.competition_stage
                  ?.replace(/_/g, ' ')
                  ?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Season</p>
              <p className="text-sm">Season {(match.esports_seasons_stages as any)?.season_id || 'Unknown'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Participants */}
      <MatchParticipantsTable matchId={match.id} />

      {/* Match Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Match Games</span>
            </div>
            <Button
              onClick={() => setIsGameModalOpen(true)}
              size="sm"
            >
              Add Game
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MatchGamesTable matchId={match.id} />
        </CardContent>
      </Card>

      {/* Modals */}
      <MatchModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        mode="edit"
        match={match}
        selectedStageId={match.esports_seasons_stages?.id ?? null}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMatchMutation.isPending}
      />

      <MatchStatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        match={match}
        onUpdateMatch={handleEditSubmit}
        isSubmitting={updateMatchMutation.isPending}
      />

      <MatchGameModal
        open={isGameModalOpen}
        onOpenChange={setIsGameModalOpen}
        mode="add"
        matchId={match.id}
        game={editingGame}
        onSubmit={async () => {
          setIsGameModalOpen(false);
          setEditingGame(undefined);
          toast.success('Game added successfully');
        }}
        isSubmitting={false}
      />

      {editingGame && (
        <MatchGameScoresModal
          open={isScoresModalOpen}
          onOpenChange={setIsScoresModalOpen}
          game={editingGame}
          participants={(match?.match_participants || []) as any}
          gameScores={[]}
          onSaveScores={async () => {
            setIsScoresModalOpen(false);
            setEditingGame(undefined);
            toast.success('Scores updated successfully');
          }}
          onUpdateGame={async () => {
            // Handle game update if needed
          }}
          isSubmitting={false}
        />
      )}
    </div>
  );
}
