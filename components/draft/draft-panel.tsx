'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Ban, 
  Users, 
  RotateCcw,
  Play,
  Pause,
  Timer,
  Check,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

// Types
import { GameCharacter } from '@/lib/types/game-characters';
import { 
  GameDraftAction, 
  calculateDraftState,
  DraftState,
  MLBB_DRAFT_SEQUENCE
} from '@/lib/types/game-draft';

// Services & Hooks
import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { GameDraftService } from '@/services/game-draft';
import { useRealtimeDraft } from '@/hooks/use-realtime-draft';

interface DraftPanelProps {
  gameId: number;
  matchId: number;
  esportId: number;
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
}

// Role colors for visual distinction
const roleColors: Record<string, string> = {
  'Tank': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'Fighter': 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  'Assassin': 'from-red-500/20 to-red-600/20 border-red-500/30',
  'Mage': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'Marksman': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  'Support': 'from-green-500/20 to-green-600/20 border-green-500/30',
};

const roleTextColors: Record<string, string> = {
  'Tank': 'text-blue-400',
  'Fighter': 'text-orange-400',
  'Assassin': 'text-red-400',
  'Mage': 'text-purple-400',
  'Marksman': 'text-yellow-400',
  'Support': 'text-green-400',
};

export function DraftPanel({
  gameId,
  matchId,
  esportId,
  team1,
  team2,
  isAdmin = false,
}: DraftPanelProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  // 1. Fetch Characters
  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['game-characters', esportId],
    queryFn: async () => {
      const result = await getGameCharactersByEsportId(esportId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!esportId,
  });

  // 2. Fetch Draft Actions
  const { data: actions = [], isLoading: isLoadingActions, refetch: refetchActions } = useQuery({
    queryKey: ['game-draft-actions', gameId],
    queryFn: async () => {
      const result = await GameDraftService.getByGameId(gameId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!gameId,
  });

  // 3. Realtime Subscription
  useRealtimeDraft(gameId, (payload) => {
    // Optimistic updates could go here, but refetch is safer for sequence consistency
    refetchActions();
    setTimer(30); // Reset timer on new action
  });

  // 4. Derive State
  const draftState = useMemo(() => 
    calculateDraftState(gameId, matchId, team1.id, team2.id, actions),
    [gameId, matchId, team1.id, team2.id, actions]
  );

  // 5. Mutations
  const submitActionMutation = useMutation({
    mutationFn: async ({ hero, type }: { hero: GameCharacter; type: 'ban' | 'pick' }) => {
      if (!draftState.nextAction) return;
      
      const result = await GameDraftService.insert({
        game_id: gameId,
        team_id: draftState.nextAction.team === 'team1' ? team1.id : team2.id,
        hero_name: hero.name,
        hero_id: hero.id,
        action_type: type,
        sort_order: draftState.currentStepIndex + 1,
        is_locked: true // Auto-lock for now
      });

      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      refetchActions();
      toast.success('Action recorded');
    },
    onError: (err) => toast.error('Failed to submit action'),
  });

  const resetDraftMutation = useMutation({
    mutationFn: async () => {
        await GameDraftService.resetDraft(gameId);
    },
    onSuccess: () => {
        refetchActions();
        toast.success('Draft reset');
    }
  });

  // 6. Interaction Handlers
  const handleCharacterSelect = (character: GameCharacter) => {
    if (!draftState.nextAction || !isAdmin) return;
    
    // Check if already taken
    if (actions.some(a => a.hero_name === character.name)) {
        toast.error('Hero already selected or banned');
        return;
    }

    submitActionMutation.mutate({ 
        hero: character, 
        type: draftState.nextAction.action 
    });
  };

  // 7. Timer Logic
  useEffect(() => {
    if (draftState.isComplete || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, draftState.isComplete]);


  // Filtering
  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !selectedRole || char.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, selectedRole]);

  const uniqueRoles = useMemo(() => 
    [...new Set(characters.map(char => char.role))].sort(),
    [characters]
  );

  if (isLoadingCharacters || isLoadingActions) {
    return <DraftPanelSkeleton />;
  }

  const currentAction = draftState.nextAction;
  const activeTeam = currentAction?.team === 'team1' ? team1 : team2;
  const isBanPhase = currentAction?.action === 'ban';

  return (
    <div className="space-y-6">
      {/* Draft Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background/50 p-4 rounded-xl border">
        
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          {!draftState.isComplete ? (
               <Badge 
               variant="outline" 
               className={cn(
                 'text-lg px-6 py-2 border-2',
                 isBanPhase
                   ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                   : 'border-blue-500/50 text-blue-400 bg-blue-500/10'
               )}
             >
                 <div className="flex items-center gap-2">
                     {isBanPhase ? <Ban className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                     <span className="font-bold">
                        {isBanPhase ? 'BAN PHASE' : 'PICK PHASE'}
                     </span>
                     <span className="opacity-50 mx-2">|</span>
                     <span>{activeTeam?.abbreviation} Turn</span>
                 </div>
             </Badge>
          ) : (
                <Badge className="text-lg px-6 py-2 bg-green-500">Draft Complete</Badge>
          )}

          {!draftState.isComplete && (
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-amber-500">
                <Timer className="w-5 h-5" />
                {timer}s
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => resetDraftMutation.mutate()}
              disabled={resetDraftMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Draft
            </Button>
          </div>
        )}
      </div>

      {/* Main Draft Area */}
      <div className="grid grid-cols-12 gap-6">
          
          {/* Team 1 Panel */}
          <div className="col-span-12 md:col-span-3 space-y-4">
               <TeamDraftColumn 
                team={team1}
                bans={draftState.team1Bans}
                picks={draftState.team1Picks}
                isActive={currentAction?.team === 'team1'}
                characters={characters}
               />
          </div>

          {/* Hero Pool */}
          <div className="col-span-12 md:col-span-6">
            <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 h-full">
                <CardHeader className="pb-2">
                    <div className="flex gap-2 mb-4">
                         <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search heroes..." 
                                className="pl-10 bg-slate-900/50 border-slate-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                         </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        <Button 
                            variant={selectedRole === null ? "default" : "ghost"} 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => setSelectedRole(null)}
                        >
                            All
                        </Button>
                        {uniqueRoles.map(role => (
                             <Button 
                                key={role}
                                variant={selectedRole === role ? "default" : "ghost"}
                                size="sm" 
                                className={cn("h-7 text-xs", selectedRole !== role && roleTextColors[role])}
                                onClick={() => setSelectedRole(role)}
                             >
                                {role}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {filteredCharacters.map(char => {
                                const isTaken = actions.some(a => a.hero_name === char.name);
                                return (
                                    <CharacterCard
                                        key={char.id}
                                        character={char}
                                        isTaken={isTaken}
                                        isSelectable={!isTaken && isAdmin && !draftState.isComplete}
                                        onClick={() => handleCharacterSelect(char)}
                                    />
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
          </div>

          {/* Team 2 Panel */}
          <div className="col-span-12 md:col-span-3 space-y-4">
               <TeamDraftColumn 
                team={team2}
                bans={draftState.team2Bans}
                picks={draftState.team2Picks}
                isActive={currentAction?.team === 'team2'}
                characters={characters}
                isRightSide
               />
          </div>

      </div>
    </div>
  );
}

// Sub-components

function TeamDraftColumn({ team, bans, picks, isActive, characters, isRightSide = false }: {
    team: DraftPanelProps['team1'],
    bans: GameDraftAction[],
    picks: GameDraftAction[],
    isActive: boolean;
    characters: GameCharacter[];
    isRightSide?: boolean;
}) {
    // 5 Picks per team usually
    const pickSlots = Array.from({ length: 5 });
    // 5 Bans per team usually
    const banSlots = Array.from({ length: 5 });

    const getHeroIcon = (name: string) => characters.find(c => c.name === name)?.icon_url;

    return (
        <div className={cn("space-y-6", isRightSide ? "text-right" : "text-left")}>
            <div className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                isActive ? "bg-slate-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-slate-900/50 border-slate-800"
            )}>
                 <h2 className="text-2xl font-bold tracking-tight">{team.abbreviation}</h2>
                 <p className="text-slate-400 text-sm truncate">{team.name}</p>
                 {isActive && <Badge className="mt-2 animate-pulse bg-blue-500">Drafting...</Badge>}
            </div>

            {/* Picks */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Picks</h3>
                <div className="flex flex-col gap-2">
                    {pickSlots.map((_, i) => {
                        const pick = picks[i];
                        const icon = pick ? getHeroIcon(pick.hero_name) : null;
                        
                        return (
                            <div key={i} className={cn(
                                "h-16 relative rounded-lg border flex items-center overflow-hidden bg-slate-900",
                                pick ? "border-slate-700" : "border-slate-800 border-dashed"
                            )}>
                                {pick ? (
                                    <>
                                        {icon && (
                                            <Image src={icon} alt={pick.hero_name} fill className="object-cover opacity-60" />
                                        )}
                                        <div className={cn(
                                            "absolute inset-0 flex items-center px-4 font-bold text-lg drop-shadow-md z-10",
                                            isRightSide ? "justify-end" : "justify-start"
                                        )}>
                                            {pick.hero_name}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full text-center text-slate-600 text-xs">Pick {i + 1}</div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bans */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bans</h3>
                <div className={cn("flex flex-wrap gap-2", isRightSide ? "justify-end" : "justify-start")}>
                     {banSlots.map((_, i) => {
                         const ban = bans[i];
                         const icon = ban ? getHeroIcon(ban.hero_name) : null;

                         return (
                             <div key={i} className={cn(
                                 "w-10 h-10 relative rounded border flex items-center justify-center bg-slate-950 overflow-hidden",
                                 ban ? "border-red-900/50" : "border-slate-800 border-dashed"
                             )}>
                                 {ban ? (
                                     <>
                                        {icon && <Image src={icon} alt={ban.hero_name} fill className="object-cover grayscale opacity-50" />}
                                        <Ban className="w-6 h-6 text-red-500 z-10" />
                                     </>
                                 ) : (
                                     <span className="text-[10px] text-slate-700">{i + 1}</span>
                                 )}
                             </div>
                         )
                     })}
                </div>
            </div>
        </div>
    )
}

function CharacterCard({ character, isTaken, isSelectable, onClick }: { 
    character: GameCharacter, 
    isTaken: boolean, 
    isSelectable: boolean, 
    onClick: () => void 
}) {
    return (
        <button
            onClick={onClick}
            disabled={isTaken || !isSelectable}
            className={cn(
                "aspect-square relative rounded-lg overflow-hidden border  transition-all",
                "bg-gradient-to-br from-slate-800 to-slate-900",
                isTaken ? "opacity-40 grayscale border-slate-800" : "hover:scale-105 hover:ring-2 hover:ring-blue-500 border-slate-700",
                roleColors[character.role] && !isTaken && "border-opacity-50"
            )}
        >
            {character.icon_url ? (
                <Image src={character.icon_url} alt={character.name} fill className="object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                    {character.name.substring(0, 2)}
                </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                <p className="text-[10px] text-white truncate text-center font-medium">{character.name}</p>
            </div>

            {isTaken && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Lock className="w-6 h-6 text-slate-400" />
                </div>
            )}
        </button>
    );
}

function DraftPanelSkeleton() {
  return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
}

