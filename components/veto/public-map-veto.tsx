'use client';

import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Ban,
  Check,
  Map,
  Shield,
  Sword,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase/client';

// Types
import { ValorantMapVetoWithTeam } from '@/lib/types/valorant-map-vetoes';
import { ValorantMap } from '@/lib/types/valorant-maps';
import { getVetoSequence, VetoAction } from '@/lib/types/map-veto';

// Actions
import { getAllValorantMaps } from '@/actions/valorant-maps';
import { getValorantMapVetoesByMatchId } from '@/actions/valorant-map-vetoes';

interface PublicMapVetoProps {
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
  coinTossWinnerId?: string | null;
  coinTossResult?: string | null;
}

// Action colors for visual distinction
const actionColors = {
  ban: 'text-red-400 bg-red-400/10 border-red-500/20',
  pick: 'text-green-400 bg-green-400/10 border-green-500/20',
  remain: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
};

const actionIcons = {
  ban: <Ban className="w-3.5 h-3.5" />,
  pick: <Check className="w-3.5 h-3.5" />,
  remain: <Map className="w-3.5 h-3.5" />,
};

export function PublicMapVetoTable({
  matchId,
  bestOf,
  team1,
  team2,
  coinTossWinnerId,
  coinTossResult,
}: PublicMapVetoProps) {
  const queryClient = useQueryClient();

  // ── Supabase Realtime ──
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`veto-public-realtime-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'valorant_map_vetoes',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['valorant-map-vetoes', matchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  // Fetch all active maps
  const { data: allMaps = [], isLoading: isLoadingMaps } = useQuery({
    queryKey: ['valorant-maps-all'],
    queryFn: async () => {
      const result = await getAllValorantMaps();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const maps = useMemo(() => allMaps.filter((m: ValorantMap) => m.is_active), [allMaps]);

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

  const isLoading = isLoadingMaps || isLoadingVetoes;

  // Determine coin toss outcome for sequence generation
  const defaultWinnerId = team1.id;
  const tossWinnerChoice = coinTossResult?.split(':')[1] || 'team1';
  let sequenceTeam1Id = defaultWinnerId;
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
  const sequenceT2 = sequenceTeam2Id === team2.id ? team2 : team1;

  // Get the sequence timeline based on BO format
  const vetoSequence = useMemo(() => getVetoSequence(bestOf), [bestOf]);
  const vetoedMapNames = vetoes.map((v: ValorantMapVetoWithTeam) => v.map_name);

  // Helper to determine which team selects side
  const getSideSelectionTeam = (vetoIndex: number) => {
    if (vetoIndex < 0 || vetoIndex >= vetoSequence.length) return null;
    const step = vetoSequence[vetoIndex];
    if (step.action === 'pick' || step.action === 'remain') {
      if (step.team === 'team1') return sequenceTeam2Id;
      if (step.team === 'team2') return sequenceTeam1Id;
      if (step.team === 'none') {
        const lastPickIndex = [...vetoSequence].reverse().findIndex(s => s.action === 'pick' && s.team !== 'none');
        if (lastPickIndex !== -1) {
          const actualIndex = vetoSequence.length - 1 - lastPickIndex;
          const lastPickTeam = vetoSequence[actualIndex].team;
          return lastPickTeam === 'team1' ? sequenceTeam2Id : sequenceTeam1Id;
        }
      }
    }
    return null;
  };

  if (isLoading) {
    return <PublicMapVetoSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Veto Sequence Table */}
      <div className="rounded-xl border border-border/30 overflow-hidden bg-card/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] caption-bottom text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-left">
                <th className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-9 min-w-[50px] text-center w-12">#</th>
                <th className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-3 h-9 min-w-[140px]">Team</th>
                <th className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-3 h-9 min-w-[100px]">Action</th>
                <th className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-3 h-9 min-w-[120px]">Map</th>
                <th className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-9 min-w-[140px] text-right">Side Selection</th>
              </tr>
            </thead>
            <tbody>
              {vetoSequence.map((step, index) => {
                const veto = vetoes[index] as ValorantMapVetoWithTeam | undefined;
                const isCompleted = !!veto;
                const team = step.team === 'team1' ? sequenceT1 : step.team === 'team2' ? sequenceT2 : null;
                const isPendingSide = isCompleted && ['pick', 'remain'].includes(veto.action) && !veto.side_selected;
                
                let sideSelectedByTeamObj = null;
                if (isCompleted && (veto.action === 'pick' || veto.action === 'remain')) {
                  const sideTeamId = getSideSelectionTeam(index);
                  sideSelectedByTeamObj = sideTeamId === team1.id ? team1 : sideTeamId === team2.id ? team2 : null;
                }

                return (
                  <tr
                    key={index}
                    className={cn(
                      'group border-b border-border/10 transition-colors h-14',
                      isCompleted ? 'hover:bg-muted/20' : 'bg-muted/5 opacity-50',
                      isPendingSide && 'bg-primary/5 animate-pulse border-primary/20'
                    )}
                  >
                    {/* Order */}
                    <td className="px-4 py-2 text-center">
                      <span className="text-xs font-medium text-muted-foreground/60">{index + 1}</span>
                    </td>

                    {/* Team */}
                    <td className="px-3 py-2">
                      {team ? (
                        <div className="flex items-center gap-2">
                          {team.logoUrl ? (
                            <Image
                              src={team.logoUrl}
                              alt={team.abbreviation}
                              width={24}
                              height={24}
                              className="h-6 w-6 rounded-full object-cover border border-border/40"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border border-border/40">
                              <span className="text-[10px] font-bold text-muted-foreground">{team.abbreviation.charAt(0)}</span>
                            </div>
                          )}
                          <span className="font-bold text-sm text-foreground">
                            {team.abbreviation}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold capitalize tracking-wide",
                        actionColors[step.action]
                      )}>
                        {actionIcons[step.action]}
                        {step.action}
                      </div>
                    </td>

                    {/* Map Name */}
                    <td className="px-3 py-2">
                      {isCompleted ? (
                        <span className="font-bold text-sm bg-muted/40 px-3 py-1 rounded-md border border-border/40">
                          {veto.map_name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/40 font-medium italic">Pending...</span>
                      )}
                    </td>

                    {/* Side Selection */}
                    <td className="px-4 py-2 text-right">
                      {isCompleted && (veto.action === 'pick' || veto.action === 'remain') ? (
                        veto.side_selected ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {sideSelectedByTeamObj?.abbreviation}:
                            </span>
                            <div className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold capitalize",
                              veto.side_selected === 'attack' 
                                ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' 
                                : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                            )}>
                              {veto.side_selected === 'attack' ? <Sword className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                              {veto.side_selected}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-primary tracking-wide bg-primary/10 px-2 py-1 rounded border border-primary/20">
                            Awaiting Side ({sideSelectedByTeamObj?.abbreviation})
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Pool Visuals (Compact) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {maps.map((map: ValorantMap) => {
          const veto = vetoes.find((v: ValorantMapVetoWithTeam) => v.map_name === map.name) as ValorantMapVetoWithTeam | undefined;
          const isBanned = veto?.action === 'ban';
          const isPicked = veto?.action === 'pick';
          const isRemaining = veto?.action === 'remain';

          return (
            <div
              key={map.id}
              className={cn(
                'relative aspect-video rounded-md overflow-hidden border transition-all duration-200',
                isBanned && 'border-red-500/50 grayscale opacity-40',
                isPicked && 'border-green-500 ring-1 ring-green-500/30',
                isRemaining && 'border-amber-500 ring-1 ring-amber-500/30',
                !isBanned && !isPicked && !isRemaining && 'border-muted/50 opacity-60'
              )}
            >
              {map.splash_image_url ? (
                <Image src={map.splash_image_url} alt={map.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                  <Map className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              {/* Overlay for banned/picked */}
              {(isBanned || isPicked || isRemaining) && (
                <div className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  isBanned && 'bg-black/60',
                  isPicked && 'bg-green-500/10',
                  isRemaining && 'bg-amber-500/10'
                )}>
                  {isBanned && <Ban className="w-6 h-6 text-red-500 drop-shadow-md" />}
                  {isPicked && <Check className="w-6 h-6 text-green-500 drop-shadow-md" />}
                  {isRemaining && <Map className="w-6 h-6 text-amber-500 drop-shadow-md" />}
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                <p className="text-white font-bold text-[10px] text-center">{map.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublicMapVetoSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
