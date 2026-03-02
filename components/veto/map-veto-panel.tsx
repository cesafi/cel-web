'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Ban,
  Check,
  RotateCcw,
  Map,
  Shield,
  Sword,
  Copy,
  ExternalLink,
  ArrowLeftRight,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

// Types
import { ValorantMapVetoWithTeam } from '@/lib/types/valorant-map-vetoes';
import { ValorantMap } from '@/lib/types/valorant-maps';
import { getVetoSequence, getCurrentVetoStep, VetoAction, GameSide } from '@/lib/types/map-veto';

// Actions
import { getAllValorantMaps } from '@/actions/valorant-maps';
import {
  getValorantMapVetoesByMatchId,
  createValorantMapVeto,
  deleteValorantMapVetoesByMatchId,
  updateValorantMapVetoById
} from '@/actions/valorant-map-vetoes';
import { performPublicVeto, selectPublicVetoSide } from '@/actions/veto-public';
import { performMatchCoinToss, resetMatchCoinToss, switchMatchCoinTossWinner, setMatchCoinTossChoice } from '@/actions/matches';
import { ConfirmationModal } from '@/components/shared/confirmation-modal';

interface MapVetoPanelProps {
  matchId: number;
  bestOf: number;
  team1: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
  };
  team2: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
  };
  isAdmin?: boolean;
  isPublicView?: boolean;
  publicTeamId?: string;
  userSide?: 'team1' | 'team2';
  coinTossWinnerId?: string | null;
  coinTossResult?: string | null;
  onVetoComplete?: () => void;
}

// Action colors for visual distinction
const actionColors = {
  ban: 'border-red-500/50 bg-red-500/10 text-red-400',
  pick: 'border-green-500/50 bg-green-500/10 text-green-400',
  remain: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
};

const actionIcons = {
  ban: <Ban className="w-4 h-4" />,
  pick: <Check className="w-4 h-4" />,
  remain: <Map className="w-4 h-4" />,
};

export function MapVetoPanel({
  matchId,
  bestOf,
  team1,
  team2,
  isAdmin = false,
  isPublicView = false,
  publicTeamId,
  userSide,
  coinTossWinnerId,
  coinTossResult,
  onVetoComplete
}: MapVetoPanelProps) {
  const queryClient = useQueryClient();
  const [isTossing, setIsTossing] = useState(false);
  const [pendingSideSelection, setPendingSideSelection] = useState<{
    vetoId: string;
    mapName: string;
  } | null>(null);

  // Modal State
  const [isResetVetoModalOpen, setIsResetVetoModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'team1' | 'team2'>('team1');

  // Router for refreshing server component props (coin toss)
  const router = useRouter();

  // ── Supabase Realtime ──
  // Subscribe to changes on valorant_map_vetoes and matches tables
  // so both admin and public pages auto-update instantly.
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`veto-realtime-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'valorant_map_vetoes',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          // Invalidate the vetoes query so React Query refetches
          queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        () => {
          // Coin toss data comes from server component props,
          // so we need to refresh the page to get updated props
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient, router]);

  // Fetch all maps
  const { data: allMaps = [], isLoading: isLoadingMaps } = useQuery({
    queryKey: ['valorant-maps-all'],
    queryFn: async () => {
      const result = await getAllValorantMaps();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const maps = useMemo(() => {
    if (isAdmin) return allMaps;
    return allMaps.filter((m: ValorantMap) => m.is_active);
  }, [allMaps, isAdmin]);

  // Fetch current vetoes for this match
  const { data: vetoes = [], isLoading: isLoadingVetoes } = useQuery({
    queryKey: ['valorant-map-vetoes', matchId],
    queryFn: async () => {
      const result = await getValorantMapVetoesByMatchId(matchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!matchId,
  });

  // Add veto mutation
  const addVetoMutation = useMutation({
    mutationFn: async ({
      mapName,
      teamId,
      action,
      sequenceOrder
    }: {
      mapName: string;
      teamId: string;
      action: VetoAction;
      sequenceOrder: number;
    }) => {
      const result = await createValorantMapVeto({
        match_id: matchId,
        map_name: mapName,
        team_id: teamId,
        action,
        sequence_order: sequenceOrder
      });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
    },
  });

  // Public veto mutation
  const publicVetoMutation = useMutation({
    mutationFn: async ({
      mapName,
      action,
      sequenceOrder
    }: {
      mapName: string;
      action: VetoAction;
      sequenceOrder: number;
    }) => {
      if (!publicTeamId) throw new Error('No team ID provided');
      const result = await performPublicVeto(matchId, publicTeamId, mapName, action, sequenceOrder);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
      toast.success('Choice recorded');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Side selection mutation
  const selectSideMutation = useMutation({
    mutationFn: async ({ vetoId, side }: { vetoId: string, side: GameSide }) => {
      if (isPublicView) {
        if (!publicTeamId) throw new Error('No team ID provided');
        const result = await selectPublicVetoSide(matchId, publicTeamId, vetoId, side);
        if (!result.success) throw new Error(result.error);
        return result;
      } else {
        const result = await updateValorantMapVetoById({
          id: vetoId,
          side_selected: side
        });
        if (!result.success) throw new Error(result.error);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
      toast.success('Side selected successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSideSelect = async (vetoId: string, side: GameSide) => {
    await selectSideMutation.mutateAsync({ vetoId, side });
  };

  // Reset veto mutation
  const resetVetoMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteValorantMapVetoesByMatchId(matchId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
      toast.success('Map veto reset successfully');
      setIsResetVetoModalOpen(false);
      router.refresh();
    },
  });

  // Coin toss mutation
  const coinTossMutation = useMutation({
    mutationFn: async () => {
      setIsTossing(true);
      // Brief artificial delay for visual flair
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await performMatchCoinToss(matchId, team1.id, team2.id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Coin toss complete!');
      setIsTossing(false);
      router.refresh(); // Re-fetch server component props to update coinTossWinnerId
    },
    onError: (err) => {
      toast.error('Coin toss failed: ' + err.message);
      setIsTossing(false);
    }
  });

  const resetCoinTossMutation = useMutation({
    mutationFn: async () => {
      const result = await resetMatchCoinToss(matchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
      toast.success('Coin toss reset successfully');
      setIsResetModalOpen(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error('Failed to reset tossing: ' + err.message);
    }
  });

  const switchCoinTossMutation = useMutation({
    mutationFn: async () => {
      if (!coinTossWinnerId) return;
      const result = await switchMatchCoinTossWinner(matchId, coinTossWinnerId, team1.id, team2.id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Coin toss winner switched!');
      setIsSwitchModalOpen(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error('Failed to switch winner: ' + err.message);
    }
  });

  const setChoiceMutation = useMutation({
    mutationFn: async (choice: 'team1' | 'team2') => {
      const result = await setMatchCoinTossChoice(matchId, coinTossResult || 'heads', choice);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Sequence advantage updated!');
      setIsChoiceModalOpen(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error('Failed to set choice: ' + err.message);
    }
  });

  // Get vetoed map names
  const vetoedMapNames = useMemo(() =>
    vetoes.map((v: ValorantMapVetoWithTeam) => v.map_name),
    [vetoes]
  );

  // Get available maps (not yet vetoed)
  const availableMaps = useMemo(() =>
    maps.filter((map: ValorantMap) => !vetoedMapNames.includes(map.name)),
    [maps, vetoedMapNames]
  );

  // Get current veto step
  const vetoSequence = getVetoSequence(bestOf);

  // Determine which team goes first based on coin toss selection
  const tossWinnerChoice = coinTossResult?.split(':')[1] || 'team1';

  let sequenceTeam1Id = team1.id;
  let sequenceTeam2Id = team2.id;
  
  if (coinTossWinnerId) {
    if (tossWinnerChoice === 'team1') {
      sequenceTeam1Id = coinTossWinnerId;
      sequenceTeam2Id = coinTossWinnerId === team1.id ? team2.id : team1.id;
    } else {
      sequenceTeam2Id = coinTossWinnerId;
      sequenceTeam1Id = coinTossWinnerId === team1.id ? team2.id : team1.id;
    }
  }

  const sequenceT1 = sequenceTeam1Id === team1.id ? team1 : team2;
  const sequenceT2 = sequenceTeam2Id === team1.id ? team1 : team2;

  // Helper to determine which team should pick a side for a given veto
  const getSideSelectionTeam = (vetoIndex: number) => {
    const step = vetoSequence[vetoIndex];
    if (!step) return null;

    // For picks, the other team chooses the side
    if (step.action === 'pick') {
      return step.team === 'team1' ? sequenceTeam2Id : sequenceTeam1Id;
    }

    // For the remaining map (decider), the team that didn't act last chooses
    if (step.action === 'remain' && vetoIndex > 0) {
      const lastStep = vetoSequence[vetoIndex - 1];
      return lastStep.team === 'team1' ? sequenceTeam2Id : sequenceTeam1Id;
    }

    return null;
  };

  // Find if there's a pending side selection
  const pendingSideVeto = vetoes.find((v: ValorantMapVetoWithTeam) => (v.action === 'pick' || v.action === 'remain') && !v.side_selected);
  let sideSelectionTeamSide: 'team1' | 'team2' | null = null;

  if (pendingSideVeto) {
    const vetoIndex = vetoes.findIndex((v: ValorantMapVetoWithTeam) => v.id === pendingSideVeto.id);
    const teamId = getSideSelectionTeam(vetoIndex);
    sideSelectionTeamSide = teamId === team1.id ? 'team1' : 'team2';
  }

  const currentStep = pendingSideVeto ? null : getCurrentVetoStep(vetoes as ValorantMapVetoWithTeam[], bestOf);

  // Handle map selection
  const handleMapSelect = async (map: ValorantMap) => {
    if (!currentStep) return;

    // Auth check
    if (!isAdmin && !isPublicView) return;
    if (isPublicView) {
      const expectedTeamId = currentStep.team === 'team1' ? sequenceTeam1Id : sequenceTeam2Id;
      const myTeamId = userSide === 'team1' ? team1.id : team2.id;
      if (currentStep.team !== 'none' && expectedTeamId !== myTeamId) {
        toast.error('It is not your turn');
        return;
      }
    }

    const teamId = currentStep.team === 'team1' ? sequenceTeam1Id : currentStep.team === 'team2' ? sequenceTeam2Id : sequenceTeam1Id;

    try {
      if (isPublicView) {
        await publicVetoMutation.mutateAsync({
          mapName: map.name,
          action: currentStep.action,
          sequenceOrder: currentStep.stepNumber
        });
      } else {
        await addVetoMutation.mutateAsync({
          mapName: map.name,
          teamId,
          action: currentStep.action,
          sequenceOrder: currentStep.stepNumber
        });
      }

      // Check if veto is complete
      if (currentStep.stepNumber >= currentStep.totalSteps) {
        onVetoComplete?.();
      }
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Generate share link
  const generateShareLink = (teamNumber: 1 | 2) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const teamId = teamNumber === 1 ? team1.id : team2.id;
    const link = `${baseUrl}/veto/${matchId}?team=${teamId}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link copied for ${teamNumber === 1 ? team1.abbreviation : team2.abbreviation}`);
  };

  if (isLoadingMaps || isLoadingVetoes) {
    return <MapVetoPanelSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Veto Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {pendingSideVeto ? (
            <Badge
              variant="outline"
              className="text-lg px-4 py-2 border-primary/50 bg-primary/10 text-primary"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2 inline" />
              <span>
                Side Selection: {sideSelectionTeamSide === 'team1' ? team1.abbreviation : team2.abbreviation} picking side for {pendingSideVeto.map_name}
              </span>
            </Badge>
          ) : currentStep ? (
            <Badge
              variant="outline"
              className={cn('text-lg px-4 py-2', actionColors[currentStep.action])}
            >
              {actionIcons[currentStep.action]}
              <span className="ml-2">
                Step {currentStep.stepNumber}/{currentStep.totalSteps} - {currentStep.team === 'none' ? 'Remaining Map' : `${currentStep.team === 'team1' ? sequenceT1.abbreviation : sequenceT2.abbreviation} ${currentStep.action}s`}
              </span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-lg px-4 py-2 border-green-500/50 text-green-400 bg-green-500/10">
              <Check className="w-4 h-4 mr-2 inline" />
              Veto Complete
            </Badge>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateShareLink(1)}
            >
              <Copy className="w-4 h-4 mr-2" />
              {team1.abbreviation} Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateShareLink(2)}
            >
              <Copy className="w-4 h-4 mr-2" />
              {team2.abbreviation} Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetVetoModalOpen(true)}
              disabled={resetVetoMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Vetoes
            </Button>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={isResetVetoModalOpen}
        onOpenChange={setIsResetVetoModalOpen}
        title="Reset Map Veto Sequence?"
        description="Are you sure you want to reset the Map Veto sequence? This will permanently delete ALL map bans and picks."
        cancelText="Cancel"
        confirmText="Yes, reset vetoes"
        onConfirm={() => resetVetoMutation.mutate()}
        variant="destructive"
      />

      {!coinTossWinnerId ? (
        <Card className="bg-gradient-to-b from-background to-muted/20 border-muted">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Coin Toss</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className={cn("relative w-32 h-32 rounded-full border-4 flex items-center justify-center bg-muted transition-transform duration-700", isTossing && "animate-spin border-primary")}>
              {isTossing ? (
                <RotateCcw className="w-10 h-10 text-primary animate-pulse" />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground/30">?</span>
              )}
            </div>

            <div className="text-center max-w-sm">
              <p className="text-muted-foreground mb-6">
                A coin toss determines which team gets the opening advantage in the Map Veto sequence.
              </p>

              {isAdmin ? (
                <Button
                  size="lg"
                  className="w-full text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => coinTossMutation.mutate()}
                  disabled={isTossing || coinTossMutation.isPending}
                >
                  {isTossing ? 'Flipping Coin...' : 'Toss Coin'}
                </Button>
              ) : (
                <Badge variant="outline" className="text-base px-4 py-2 bg-muted/50 border-dashed">
                  Waiting for Admin to toss...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Coin Toss Result Header */}
          <div className="rounded-lg border bg-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">Coin Toss Result
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase font-mono">{coinTossResult?.split(':')[0] || 'heads'}</Badge>
                </p>
                <p className="font-bold flex items-center gap-2">
                  <span className="text-primary">{coinTossWinnerId === team1.id ? team1.name : team2.name}</span>
                  <span className="text-muted-foreground text-sm font-normal">
                    chose <strong className="text-foreground">{tossWinnerChoice === 'team1' ? 'First Ban / Pick' : 'Second Ban / Pick'}</strong>
                  </span>
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedChoice(tossWinnerChoice as 'team1' | 'team2');
                    setIsChoiceModalOpen(true);
                  }}
                  disabled={setChoiceMutation.isPending}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Change Choice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSwitchModalOpen(true)}
                  disabled={switchCoinTossMutation.isPending}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Switch Winner
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsResetModalOpen(true)}
                  disabled={resetCoinTossMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Toss
                </Button>
              </div>
            )}
          </div>

          <ConfirmationModal
            open={isChoiceModalOpen}
            onOpenChange={setIsChoiceModalOpen}
            title="Update Coin Toss Choice"
            description={
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Change whether the coin toss winner gets first or second action in the veto sequence.
                </p>
                <p className="text-sm text-muted-foreground">
                  Current Winner: <strong className="text-foreground">{coinTossWinnerId === team1.id ? team1.abbreviation : team2.abbreviation}</strong>
                </p>
                <div className="flex gap-4">
                  <Button
                    variant={selectedChoice === 'team1' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={(e) => { e.preventDefault(); setSelectedChoice('team1'); }}
                  >
                    First Ban (Team A)
                  </Button>
                  <Button
                    variant={selectedChoice === 'team2' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={(e) => { e.preventDefault(); setSelectedChoice('team2'); }}
                  >
                    Second Ban (Team B)
                  </Button>
                </div>
              </div>
            }
            cancelText="Cancel"
            confirmText="Update Choice"
            onConfirm={() => setChoiceMutation.mutate(selectedChoice)}
          />

          <ConfirmationModal
            open={isResetModalOpen}
            onOpenChange={setIsResetModalOpen}
            title="Reset Coin Toss?"
            description="Are you sure you want to completely cancel and reset the coin toss? The sequence will return to the 'Toss Coin' phase."
            cancelText="Cancel"
            confirmText="Yes, reset toss"
            onConfirm={() => resetCoinTossMutation.mutate()}
            variant="destructive"
          />

          <ConfirmationModal
            open={isSwitchModalOpen}
            onOpenChange={setIsSwitchModalOpen}
            title="Switch Winner?"
            description={`Are you sure you want to manually change the Coin Toss winner? The new winner will be ${coinTossWinnerId === team1.id ? team2.name : team1.name}.`}
            cancelText="Cancel"
            confirmText="Yes, switch winner"
            onConfirm={() => switchCoinTossMutation.mutate()}
          />

          {/* Veto Sequence Timeline */}
          <Card className="bg-gradient-to-b from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Veto Sequence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {vetoSequence.map((step, index) => {
                  const veto = vetoes[index] as ValorantMapVetoWithTeam | undefined;
                  const isCompleted = !!veto;
                  const isPendingSide = isCompleted && ['pick', 'remain'].includes(veto.action) && !veto.side_selected;
                  const isCurrent = pendingSideVeto ? isPendingSide : index === vetoes.length;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                        isCompleted && actionColors[step.action],
                        // If it's waiting for side, highlight with pulse
                        isPendingSide && 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse',
                        isCurrent && !isPendingSide && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        !isCompleted && !isCurrent && 'border-dashed border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {actionIcons[step.action]}
                        {step.team !== 'none' && (
                          <span className="text-sm font-medium">
                            {step.team === 'team1' ? sequenceT1.abbreviation : sequenceT2.abbreviation}
                          </span>
                        )}
                      </div>
                      {isCompleted && veto && (
                        <Badge variant="secondary" className="text-xs">
                          {veto.map_name}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Map Pool Grid */}
          <Card className="bg-gradient-to-b from-background to-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Map Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {maps.map((map: ValorantMap) => {
                  const veto = vetoes.find((v: ValorantMapVetoWithTeam) => v.map_name === map.name) as ValorantMapVetoWithTeam | undefined;
                  const isBanned = veto?.action === 'ban';
                  const isPicked = veto?.action === 'pick';
                  const isRemaining = veto?.action === 'remain';
                  const isAvailable = !vetoedMapNames.includes(map.name);

                  // Interaction logic
                  const isMyTurn = isPublicView ? (currentStep?.team === 'none' || currentStep?.team === userSide) : isAdmin;
                  const canSelect = !pendingSideVeto && isAvailable && isMyTurn && !!currentStep;

                  // Side selection logic
                  let canSelectSide = false;
                  if (pendingSideVeto && pendingSideVeto.id === veto?.id) {
                    if (isAdmin) {
                      canSelectSide = true;
                    } else if (isPublicView && sideSelectionTeamSide === userSide) {
                      canSelectSide = true;
                    }
                  }

                  // Determine who selected the side to display it clearly
                  let sideSelectedByTeam: string | undefined = undefined;
                  if (veto?.side_selected && (isPicked || isRemaining)) {
                    const vetoIndex = vetoes.findIndex((v: ValorantMapVetoWithTeam) => v.id === veto.id);
                    if (vetoIndex !== -1) {
                      const sideSelectionTeamId = getSideSelectionTeam(vetoIndex);
                      if (sideSelectionTeamId) {
                        sideSelectedByTeam = sideSelectionTeamId === team1.id ? team1.abbreviation : team2.abbreviation;
                      }
                    }
                  }

                  return (
                    <MapCard
                      key={map.id}
                      map={map}
                      veto={veto}
                      isBanned={isBanned}
                      isPicked={isPicked}
                      isRemaining={isRemaining}
                      isSelectable={canSelect}
                      canSelectSide={canSelectSide}
                      sideSelectedByTeam={sideSelectedByTeam}
                      vetoedByTeam={veto?.schools_teams?.schools?.abbreviation}
                      onClick={() => handleMapSelect(map)}
                      onSelectSide={(side) => veto?.id ? handleSideSelect(veto.id, side) : null}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Map Card Component
interface MapCardProps {
  map: ValorantMap;
  veto?: ValorantMapVetoWithTeam;
  isBanned: boolean;
  isPicked: boolean;
  isRemaining: boolean;
  isSelectable: boolean;
  canSelectSide?: boolean;
  sideSelectedByTeam?: string;
  vetoedByTeam?: string;
  onClick: () => void;
  onSelectSide?: (side: GameSide) => void;
}

function MapCard({
  map,
  veto,
  isBanned,
  isPicked,
  isRemaining,
  isSelectable,
  canSelectSide,
  sideSelectedByTeam,
  vetoedByTeam,
  onClick,
  onSelectSide
}: MapCardProps) {
  return (
    <div
      onClick={() => {
        if (isSelectable) onClick();
      }}
      role="button"
      tabIndex={isSelectable ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isSelectable) onClick();
        }
      }}
      className={cn(
        'relative group aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isSelectable && 'hover:scale-105 hover:shadow-xl hover:z-10 cursor-pointer',
        (!isSelectable && !canSelectSide) && 'cursor-default',
        isBanned && 'border-red-500/50 grayscale',
        isPicked && 'border-green-500 ring-2 ring-green-500/30',
        isRemaining && 'border-amber-500 ring-2 ring-amber-500/30',
        !isBanned && !isPicked && !isRemaining && 'border-muted',
        (isSelectable || canSelectSide) && !isBanned && !isPicked && !isRemaining && 'hover:border-primary'
      )}
    >
      {/* Map Image */}
      {map.splash_image_url ? (
        <Image
          src={map.splash_image_url}
          alt={map.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <Map className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      {/* Inactive Badge */}
      {!map.is_active && (
        <div className="absolute top-2 right-2 z-20">
          <Badge variant="destructive" className="bg-red-500/80 hover:bg-red-500/80 shadow-sm border-none">
            Inactive
          </Badge>
        </div>
      )}

      {/* Overlay for banned/picked */}
      {(isBanned || isPicked || isRemaining) && (
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          isBanned && 'bg-black/70',
          isPicked && 'bg-green-500/20',
          isRemaining && 'bg-amber-500/20'
        )}>
          {isBanned && <Ban className="w-10 h-10 text-red-500" />}
          {isPicked && <Check className="w-10 h-10 text-green-500" />}
          {isRemaining && <Map className="w-10 h-10 text-amber-500" />}

          {vetoedByTeam && !isRemaining && (
            <Badge
              variant="outline"
              className={cn(
                'mt-2',
                isBanned && 'border-red-500/50 text-red-400',
                isPicked && 'border-green-500/50 text-green-400'
              )}
            >
              {vetoedByTeam}
            </Badge>
          )}

          {/* Side Selection for picked maps */}
          {(isPicked || isRemaining) && veto?.side_selected && (
            <div className="mt-2 flex items-center justify-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-md border border-white/5">
              {sideSelectedByTeam && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {sideSelectedByTeam}:
                </span>
              )}
              {veto.side_selected === 'attack' ? (
                <Sword className="w-3.5 h-3.5 text-orange-400" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="text-xs capitalize font-medium">{veto.side_selected}</span>
            </div>
          )}

          {/* Side Selection Buttons */}
          {(isPicked || isRemaining) && !veto?.side_selected && canSelectSide && (
            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-black/50 border-orange-500/50 hover:bg-orange-500/20 hover:text-orange-400 text-white"
                onClick={() => onSelectSide?.('attack')}
              >
                <Sword className="w-3 h-3 mr-1 text-orange-400" />
                Attack
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-black/50 border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-400 text-white"
                onClick={() => onSelectSide?.('defense')}
              >
                <Shield className="w-3 h-3 mr-1 text-blue-400" />
                Defense
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Map Name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <p className="text-white font-bold text-lg">{map.name}</p>
      </div>

      {/* Hover Effect */}
      {isSelectable && (
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-lg pointer-events-none">
            Select
          </span>
        </div>
      )}
    </div>
  );
}

// Skeleton
function MapVetoPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
