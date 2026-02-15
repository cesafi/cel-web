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
  Lock,
  Undo2
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
import { GameRosterService } from '@/services/game-roster';
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
  team1Players?: { id: string; ign: string; role: string | null }[];
  team2Players?: { id: string; ign: string; role: string | null }[];
  isAdmin?: boolean;
}

interface AssignedPlayer {
    player_id: string;
    player_role: string;
    sort_order: number;
}

// Role colors for visual distinction
const roleColors: Record<string, string> = {
  'Tank': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Fighter': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Assassin': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Mage': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Marksman': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Support': 'bg-green-500/10 text-green-500 border-green-500/20',
};

const roleTextColors: Record<string, string> = {
  'Tank': 'text-blue-500',
  'Fighter': 'text-orange-500',
  'Assassin': 'text-red-500',
  'Mage': 'text-purple-500',
  'Marksman': 'text-yellow-500',
  'Support': 'text-green-500',
};

export function DraftPanel({
  gameId,
  matchId,
  esportId,
  team1,
  team2,
  team1Players,
  team2Players,
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

  // 3. Fetch Game Rosters (Pre-assigned slots)
  const { data: rosters = [], refetch: refetchRosters } = useQuery({
    queryKey: ['game-rosters', gameId],
    queryFn: async () => {
        const result = await GameRosterService.getByGameId(gameId);
        if (!result.success) throw new Error(result.error);
        return result.data;
    },
    enabled: !!gameId
  });

  // 4. Realtime Subscription

  // 3. Realtime Subscription
  useRealtimeDraft(gameId, (payload) => {
    // Optimistic updates could go here, but refetch is safer for sequence consistency
    refetchActions();
    refetchRosters();
    setTimer(30); // Reset timer on new action
  });

  // 4. Derive State
  const draftState = useMemo(() => 
    calculateDraftState(gameId, matchId, team1.id, team2.id, actions),
    [gameId, matchId, team1.id, team2.id, actions]
  );
  
  // Filter rosters by team
  const team1Roster = useMemo(() => rosters.filter(r => r.team_id === team1.id), [rosters, team1.id]);
  const team2Roster = useMemo(() => rosters.filter(r => r.team_id === team2.id), [rosters, team2.id]);
  
  // Mutation for assigning player
  const assignPlayerMutation = useMutation({
      mutationFn: async (data: { teamId: string, playerId: string, role: string, sortOrder: number }) => {
          const result = await GameRosterService.upsert({
              game_id: gameId,
              team_id: data.teamId,
              player_id: data.playerId,
              player_role: data.role,
              sort_order: data.sortOrder
          });
          if (!result.success) throw new Error(result.error);
          return result;
      },
      onSuccess: () => {
          refetchRosters();
          toast.success("Player assigned");
      },
      onError: () => toast.error("Failed to assign player")
  });

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

  const undoActionMutation = useMutation({
    mutationFn: async () => {
        const result = await GameDraftService.undoLastAction(gameId);
        if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
        refetchActions();
        toast.success('Undid last action');
    },
    onError: (err) => toast.error('Failed to undo action'),
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
    <div className="space-y-6 pb-20">
      {/* Draft Header */}
      <Card className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
        
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          {!draftState.isComplete ? (
               <Badge 
               variant="outline" 
               className={cn(
                 'text-lg px-6 py-2 border-2',
                 isBanPhase
                   ? 'border-red-500/50 text-red-500 bg-red-500/10' 
                   : 'border-blue-500/50 text-blue-500 bg-blue-500/10'
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
                <Badge className="text-lg px-6 py-2 bg-green-500 text-white">Draft Complete</Badge>
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
              variant="secondary"
              size="sm"
              onClick={() => undoActionMutation.mutate()}
              disabled={undoActionMutation.isPending || actions.length === 0}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Undo Last
            </Button>
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
      </Card>

      {/* Main Draft Area */}
      <div className="grid grid-cols-12 gap-6">
          
          {/* Team 1 Panel */}
          <div className="col-span-12 md:col-span-3 space-y-4">
               <TeamDraftColumn 
                team={team1}
                bans={draftState.team1Bans}
                picks={draftState.team1Picks}
                roster={team1Roster}
                players={team1Players || []}
                onAssignPlayer={(playerId, role, sortOrder) => assignPlayerMutation.mutate({ 
                    teamId: team1.id, playerId, role, sortOrder 
                })}
                isActive={currentAction?.team === 'team1'}
                characters={characters}
                isAdmin={isAdmin}
               />
          </div>

          {/* Hero Pool */}
          <div className="col-span-12 md:col-span-6">
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <div className="flex gap-2 mb-4">
                         <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search heroes..." 
                                className="pl-10"
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
                roster={team2Roster}
                players={team2Players || []}
                onAssignPlayer={(playerId, role, sortOrder) => assignPlayerMutation.mutate({ 
                    teamId: team2.id, playerId, role, sortOrder 
                })}
                isActive={currentAction?.team === 'team2'}
                characters={characters}
                isRightSide
                isAdmin={isAdmin}
               />
          </div>

      </div>
    </div>
  );
}

// Sub-components

function TeamDraftColumn({ 
    team, bans, picks, roster, players, onAssignPlayer, isActive, characters, isRightSide = false, isAdmin = false 
}: {
    team: DraftPanelProps['team1'],
    bans: GameDraftAction[],
    picks: GameDraftAction[],
    roster: any[], // content of game_rosters
    players: { id: string; ign: string; role: string | null }[],
    onAssignPlayer: (playerId: string, role: string, sortOrder: number) => void,
    isActive: boolean;
    characters: GameCharacter[];
    isRightSide?: boolean;
    isAdmin?: boolean;
}) {
    // 5 Picks per team usually
    const pickSlots = Array.from({ length: 5 });
    // 5 Bans per team usually
    const banSlots = Array.from({ length: 5 });

    const getHeroIcon = (name: string) => characters.find(c => c.name === name)?.icon_url;

    return (
        <div className={cn("space-y-6", isRightSide ? "text-right" : "text-left")}>
            <div className={cn(
                "relative p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                isActive 
                    ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                    : "bg-card border-border"
            )}>
                 {/* Active Indicator Overlay (Border Glow) */}
                 {isActive && (
                    <div className="absolute inset-0 border-2 border-primary rounded-xl animate-pulse pointer-events-none" />
                 )}

                 <div className={cn("flex items-center gap-4", isRightSide ? "flex-row-reverse" : "flex-row")}>
                     {/* Team Logo */}
                     <div className="relative w-12 h-12 shrink-0 bg-background rounded-full overflow-hidden border border-border">
                        {team.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team.logoUrl} alt={team.abbreviation} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {team.abbreviation.substring(0, 2)}
                            </div>
                        )}
                     </div>

                     <div className="min-w-0">
                         <h2 className="text-2xl font-bold tracking-tight leading-none">
                            {team.abbreviation}
                         </h2>
                         <p className="text-muted-foreground text-sm truncate mt-1">{team.name}</p>
                     </div>
                 </div>
            </div>

            {/* Picks */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Picks</h3>
                <div className="flex flex-col gap-2">
                    {pickSlots.map((_, i) => {
                        const pick = picks[i];
                        const icon = pick ? getHeroIcon(pick.hero_name) : null;
                        // Find assigned player for this slot (sort_order i corresponds to 0-4 index, but we might want to map it to draft sequence if complex)
                        // For simplicity, let's assume mapping 0->Slot 1, etc.
                        const assignedPlayer = roster.find(r => r.sort_order === i);
                        const playerDetails = assignedPlayer ? players.find(p => p.id === assignedPlayer.player_id) : null;
                        
                        return (
                            <div key={i} className={cn(
                                "flex flex-col gap-1"
                            )}>
                                {/* Pick Card */}
                                <div className={cn(
                                    "h-16 relative rounded-lg border flex items-center overflow-hidden bg-muted/30 transition-colors",
                                    pick ? "border-border" : "border-border border-dashed",
                                    isActive && !pick && "border-primary/50 bg-primary/5" // Highlight active empty slot? Complex logic needed to know EXACT slot
                                )}>
                                    {pick ? (
                                        <>
                                            {icon && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={icon} alt={pick.hero_name} className="w-16 h-16 object-cover opacity-60 absolute left-0 top-0" />
                                            )}
                                            <div className={cn(
                                                "absolute inset-0 flex items-center px-4 font-bold text-lg drop-shadow-md z-10",
                                                isRightSide ? "justify-end" : "justify-start"
                                            )}>
                                                {pick.hero_name}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-muted-foreground text-xs">Pick {i + 1}</div>
                                    )}
                                </div>
                                
                                {/* Player Assignment Sub-row */}
                                <div className={cn("flex items-center justify-between text-xs px-1", isRightSide && "flex-row-reverse")}>
                                   {playerDetails ? (
                                       <div className={cn("flex items-center gap-2", isRightSide && "flex-row-reverse")}>
                                           <Badge variant="outline" className={cn("text-[10px] h-5 px-1 py-0", roleColors[assignedPlayer.player_role])}>
                                               {assignedPlayer.player_role.toUpperCase()}
                                           </Badge>
                                           <span className="text-muted-foreground font-medium truncate max-w-[100px]">{playerDetails.ign}</span>
                                           
                                           {isAdmin && (
                                                <button 
                                                    onClick={() => onAssignPlayer(assignedPlayer.player_id, assignedPlayer.player_role, i)} // Re-open selection? Using simple dropdown below might be better
                                                    className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1"
                                                >
                                                    Edit
                                                </button>
                                           )}
                                       </div>
                                   ) : (
                                       <div className="text-muted-foreground italic text-[10px]">No Player Assigned</div>
                                   )}
                                   
                                   {/* Edit Control (Only if admin and no player or editing) */}
                                   {!playerDetails && isAdmin && (
                                       <PlayerAssignmentDialog 
                                            players={players} 
                                            slotIndex={i} 
                                            onAssign={(pid, role) => onAssignPlayer(pid, role, i)} 
                                       />
                                   )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bans */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bans</h3>
                <div className={cn("flex flex-wrap gap-2", isRightSide ? "justify-end" : "justify-start")}>
                     {banSlots.map((_, i) => {
                         const ban = bans[i];
                         const icon = ban ? getHeroIcon(ban.hero_name) : null;

                         return (
                             <div key={i} className={cn(
                                 "w-10 h-10 relative rounded border flex items-center justify-center bg-muted/50 overflow-hidden",
                                 ban ? "border-destructive/50" : "border-border border-dashed"
                             )}>
                                 {ban ? (
                                     <>
                                        {icon && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={icon} alt={ban.hero_name} className="w-full h-full object-cover grayscale opacity-50 absolute inset-0" />
                                        )}
                                        <Ban className="w-6 h-6 text-destructive z-10" />
                                     </>
                                 ) : (
                                     <span className="text-[10px] text-muted-foreground">{i + 1}</span>
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
                "bg-card hover:bg-accent",
                isTaken ? "opacity-40 grayscale border-border" : "hover:scale-105 hover:ring-2 hover:ring-primary border-border",
                roleColors[character.role] && !isTaken && "border-opacity-50"
            )}
        >
            {character.icon_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={character.icon_url} alt={character.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {character.name.substring(0, 2)}
                </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 bg-background/80 p-1 backdrop-blur-sm">
                <p className="text-[10px] text-foreground truncate text-center font-medium">{character.name}</p>
            </div>

            {isTaken && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
            )}
        </button>
    );
}

function PlayerAssignmentDialog({ 
    players, 
    slotIndex, 
    onAssign 
}: { 
    players: { id: string, ign: string, role: string | null }[], 
    slotIndex: number, 
    onAssign: (pid: string, role: string) => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Auto-select standard role based on slot index if available?
    // EXP -> GOLD -> MID -> JUNGLE -> ROAM (standard)
    const standardRoles = ['Fighter', 'Marksman', 'Mage', 'Assassin', 'Tank']; // Mapping closely to standard MPL roles
    const displayRoles = ['EXP', 'GOLD', 'MID', 'JUNGLE', 'ROAM'];
    
    return (
        <div className="relative">
             <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => setIsOpen(!isOpen)}>
                Assign Player
             </Button>
             
             {isOpen && (
                 <div className="absolute top-6 left-0 z-50 w-48 bg-popover border border-border rounded-md shadow-md p-2 space-y-2">
                     <p className="text-[10px] font-bold text-muted-foreground">Select Player for Pick {slotIndex + 1}</p>
                     <ScrollArea className="h-32">
                        {players.map(p => (
                            <button
                                key={p.id}
                                className="w-full text-left text-xs p-1 hover:bg-muted rounded flex items-center justify-between"
                                onClick={() => {
                                    // Default role assignment logic or ask for role?
                                    // For now, let's just pick 'EXP' as placeholder or use their preferred role
                                    const role = p.role || 'EXP'; // Fallback
                                    onAssign(p.id, role);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{p.ign}</span>
                                <span className="text-[10px] text-muted-foreground">{p.role?.substring(0,3)}</span>
                            </button>
                        ))}
                     </ScrollArea>
                     <Button size="sm" variant="secondary" className="w-full h-6 text-[10px]" onClick={() => setIsOpen(false)}>Cancel</Button>
                 </div>
             )}
        </div>
    )
}

function DraftPanelSkeleton() {
  return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
}

