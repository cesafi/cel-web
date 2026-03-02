'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMatchByIdWithFullDetails, matchKeys } from '@/hooks/use-matches';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlayersByTeamId } from '@/actions/players';
import { Player } from '@/lib/types/players';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DraftPanel } from '@/components/draft/draft-panel';
import { ValorantStatsUpload } from '@/components/stats/valorant-stats-upload';
import { MlbbStatsUpload } from '@/components/stats/mlbb-stats-upload';
import { PostGameStatsUploader } from '@/components/statistics/post-game-stats-uploader';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { deleteGameByIdWithCascade, updateGameById } from '@/actions/games';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Gamepad2,
    MonitorPlay,
    BarChart3,
    Swords,
    Link2,
    Copy,
    Users,
    Trash2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const matchId = Number(params.matchId);
    const gameId = Number(params.gameId);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingAttr, setIsUpdatingAttr] = useState(false);

    const { data: match, isLoading, error } = useMatchByIdWithFullDetails(matchId);

    const team1 = match?.match_participants?.[0];
    const team2 = match?.match_participants?.[1];

    // Fetch players for stats
    const { data: team1Players = [], isLoading: isLoadingTeam1 } = useQuery({
        queryKey: ['players', team1?.schools_teams?.id],
        queryFn: async () => {
            if (!team1?.schools_teams?.id) return [];
            const result = await getPlayersByTeamId(team1.schools_teams.id);
            return result.success && result.data ? (result.data as Player[]) : [];
        },
        enabled: !!team1?.schools_teams?.id,
    });

    const { data: team2Players = [], isLoading: isLoadingTeam2 } = useQuery({
        queryKey: ['players', team2?.schools_teams?.id],
        queryFn: async () => {
            if (!team2?.schools_teams?.id) return [];
            const result = await getPlayersByTeamId(team2.schools_teams.id);
            return result.success && result.data ? (result.data as Player[]) : [];
        },
        enabled: !!team2?.schools_teams?.id,
    });

    if (isLoading) {
        return <GameDetailSkeleton />;
    }

    if (error || !match) {
        return (
            <div className="w-full space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load match details.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const game = match.games?.find(g => g.id === gameId);

    if (!game) {
        return (
            <div className="w-full space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Game Not Found</AlertTitle>
                    <AlertDescription>This game does not exist in the match.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const esportName = match.esports_seasons_stages?.esports_categories?.esports?.name?.toLowerCase() || '';
    const isMlbb = esportName.includes('mobile legends') || esportName.includes('mlbb');
    const isValorant = esportName.includes('valorant');
    const isActive = ['drafting', 'in_progress'].includes(game.status || '');
    const isCompleted = game.status === 'completed';
    const isDrafting = game.status === 'drafting';

    const statusIcon = isCompleted
        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
        : isActive
            ? <Clock className="h-4 w-4 text-blue-500" />
            : <XCircle className="h-4 w-4 text-muted-foreground" />;

    const apiEndpoint = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/games/draft/${gameId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(apiEndpoint);
        toast.success('API link copied to clipboard');
    };

    const handleDeleteGame = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteGameByIdWithCascade(gameId);
            if (result.success) {
                toast.success('Game deleted');
                setDeleteModalOpen(false);
                queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
                router.push(`/admin/matches/${matchId}`);
            } else {
                toast.error(result.error || 'Failed to delete game');
                setIsDeleting(false);
            }
        } catch {
            toast.error('An unexpected error occurred');
            setIsDeleting(false);
        }
    };

    const handleUpdateGameAttr = async (field: 'coin_toss_winner' | 'side_selection', value: string) => {
        setIsUpdatingAttr(true);
        try {
            const data: any = { id: gameId };
            // If value is 'none', map it to null to clear it
            data[field] = value === 'none' ? null : value;

            const result = await updateGameById(data);
            if (result.success) {
                toast.success('Game updated');
                queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
            } else {
                toast.error(result.error || 'Failed to update game');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsUpdatingAttr(false);
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* Navigation */}
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/matches/${matchId}`)} className="text-muted-foreground hover:text-foreground -mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {match.name}
            </Button>

            {/* ── Game Header ── */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isActive
                            ? 'bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30'
                            : isCompleted
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                            {game.game_number}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Game {game.game_number}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {statusIcon}
                                <span className="capitalize">{(game.status || 'pending').replace(/_/g, ' ')}</span>
                                {game.start_at && (
                                    <>
                                        <span>•</span>
                                        <span>Started {format(new Date(game.start_at), 'p')}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isActive && (
                            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete Game
                        </Button>
                    </div>
                </div>

                {/* Mini scoreboard */}
                <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        {team1?.schools_teams?.school?.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team1.schools_teams.school.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                {team1?.schools_teams?.school?.abbreviation?.substring(0, 2) || 'T1'}
                            </div>
                        )}
                        <span className="font-medium">{team1?.schools_teams?.school?.abbreviation || 'T1'}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">
                        {team1?.match_score ?? 0} : {team2?.match_score ?? 0}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{team2?.schools_teams?.school?.abbreviation || 'T2'}</span>
                        {team2?.schools_teams?.school?.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team2.schools_teams.school.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                {team2?.schools_teams?.school?.abbreviation?.substring(0, 2) || 'T2'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Game Attributes Editor ── */}
            {team1 && team2 && !isValorant && (
                <div className="rounded-xl border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Swords className="h-4 w-4" />
                        Game Attributes Overlay
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Coin Toss Winner / Advantage</label>
                            <Select
                                disabled={isUpdatingAttr}
                                value={game.coin_toss_winner || 'none'}
                                onValueChange={(val) => handleUpdateGameAttr('coin_toss_winner', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                                    {team1?.schools_teams?.id && <SelectItem value={team1.schools_teams.id}>{team1.schools_teams?.school?.abbreviation || 'Team 1'}</SelectItem>}
                                    {team2?.schools_teams?.id && <SelectItem value={team2.schools_teams.id}>{team2.schools_teams?.school?.abbreviation || 'Team 2'}</SelectItem>}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Overrides the coin toss winner for side selection / first pick mechanics.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Side Selection / Starting Side</label>
                            <Select
                                disabled={isUpdatingAttr}
                                value={game.side_selection || 'none'}
                                onValueChange={(val) => handleUpdateGameAttr('side_selection', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select side" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                                    <SelectItem value="blue">Blue Side</SelectItem>
                                    <SelectItem value="red">Red Side</SelectItem>
                                    {isValorant && <SelectItem value="attack">Attack</SelectItem>}
                                    {isValorant && <SelectItem value="defend">Defend</SelectItem>}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Force assigns the starting side for the advantage team.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── API Export Link ── */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    API Export
                </h3>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted rounded-lg px-3 py-2.5 text-muted-foreground truncate">
                        {apiEndpoint}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                    </Button>
                </div>
            </div>

            {/* ── Draft / Agent Select Section ── */}
            {(isMlbb || isValorant) && team1?.schools_teams && team2?.schools_teams && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {isMlbb ? 'Hero Draft' : 'Agent Select'}
                    </h2>
                    <DraftPanel
                        gameId={gameId}
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
                        team1Players={team1Players.map(p => ({ id: p.id, ign: p.ign, role: p.role }))}
                        team2Players={team2Players.map(p => ({ id: p.id, ign: p.ign, role: p.role }))}
                        isAdmin={true}
                        isValorant={isValorant}
                        gameNumber={game.game_number}
                        coinTossWinnerId={game.coin_toss_winner || match.coin_toss_winner_id || undefined}
                        coinTossResult={match.coin_toss_result || undefined}
                        sideSelection={game.side_selection || undefined}
                    />
                </div>
            )}


            {/* ── API Export Link (Stats) ── */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    API EXPORT
                </h3>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted rounded-lg px-3 py-2.5 text-muted-foreground truncate">
                        {`${apiEndpoint.replace('/draft/', '/stats/')}`}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`${apiEndpoint.replace('/draft/', '/stats/')}`)
                        toast.success('Stats API link copied to clipboard')
                    }}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                    </Button>
                </div>
            </div>

            {/* ── Post-Game Statistics ── */}
            {(isMlbb || isValorant) && team1?.schools_teams && team2?.schools_teams && (
                <div className="space-y-4 pb-8">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Post-Game Statistics
                    </h2>

                    {(isLoadingTeam1 || isLoadingTeam2) ? (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Loading rosters...</p>
                        </div>
                    ) : isValorant ? (
                        <ValorantStatsUpload
                            gameId={gameId}
                            team1={{
                                id: team1.schools_teams.id,
                                name: team1.schools_teams.name,
                                abbreviation: team1.schools_teams.school?.abbreviation || 'T1',
                                logoUrl: team1.schools_teams.school?.logo_url,
                                matchParticipantId: team1.id,
                                players: team1Players,
                            }}
                            team2={{
                                id: team2.schools_teams.id,
                                name: team2.schools_teams.name,
                                abbreviation: team2.schools_teams.school?.abbreviation || 'T2',
                                logoUrl: team2.schools_teams.school?.logo_url,
                                matchParticipantId: team2.id,
                                players: team2Players,
                            }}
                            onStatsSaved={() => queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) })}
                        />
                    ) : (
                        <MlbbStatsUpload
                            gameId={gameId}
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
                            onStatsSaved={() => queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) })}
                        />
                    )}
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteGame}
                title="Delete Game"
                message={`Are you sure you want to delete Game ${game?.game_number}? This action cannot be undone and will permanently delete all associated scores, stats, map vetoes, and drafts.`}
                type="delete"
                isLoading={isDeleting}
            />
        </div>
    );
}

function GameDetailSkeleton() {
    return (
        <div className="w-full space-y-8">
            <Skeleton className="h-8 w-40" />
            <div className="rounded-xl border overflow-hidden">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );
}
