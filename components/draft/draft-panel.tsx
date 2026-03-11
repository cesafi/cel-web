'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { LazyImage } from '@/components/draft/lazy-image';
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
    RotateCcw,
    Timer,
    Check,
    Lock,
    Undo2,
    Wand2,
    ChevronDown,
    X,
    CheckCheck,
    Play,
    Pause,
    ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

// Types
import { GameCharacter } from '@/lib/types/game-characters';
import {
    GameDraftAction,
    calculateDraftState,
    MLBB_DRAFT_SEQUENCE
} from '@/lib/types/game-draft';

import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { autoFillRosterFromGame1 } from '@/actions/game-roster';
import { updateGameDraftAction } from '@/actions/game-draft';
import { updateGameById } from '@/actions/games';
import { GameRosterService } from '@/services/game-roster';
import { useGameDraftActions, useSubmitGameDraftAction, useResetGameDraft, useUndoLastGameDraftAction, useUpdateGameDraftAction } from '@/hooks/use-game-draft';
import { useRealtimeDraft } from '@/hooks/use-realtime-draft';
import { matchKeys } from '@/hooks/use-matches';

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
    isValorant?: boolean;
    gameNumber?: number;
    coinTossWinnerId?: string;
    coinTossResult?: string;
    sideSelection?: string;
    gameStatus?: string;
}

// Role colors for visual distinction
const roleColors: Record<string, string> = {
    // MLBB
    'Tank': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Fighter': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'Assassin': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Mage': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Marksman': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'Support': 'bg-green-500/10 text-green-500 border-green-500/20',
    // VALO
    'Duelist': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Controller': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Initiator': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Sentinel': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const roleTextColors: Record<string, string> = {
    'Tank': 'text-blue-500',
    'Fighter': 'text-orange-500',
    'Assassin': 'text-red-500',
    'Mage': 'text-purple-500',
    'Marksman': 'text-yellow-500',
    'Support': 'text-green-500',
    'Duelist': 'text-red-500',
    'Controller': 'text-green-500',
    'Initiator': 'text-blue-500',
    'Sentinel': 'text-yellow-500',
};

const MLBB_SLOT_ROLES = ['Fighter', 'Assassin', 'Mage', 'Marksman', 'Tank'];
const MLBB_SLOT_LABELS = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];

export function DraftPanel({
    gameId,
    matchId,
    esportId,
    team1,
    team2,
    team1Players,
    team2Players,
    isAdmin = false,
    isValorant = false,
    gameNumber = 1,
    coinTossWinnerId,
    coinTossResult,
    sideSelection,
    gameStatus,
}: DraftPanelProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [timer, setTimer] = useState(30);
    const [isTimerPaused, setIsTimerPaused] = useState(false);

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
    const { data: actions = [], isLoading: isLoadingActions, refetch: refetchActions } = useGameDraftActions(gameId);

    // 3. Fetch Game Rosters
    const { data: rosters = [], refetch: refetchRosters } = useQuery({
        queryKey: ['game-rosters', gameId],
        queryFn: async () => {
            const result = await GameRosterService.getByGameId(gameId);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        enabled: !!gameId
    });

    // 4. Realtime
    useRealtimeDraft(gameId, () => {
        refetchActions();
        refetchRosters();
        setTimer(30);
    });

    // 5. Derive State (MLBB only)
    const { blueSideTeamId, redSideTeamId } = useMemo(() => {
        let blue = team1.id;
        let red = team2.id;

        if (sideSelection === 'blue' && coinTossWinnerId) {
            blue = coinTossWinnerId;
            red = coinTossWinnerId === team1.id ? team2.id : team1.id;
        } else if (sideSelection === 'red' && coinTossWinnerId) {
            red = coinTossWinnerId;
            blue = coinTossWinnerId === team1.id ? team2.id : team1.id;
        } else if (coinTossWinnerId) {
            // Default: Coin toss winner gets blue side if no explicit side chosen
            blue = coinTossWinnerId;
            red = coinTossWinnerId === team1.id ? team2.id : team1.id;
        }

        return { blueSideTeamId: blue, redSideTeamId: red };
    }, [team1.id, team2.id, coinTossWinnerId, sideSelection]);

    const draftState = useMemo(() =>
        calculateDraftState(gameId, matchId, blueSideTeamId, redSideTeamId, actions),
        [gameId, matchId, blueSideTeamId, redSideTeamId, actions]
    );

    const team1Roster = useMemo(() => rosters.filter(r => r.team_id === team1.id), [rosters, team1.id]);
    const team2Roster = useMemo(() => rosters.filter(r => r.team_id === team2.id), [rosters, team2.id]);

    // Mutations
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
            // Set game status to 'drafting' on first player assignment
            if (actions.length === 0 && rosters.length === 0) {
                updateGameById({ id: gameId, status: 'drafting' }).then(() => {
                    queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
                });
            }
            refetchRosters();
            toast.success("Player assigned");
        },
        onError: () => toast.error("Failed to assign player")
    });

    const unassignPlayerMutation = useMutation({
        mutationFn: async (data: { teamId: string, sortOrder: number }) => {
            const result = await GameRosterService.deleteBySlot(gameId, data.teamId, data.sortOrder);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            refetchRosters();
            toast.success("Player removed");
        },
        onError: () => toast.error("Failed to remove player")
    });

    const autoFillGame1Mutation = useMutation({
        mutationFn: async () => {
            const result = await autoFillRosterFromGame1(gameId, matchId);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            refetchRosters();
            toast.success("Roster copied from Game 1");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to copy Game 1 roster")
    });

    const swapPlayersMutation = useMutation({
        mutationFn: async (data: { teamId: string, sortOrderA: number, sortOrderB: number }) => {
            const result = await GameRosterService.swapSlots(gameId, data.teamId, data.sortOrderA, data.sortOrderB);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            refetchRosters();
            toast.success("Players swapped");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to swap players")
    });

    const submitActionMutation = useSubmitGameDraftAction({
        onSuccess: () => {
            // Set game status to 'drafting' on first action
            if (actions.length === 0) {
                updateGameById({ id: gameId, status: 'drafting' }).then(() => {
                    queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
                });
            }
            refetchActions();
            toast.success('Action recorded');
        }
    });

    const resetDraftMutation = useResetGameDraft({
        onSuccess: () => refetchActions()
    });

    const undoActionMutation = useUndoLastGameDraftAction({
        onSuccess: () => refetchActions()
    });

    const updateActionMutation = useUpdateGameDraftAction({
        onSuccess: () => refetchActions()
    });

    const tradeActionMutation = useMutation({
        mutationFn: async (data: { action1: any; action2: any }) => {
            // Sequential updates to avoid complex backend changes for this simple swap
            const res1 = await updateGameDraftAction(data.action1.id, {
                hero_id: data.action2.hero_id,
                hero_name: data.action2.hero_name
            });
            if (!res1.success) throw new Error(res1.error);

            const res2 = await updateGameDraftAction(data.action2.id, {
                hero_id: data.action1.hero_id,
                hero_name: data.action1.hero_name
            });
            if (!res2.success) throw new Error(res2.error);
            return true;
        },
        onSuccess: () => {
            refetchActions();
            toast.success("Heroes traded successfully");
        },
        onError: () => toast.error("Failed to trade heroes")
    });

    // MLBB handler
    const handleCharacterSelect = (character: GameCharacter) => {
        if (!draftState.nextAction || !isAdmin) return;
        if (actions.some(a => a.hero_name === character.name)) {
            toast.error('Hero already selected or banned');
            return;
        }
        submitActionMutation.mutate({
            game_id: gameId,
            team_id: draftState.nextAction.team === 'team1' ? blueSideTeamId : redSideTeamId,
            hero_name: character.name,
            hero_id: character.id,
            action_type: draftState.nextAction.action,
            sort_order: draftState.currentStepIndex + 1,
            is_locked: true
        });
    };

    // VALO free-pick handler
    const handleValorantPick = async (teamId: string, character: GameCharacter, slotIndex: number) => {
        if (!isAdmin) return;
        // Use the actual slot index so the agent lands in the correct slot
        const sortOrder = slotIndex + 1;

        submitActionMutation.mutate({
            game_id: gameId,
            team_id: teamId,
            hero_name: character.name,
            hero_id: character.id,
            action_type: 'pick',
            sort_order: (teamId === team1.id ? 0 : 100) + sortOrder,
            is_locked: true
        });

        // Also update the roster with the new agent's role if a player is already assigned
        const teamRoster = teamId === team1.id ? team1Roster : team2Roster;
        const existingEntry = teamRoster.find(r => r.sort_order === slotIndex);
        if (existingEntry && character.role) {
            assignPlayerMutation.mutate({
                teamId: existingEntry.team_id,
                playerId: existingEntry.player_id,
                role: character.role,
                sortOrder: existingEntry.sort_order
            });
        }
    };

    const handleCharacterSwap = (actionId: string, newCharacter: GameCharacter) => {
        if (!isAdmin) return;
        updateActionMutation.mutate({
            actionId,
            gameId,
            data: {
                hero_name: newCharacter.name,
                hero_id: newCharacter.id
            }
        });

        if (isValorant && newCharacter.role) {
            const action = actions.find(a => a.id === actionId);
            if (action) {
                // Determine slot index
                const slotIndex = (action.sort_order % 100) - 1;
                const teamRoster = action.team_id === team1.id ? team1Roster : team2Roster;
                const existingEntry = teamRoster.find(r => r.sort_order === slotIndex);
                if (existingEntry) {
                    assignPlayerMutation.mutate({
                        teamId: existingEntry.team_id,
                        playerId: existingEntry.player_id,
                        role: newCharacter.role,
                        sortOrder: existingEntry.sort_order
                    });
                }
            }
        }
    };

    const handleCharacterTrade = async (action1Id: string, action2Id: string) => {
        if (!isAdmin) return;
        const action1 = actions.find(a => a.id === action1Id);
        const action2 = actions.find(a => a.id === action2Id);
        if (!action1 || !action2) return;
        
        tradeActionMutation.mutate({ action1, action2 });

        if (isValorant) {
            // Also swap their roles in the roster
            try {
                const char1Role = characters.find(c => c.id === action1.hero_id)?.role;
                const char2Role = characters.find(c => c.id === action2.hero_id)?.role;
                
                const slot1 = (action1.sort_order % 100) - 1;
                const slot2 = (action2.sort_order % 100) - 1;
                
                const roster1 = action1.team_id === team1.id ? team1Roster : team2Roster;
                const roster2 = action2.team_id === team1.id ? team1Roster : team2Roster;
                
                const entry1 = roster1.find(r => r.sort_order === slot1);
                const entry2 = roster2.find(r => r.sort_order === slot2);

                if (entry1 && char2Role) {
                    assignPlayerMutation.mutate({
                        teamId: entry1.team_id,
                        playerId: entry1.player_id,
                        role: char2Role,
                        sortOrder: entry1.sort_order
                    });
                }
                if (entry2 && char1Role) {
                    assignPlayerMutation.mutate({
                        teamId: entry2.team_id,
                        playerId: entry2.player_id,
                        role: char1Role,
                        sortOrder: entry2.sort_order
                    });
                }
            } catch (error) {
                console.error("Failed to update roles after trade", error);
            }
        }
    };

    // Smart Auto-Fill
    const handleAutoFill = async (teamId: string, players: { id: string; ign: string; role: string | null }[]) => {
        if (!isAdmin || !players.length) return;

        const existingRoster = rosters.filter(r => r.team_id === teamId);
        const filledSlots = new Set(existingRoster.map(r => r.sort_order));
        const assignedPlayerIds = new Set(existingRoster.map(r => r.player_id));

        let filled = 0;
        const slotRoles = isValorant ? ['Duelist', 'Duelist', 'Controller', 'Initiator', 'Sentinel'] : MLBB_SLOT_ROLES;

        for (let i = 0; i < 5; i++) {
            if (filledSlots.has(i)) continue; // Skip already filled

            const targetRole = slotRoles[i];
            // Find a player with matching role that isn't already assigned
            const matchingPlayer = players.find(p =>
                !assignedPlayerIds.has(p.id) &&
                p.role?.toLowerCase() === targetRole.toLowerCase()
            );

            if (matchingPlayer) {
                try {
                    await GameRosterService.upsert({
                        game_id: gameId,
                        team_id: teamId,
                        player_id: matchingPlayer.id,
                        player_role: isValorant ? targetRole : (MLBB_SLOT_LABELS[i] || targetRole),
                        sort_order: i
                    });
                    assignedPlayerIds.add(matchingPlayer.id);
                    filled++;
                } catch {
                    // Continue filling other slots
                }
            }
        }

        // Fill remaining with any unassigned players
        const remainingPlayers = players.filter(p => !assignedPlayerIds.has(p.id));
        let remainingIdx = 0;
        for (let i = 0; i < 5; i++) {
            if (filledSlots.has(i) || assignedPlayerIds.has('slot_' + i)) continue;
            // Check if we already filled this slot above
            const alreadyFilled = rosters.some(r => r.team_id === teamId && r.sort_order === i) || filled > 0;
            if (alreadyFilled) continue;

            if (remainingIdx < remainingPlayers.length) {
                const player = remainingPlayers[remainingIdx++];
                try {
                    await GameRosterService.upsert({
                        game_id: gameId,
                        team_id: teamId,
                        player_id: player.id,
                        player_role: isValorant ? 'Flex' : (MLBB_SLOT_LABELS[i] || 'Flex'),
                        sort_order: i
                    });
                    filled++;
                } catch {
                    // Continue
                }
            }
        }

        refetchRosters();
        toast.success(`Auto-filled ${filled} player slot${filled !== 1 ? 's' : ''}`);
    };

    // Timer (MLBB only)
    useEffect(() => {
        if (isValorant || draftState.isComplete || timer <= 0 || isTimerPaused) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, draftState.isComplete, isValorant, isTimerPaused]);

    // Auto-transition game status to 'in_progress' when draft completes
    // Only fire if the game is currently in 'drafting' status to avoid
    // resetting completed/in_progress games when revisiting the page
    const hasSyncedComplete = useRef(false);
    useEffect(() => {
        if (draftState.isComplete && !hasSyncedComplete.current && actions.length > 0 && gameStatus === 'drafting') {
            hasSyncedComplete.current = true;
            updateGameById({ id: gameId, status: 'in_progress' }).then(() => {
                queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
            });
        }
    }, [draftState.isComplete, actions.length, gameId, matchId, queryClient, gameStatus]);

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

    // Already-taken character names (Global for MLBB)
    const takenCharacters = useMemo(() => new Set(actions.map(a => a.hero_name)), [actions]);

    // Team-specific taken characters (For Valorant)
    const team1TakenCharacters = useMemo(() => new Set(actions.filter(a => a.team_id === team1.id).map(a => a.hero_name)), [actions, team1.id]);
    const team2TakenCharacters = useMemo(() => new Set(actions.filter(a => a.team_id === team2.id).map(a => a.hero_name)), [actions, team2.id]);

    if (isLoadingCharacters || isLoadingActions) {
        return <DraftPanelSkeleton />;
    }

    // ── VALORANT Free-Pick Mode ──
    if (isValorant) {
        return (
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm px-4 py-1.5 border-primary/30 text-primary">
                        Agent Select — Free Pick
                    </Badge>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => undoActionMutation.mutate(gameId)}
                                disabled={undoActionMutation.isPending || actions.length === 0}
                            >
                                <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                                Undo
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => resetDraftMutation.mutate(gameId)}
                                disabled={resetDraftMutation.isPending}
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Reset
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ValorantTeamPanel
                        team={team1}
                        teamId={team1.id}
                        picks={actions.filter(a => a.team_id === team1.id && a.action_type === 'pick')}
                        roster={team1Roster}
                        players={team1Players || []}
                        characters={characters}
                        takenCharacters={team1TakenCharacters}
                        isAdmin={isAdmin}
                        onPickAgent={(char, slot) => handleValorantPick(team1.id, char, slot)}
                        onSwapAgent={(actionId, char) => handleCharacterSwap(actionId, char)}
                        onTradeAgent={(action1Id, action2Id) => handleCharacterTrade(action1Id, action2Id)}
                        onAssignPlayer={(pid, role, idx) => {
                            const pIndex = team1Roster.length > 0 ? (actions.find(a => a.action_type === 'pick' && a.team_id === team1.id && a.sort_order === idx + 1) ? idx + 1 : idx + 1) : idx + 1;
                            const pick = actions.find(a => a.team_id === team1.id && a.action_type === 'pick' && a.sort_order === pIndex);
                            const agentRole = pick ? characters.find(c => c.name === pick.hero_name)?.role : null;
                            assignPlayerMutation.mutate({ teamId: team1.id, playerId: pid, role: agentRole || 'Flex', sortOrder: idx });
                        }}
                        onUnassignPlayer={(idx) => unassignPlayerMutation.mutate({ teamId: team1.id, sortOrder: idx })}
                        onAutoFill={() => handleAutoFill(team1.id, team1Players || [])}
                        onAutoFillGame1={gameNumber > 1 ? () => autoFillGame1Mutation.mutate() : undefined}
                    />
                    <ValorantTeamPanel
                        team={team2}
                        teamId={team2.id}
                        picks={actions.filter(a => a.team_id === team2.id && a.action_type === 'pick')}
                        roster={team2Roster}
                        players={team2Players || []}
                        characters={characters}
                        takenCharacters={team2TakenCharacters}
                        isAdmin={isAdmin}
                        onPickAgent={(char, slot) => handleValorantPick(team2.id, char, slot)}
                        onSwapAgent={(actionId, char) => handleCharacterSwap(actionId, char)}
                        onTradeAgent={(action1Id, action2Id) => handleCharacterTrade(action1Id, action2Id)}
                        onAssignPlayer={(pid, role, idx) => {
                            const pIndex = team2Roster.length > 0 ? (actions.find(a => a.action_type === 'pick' && a.team_id === team2.id && a.sort_order === idx + 101) ? idx + 101 : idx + 101) : idx + 101;
                            const pick = actions.find(a => a.team_id === team2.id && a.action_type === 'pick' && a.sort_order === pIndex);
                            const agentRole = pick ? characters.find(c => c.name === pick.hero_name)?.role : null;
                            assignPlayerMutation.mutate({ teamId: team2.id, playerId: pid, role: agentRole || 'Flex', sortOrder: idx });
                        }}
                        onUnassignPlayer={(idx) => unassignPlayerMutation.mutate({ teamId: team2.id, sortOrder: idx })}
                        onAutoFill={() => handleAutoFill(team2.id, team2Players || [])}
                        onAutoFillGame1={gameNumber > 1 ? () => autoFillGame1Mutation.mutate() : undefined}
                    />
                </div>
            </div>
        );
    }

    // ── MLBB Sequential Draft Mode ──
    const currentAction = draftState.nextAction;

    // In MLBB_DRAFT_SEQUENCE, 'team1' always goes first (Blue Side). 
    // We map 'team1' -> blueSideTeamId and 'team2' -> redSideTeamId.
    const activeTeamId = currentAction?.team === 'team1' ? blueSideTeamId : redSideTeamId;
    const activeTeam = activeTeamId === team1.id ? team1 : team2;
    const isBanPhase = currentAction?.action === 'ban';

    const leftTeam = blueSideTeamId === team1.id ? team1 : team2;
    const rightTeam = blueSideTeamId === team1.id ? team2 : team1;
    const leftTeamPlayers = blueSideTeamId === team1.id ? team1Players : team2Players;
    const rightTeamPlayers = blueSideTeamId === team1.id ? team2Players : team1Players;
    const leftTeamRoster = blueSideTeamId === team1.id ? team1Roster : team2Roster;
    const rightTeamRoster = blueSideTeamId === team1.id ? team2Roster : team1Roster;

    return (
        <div className="space-y-6 pb-10">
            {/* Draft Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-4">
                    {!draftState.isComplete ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-sm px-4 py-1.5 border-2',
                                activeTeamId === blueSideTeamId
                                    ? 'border-blue-500/50 text-blue-500 bg-blue-500/10'
                                    : 'border-red-500/50 text-red-500 bg-red-500/10'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {isBanPhase ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                {isBanPhase ? 'BAN' : 'PICK'} — {activeTeam?.abbreviation}
                            </span>
                        </Badge>
                    ) : (
                        <div className="flex items-center gap-2 ">
                            <CheckCheck className="w-4 h-4 text-green-500" />
                            <span className="text-sm py-1.5 bg-transparent text-green-400">Draft Complete</span>
                        </div>
                    )}

                    {!draftState.isComplete && (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-amber-500 flex items-center gap-1.5">
                                <Timer className="w-4 h-4" />
                                {timer}s
                            </span>
                            {isAdmin && (
                                <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsTimerPaused(!isTimerPaused)}
                                    >
                                        {isTimerPaused ? <Play className="w-3.5 h-3.5 text-green-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={() => setTimer(30)}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => undoActionMutation.mutate(gameId)}
                            disabled={undoActionMutation.isPending || actions.length === 0}
                        >
                            <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                            Undo
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => resetDraftMutation.mutate(gameId)}
                            disabled={resetDraftMutation.isPending}
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Reset
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Draft Area */}
            <div className="grid grid-cols-12 gap-4">
                {/* Team 1 (Left Side Visuals / Blue Side) */}
                <div className="col-span-12 md:col-span-3">
                    <MlbbTeamColumn
                        team={leftTeam}
                        bans={draftState.team1Bans}
                        picks={draftState.team1Picks}
                        roster={leftTeamRoster}
                        players={leftTeamPlayers || []}
                        characters={characters}
                        takenCharacters={takenCharacters}
                        isActive={activeTeamId === leftTeam.id}
                        activeAction={activeTeamId === leftTeam.id ? currentAction?.action : null}
                        themeColor="blue"
                        isAdmin={isAdmin}
                        onSwapCharacter={(actionId, char) => handleCharacterSwap(actionId, char)}
                        onTradeCharacter={(action1Id, action2Id) => handleCharacterTrade(action1Id, action2Id)}
                        onAssignPlayer={(pid, role, idx) => assignPlayerMutation.mutate({ teamId: leftTeam.id, playerId: pid, role: MLBB_SLOT_LABELS[idx] || role, sortOrder: idx })}
                        onUnassignPlayer={(idx) => unassignPlayerMutation.mutate({ teamId: leftTeam.id, sortOrder: idx })}
                        onAutoFill={() => handleAutoFill(leftTeam.id, leftTeamPlayers || [])}
                        onAutoFillGame1={gameNumber > 1 ? () => autoFillGame1Mutation.mutate() : undefined}
                        onSwapPlayers={(a, b) => swapPlayersMutation.mutate({ teamId: leftTeam.id, sortOrderA: a, sortOrderB: b })}
                    />
                </div>

                {/* Hero Pool */}
                <div className="col-span-12 md:col-span-6">
                    <div className="rounded-xl border bg-card h-full">
                        <div className="p-4 border-b space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search heroes..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
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
                        </div>
                        <ScrollArea className="h-[500px] p-4">
                            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                                {filteredCharacters.map(char => {
                                    const isTaken = takenCharacters.has(char.name);
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
                    </div>
                </div>

                {/* Team 2 (Right Side Visuals / Red Side) */}
                <div className="col-span-12 md:col-span-3">
                    <MlbbTeamColumn
                        team={rightTeam}
                        bans={draftState.team2Bans}
                        picks={draftState.team2Picks}
                        roster={rightTeamRoster}
                        players={rightTeamPlayers || []}
                        characters={characters}
                        takenCharacters={takenCharacters}
                        isActive={activeTeamId === rightTeam.id}
                        activeAction={activeTeamId === rightTeam.id ? currentAction?.action : null}
                        themeColor="red"
                        isRightSide
                        isAdmin={isAdmin}
                        onSwapCharacter={(actionId, char) => handleCharacterSwap(actionId, char)}
                        onTradeCharacter={(action1Id, action2Id) => handleCharacterTrade(action1Id, action2Id)}
                        onAssignPlayer={(pid, role, idx) => assignPlayerMutation.mutate({ teamId: rightTeam.id, playerId: pid, role: MLBB_SLOT_LABELS[idx] || role, sortOrder: idx })}
                        onUnassignPlayer={(idx) => unassignPlayerMutation.mutate({ teamId: rightTeam.id, sortOrder: idx })}
                        onAutoFill={() => handleAutoFill(rightTeam.id, rightTeamPlayers || [])}
                        onAutoFillGame1={gameNumber > 1 ? () => autoFillGame1Mutation.mutate() : undefined}
                        onSwapPlayers={(a, b) => swapPlayersMutation.mutate({ teamId: rightTeam.id, sortOrderA: a, sortOrderB: b })}
                    />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════
// VALORANT Team Panel (Free-Pick)
// ══════════════════════════════════

function ValorantTeamPanel({
    team, teamId, picks, roster, players, characters, takenCharacters, isAdmin,
    onPickAgent, onSwapAgent, onTradeAgent, onAssignPlayer, onUnassignPlayer, onAutoFill, onAutoFillGame1
}: {
    team: DraftPanelProps['team1'];
    teamId: string;
    picks: GameDraftAction[];
    roster: any[];
    players: { id: string; ign: string; role: string | null }[];
    characters: GameCharacter[];
    takenCharacters: Set<string>;
    isAdmin: boolean;
    onPickAgent: (char: GameCharacter, slotIndex: number) => void;
    onSwapAgent: (actionId: string, char: GameCharacter) => void;
    onTradeAgent?: (action1Id: string, action2Id: string) => void;
    onAssignPlayer: (playerId: string, role: string, sortOrder: number) => void;
    onUnassignPlayer: (sortOrder: number) => void;
    onAutoFill: () => void;
    onAutoFillGame1?: () => void;
}) {
    const [tradeTargetId, setTradeTargetId] = useState<string | null>(null);
    const slots = Array.from({ length: 5 });

    const getHeroIcon = (name: string) => characters.find(c => c.name === name)?.icon_url;

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Team Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background border overflow-hidden flex items-center justify-center shrink-0">
                        {team.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team.logoUrl} alt={team.abbreviation} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-muted-foreground">{team.abbreviation.substring(0, 2)}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold">{team.abbreviation}</h3>
                        <p className="text-xs text-muted-foreground">{team.name}</p>
                    </div>
                </div>
                {isAdmin && players.length > 0 && (
                    <div className="flex gap-1.5 flex-col items-end">
                        <Button variant="outline" size="sm" onClick={onAutoFill} className="text-[10px] h-7 px-2">
                            <Wand2 className="w-3 h-3 mr-1" />
                            Smart Fill
                        </Button>
                        {onAutoFillGame1 && (
                            <Button variant="outline" size="sm" onClick={onAutoFillGame1} className="text-[10px] h-7 px-2 text-primary border-primary/30">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Copy Game 1
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Agent Slots */}
            <div className="p-4 space-y-2">
                {slots.map((_, i) => {
                    const teamOffset = picks.length > 0 && picks[0]?.sort_order > 50 ? 100 : 0;
                    const pick = picks.find(p => p.sort_order === teamOffset + i + 1);
                    const icon = pick ? getHeroIcon(pick.hero_name) : null;
                    const rosterEntry = roster.find(r => r.sort_order === i);
                    const playerDetails = rosterEntry ? players.find(p => p.id === rosterEntry.player_id) : null;
                    const heroRole = pick ? characters.find(c => c.name === pick.hero_name)?.role : null;

                    return (
                        <div key={i} className="flex items-center gap-2">
                            {/* Agent pick */}
                            <div className="flex-1">
                                {pick ? (
                                    <div className={cn(
                                        "flex items-center gap-3 p-2.5 rounded-lg border group/pick relative",
                                        heroRole ? roleColors[heroRole]?.replace('/10', '/5') : 'bg-muted/30'
                                    )}>
                                        <LazyImage src={icon} alt={pick.hero_name} className="w-10 h-10 rounded-md" />
                                        <div className="min-w-0 flex-1 relative z-0">
                                            <p className="font-semibold text-sm truncate">{pick.hero_name}</p>
                                            {heroRole && (
                                                <Badge variant="outline" className={cn("text-[10px] h-4 px-1", roleColors[heroRole])}>
                                                    {heroRole}
                                                </Badge>
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <div className={cn(
                                                "absolute inset-x-0 bottom-0 top-0 flex items-center justify-center gap-1 px-2 bg-background/80 backdrop-blur-sm z-10 transition-all duration-200",
                                                tradeTargetId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover/pick:opacity-100 group-hover/pick:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto"
                                            )}>
                                                {tradeTargetId && tradeTargetId !== pick.id ? (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="h-7 text-xs px-2 shadow-sm rounded-md"
                                                        onClick={() => {
                                                            onTradeAgent?.(tradeTargetId, pick.id);
                                                            setTradeTargetId(null);
                                                        }}
                                                    >
                                                        Swap Here
                                                    </Button>
                                                ) : (
                                                    <CharacterPickerPopover
                                                        slotIndex={i}
                                                        characters={characters}
                                                        takenCharacters={takenCharacters}
                                                        isAdmin={isAdmin}
                                                        onPick={(char) => onSwapAgent(pick.id, char)}
                                                        isSwapMode={true}
                                                    />
                                                )}

                                                {/* Only show Swap/Cancel on the initiating pick or when no trade is active */}
                                                {(!tradeTargetId || tradeTargetId === pick.id) && (
                                                    <Button
                                                        variant={tradeTargetId === pick.id ? "secondary" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-xs px-2 shadow-sm rounded-md",
                                                            tradeTargetId === pick.id
                                                                ? ""
                                                                : "border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                                        )}
                                                        onClick={() => setTradeTargetId(tradeTargetId === pick.id ? null : pick.id)}
                                                    >
                                                        {tradeTargetId === pick.id ? "Cancel" : "Swap"}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <CharacterPickerPopover
                                        slotIndex={i}
                                        characters={characters}
                                        takenCharacters={takenCharacters}
                                        isAdmin={isAdmin}
                                        onPick={(char) => onPickAgent(char, i)}
                                    />
                                )}
                            </div>

                            {/* Player assignment */}
                            <div className="w-32 shrink-0">
                                {playerDetails ? (
                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-muted/50 group relative">
                                        <span className="font-medium truncate flex-1">{playerDetails.ign}</span>
                                        {rosterEntry?.player_role && (
                                            <Badge variant="outline" className={cn("text-[9px] h-3.5 px-1 shrink-0", roleColors[rosterEntry.player_role])}>
                                                {rosterEntry.player_role.substring(0, 3)}
                                            </Badge>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => onUnassignPlayer(i)}
                                                className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-sm hover:scale-110"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    isAdmin && (
                                        <PlayerPickerPopover
                                            players={players}
                                            slotIndex={i}
                                            roster={roster}
                                            onAssign={onAssignPlayer}
                                            slotRole={heroRole || undefined}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ══════════════════════════════════
// Character Picker Popover
// ══════════════════════════════════

function CharacterPickerPopover({
    slotIndex, characters, takenCharacters, isAdmin, onPick, isSwapMode = false
}: {
    slotIndex: number;
    characters: GameCharacter[];
    takenCharacters: Set<string>;
    isAdmin: boolean;
    onPick: (char: GameCharacter) => void;
    isSwapMode?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = characters.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) && !takenCharacters.has(c.name)
    );

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center p-3 rounded-lg border border-dashed text-xs text-muted-foreground">
                Slot {slotIndex + 1} — Waiting
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {isSwapMode ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 shadow-sm rounded-md border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                        Change
                    </Button>
                ) : (
                    <button className="w-full flex items-center justify-between p-2.5 rounded-lg border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground">
                        <span>Select Character {slotIndex + 1}</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search agents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <ScrollArea className="h-64">
                    <div className="grid grid-cols-4 gap-1 p-2">
                        {filtered.map(char => (
                            <button
                                key={char.id}
                                onClick={() => { onPick(char); setOpen(false); setSearch(''); }}
                                className="aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all relative group"
                            >
                                <LazyImage src={char.icon_url} alt={char.name} className="w-full h-full" />
                                <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm px-0.5 py-0.5">
                                    <p className="text-[8px] text-center truncate font-medium">{char.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

// ══════════════════════════════════
// Player Picker Popover
// ══════════════════════════════════

function PlayerPickerPopover({
    players, slotIndex, roster, onAssign, slotRole
}: {
    players: { id: string; ign: string; role: string | null }[];
    slotIndex: number;
    roster: any[];
    onAssign: (playerId: string, role: string, sortOrder: number) => void;
    slotRole?: string;
}) {
    const [open, setOpen] = useState(false);
    const assignedIds = new Set(roster.map((r: any) => r.player_id));
    const available = players.filter(p => !assignedIds.has(p.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="w-full text-[11px] text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md border border-dashed hover:border-primary/30 transition-colors">
                    Assign Player
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
                <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1">Select Player</p>
                <ScrollArea className="h-40">
                    {available.length > 0 ? available.map(p => (
                        <button
                            key={p.id}
                            className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded-md flex items-center justify-between"
                            onClick={() => {
                                onAssign(p.id, slotRole || p.role || 'Flex', slotIndex);
                                setOpen(false);
                            }}
                        >
                            <span className="font-medium">{p.ign}</span>
                            {p.role && (
                                <Badge variant="outline" className={cn("text-[9px] h-3.5 px-1", roleColors[p.role])}>
                                    {p.role.substring(0, 3)}
                                </Badge>
                            )}
                        </button>
                    )) : (
                        <p className="text-[10px] text-muted-foreground px-2 py-2">No players available</p>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

// ══════════════════════════════════
// MLBB Team Column (Sequential Draft)  
// ══════════════════════════════════

function MlbbTeamColumn({
    team, bans, picks, roster, players, characters, takenCharacters, isActive, activeAction, themeColor, isRightSide = false, isAdmin,
    onSwapCharacter, onTradeCharacter, onAssignPlayer, onUnassignPlayer, onAutoFill, onAutoFillGame1, onSwapPlayers
}: {
    team: DraftPanelProps['team1'];
    bans: GameDraftAction[];
    picks: GameDraftAction[];
    roster: any[];
    players: { id: string; ign: string; role: string | null }[];
    characters: GameCharacter[];
    takenCharacters: Set<string>;
    isActive: boolean;
    activeAction?: 'pick' | 'ban' | null;
    themeColor: 'blue' | 'red';
    isRightSide?: boolean;
    isAdmin: boolean;
    onSwapCharacter: (actionId: string, char: GameCharacter) => void;
    onTradeCharacter?: (action1Id: string, action2Id: string) => void;
    onAssignPlayer: (playerId: string, role: string, sortOrder: number) => void;
    onUnassignPlayer: (sortOrder: number) => void;
    onAutoFill: () => void;
    onAutoFillGame1?: () => void;
    onSwapPlayers?: (sortOrderA: number, sortOrderB: number) => void;
}) {
    const [tradeTargetId, setTradeTargetId] = useState<string | null>(null);
    const [playerSwapSlot, setPlayerSwapSlot] = useState<number | null>(null);
    const pickSlots = Array.from({ length: 5 });
    const banSlots = Array.from({ length: 5 });

    const getHeroIcon = (name: string) => characters.find(c => c.name === name)?.icon_url;

    const nextPickIndex = isActive && activeAction === 'pick' ? picks.length : -1;
    const nextBanIndex = isActive && activeAction === 'ban' ? bans.length : -1;

    const themeBorderClass = themeColor === 'blue' ? 'border-blue-500' : 'border-red-500';
    const themeShadowClass = themeColor === 'blue' ? 'shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'shadow-[0_0_12px_rgba(239,68,68,0.2)]';
    const themeBgClass = themeColor === 'blue' ? 'bg-blue-500/5' : 'bg-red-500/5';

    return (
        <div className={cn("space-y-4", isRightSide ? "text-right" : "text-left")}>
            {/* Team Header */}
            <div className={cn(
                "relative p-3 rounded-xl border transition-all overflow-hidden",
                isActive
                    ? `${themeBgClass} ${themeBorderClass} ${themeShadowClass}`
                    : "bg-card border-border"
            )}>
                {isActive && (
                    <div className={cn("absolute inset-0 border-2 rounded-xl pointer-events-none", themeBorderClass)} />
                )}
                <div className={cn("flex items-center gap-3", isRightSide ? "flex-row-reverse" : "flex-row")}>
                    <div className="w-10 h-10 shrink-0 bg-background rounded-full overflow-hidden border">
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
                        <h2 className="text-xl font-bold leading-none">{team.abbreviation}</h2>
                        <p className="text-muted-foreground text-xs truncate mt-0.5">{team.name}</p>
                    </div>
                </div>
            </div>

            {/* Auto-Fill */}
            {isAdmin && players.length > 0 && (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onAutoFill} className={cn("text-xs flex-1")}>
                        <Wand2 className="w-3.5 h-3.5 mr-1" />
                        Smart Fill
                    </Button>
                    {onAutoFillGame1 && (
                        <Button variant="outline" size="sm" onClick={onAutoFillGame1} className={cn("text-xs flex-1 text-primary border-primary/30")}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Copy Game 1
                        </Button>
                    )}
                </div>
            )}

            {/* Picks */}
            <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Picks</h3>
                {pickSlots.map((_, i) => {
                    const pick = picks[i];
                    const icon = pick ? getHeroIcon(pick.hero_name) : null;
                    const rosterEntry = roster.find(r => r.sort_order === i);
                    const playerDetails = rosterEntry ? players.find(p => p.id === rosterEntry.player_id) : null;

                    return (
                        <div key={i} className="space-y-0.5 group/pick">
                            <div className={cn(
                                "h-14 relative rounded-lg border flex items-center overflow-hidden transition-all duration-300",
                                pick ? "border-border bg-muted/20" : "border-border border-dashed bg-muted/10",
                                i === nextPickIndex && cn(
                                    themeBorderClass, themeBgClass, "border-2 shadow-lg animate-pulse"
                                )
                            )}>
                                {pick ? (
                                    <>
                                        {icon && (
                                            <LazyImage src={icon} alt={pick.hero_name} className="w-14 h-14 opacity-60 absolute left-0 top-0" />
                                        )}
                                        <div className={cn(
                                            "absolute inset-0 flex items-center px-3 font-bold text-sm drop-shadow-md z-10",
                                            isRightSide ? "justify-end" : "justify-start",
                                            icon ? "pl-16" : ""
                                        )}>
                                            {pick.hero_name}
                                        </div>
                                        {isAdmin && (
                                            <div className={cn(
                                                "absolute inset-0 flex items-center justify-center gap-1 bg-background/80 backdrop-blur-sm z-20 transition-all duration-200",
                                                tradeTargetId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover/pick:opacity-100 group-hover/pick:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto"
                                            )}>
                                                {tradeTargetId && tradeTargetId !== pick.id ? (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="h-7 text-xs px-2 shadow-sm rounded-md"
                                                        onClick={() => {
                                                            onTradeCharacter?.(tradeTargetId, pick.id);
                                                            setTradeTargetId(null);
                                                        }}
                                                    >
                                                        Swap Here
                                                    </Button>
                                                ) : (
                                                    <CharacterPickerPopover
                                                        slotIndex={i}
                                                        characters={characters}
                                                        takenCharacters={takenCharacters}
                                                        isAdmin={isAdmin}
                                                        onPick={(char) => onSwapCharacter(pick.id, char)}
                                                        isSwapMode={true}
                                                    />
                                                )}

                                                {/* Only show Trade/Cancel on the initiating pick or when no trade is active */}
                                                {(!tradeTargetId || tradeTargetId === pick.id) && (
                                                    <Button
                                                        variant={tradeTargetId === pick.id ? "secondary" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-xs px-2 shadow-sm rounded-md",
                                                            tradeTargetId === pick.id
                                                                ? ""
                                                                : "border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                                        )}
                                                        onClick={() => setTradeTargetId(tradeTargetId === pick.id ? null : pick.id)}
                                                    >
                                                        {tradeTargetId === pick.id ? "Cancel" : "Swap"}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full text-center text-muted-foreground text-xs">
                                        {MLBB_SLOT_LABELS[i] || `Pick ${i + 1}`}
                                    </div>
                                )}
                            </div>

                            {/* Player row */}
                            <div className={cn("flex items-center justify-between text-[10px] px-1 relative group/player", isRightSide && "flex-row-reverse")}>
                                {playerDetails ? (
                                    <div
                                        className={cn(
                                            "flex items-center gap-1.5 flex-1 relative rounded px-0.5 -mx-0.5 transition-colors",
                                            isRightSide && "flex-row-reverse",
                                            playerSwapSlot === i && "bg-primary/15 ring-1 ring-primary/40"
                                        )}
                                    >
                                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1 shrink-0", roleColors[MLBB_SLOT_ROLES[i]] || roleColors[rosterEntry.player_role])}>
                                            {MLBB_SLOT_LABELS[i] || rosterEntry.player_role}
                                        </Badge>
                                        <span className="text-muted-foreground font-medium truncate flex-1 overflow-hidden" style={{ maxWidth: "80px" }}>
                                            {playerDetails.ign}
                                        </span>
                                        {isAdmin && playerSwapSlot === null && (
                                            <div className={cn(
                                                "flex items-center gap-0.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0",
                                                isRightSide ? "flex-row-reverse" : ""
                                            )}>
                                                {onSwapPlayers && (
                                                    <button
                                                        onClick={() => setPlayerSwapSlot(i)}
                                                        className="w-4 h-4 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                                        title="Swap player position"
                                                    >
                                                        <ArrowLeftRight className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onUnassignPlayer(i)}
                                                    className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                                    title="Remove player"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        )}
                                        {playerSwapSlot === i && (
                                            <button
                                                onClick={() => setPlayerSwapSlot(null)}
                                                className="text-[8px] text-primary font-semibold shrink-0 hover:text-primary/70 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {playerSwapSlot !== null && playerSwapSlot !== i && (
                                            <button
                                                onClick={() => {
                                                    onSwapPlayers?.(playerSwapSlot, i);
                                                    setPlayerSwapSlot(null);
                                                }}
                                                className="text-[8px] text-primary font-semibold shrink-0 bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                                            >
                                                Swap Here
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1 shrink-0", roleColors[MLBB_SLOT_ROLES[i]])}>
                                        {MLBB_SLOT_LABELS[i] || `Slot ${i + 1}`}
                                    </Badge>
                                )}
                                {!playerDetails && isAdmin && (
                                    <PlayerPickerPopover
                                        players={players}
                                        slotIndex={i}
                                        roster={roster}
                                        onAssign={onAssignPlayer}
                                        slotRole={MLBB_SLOT_LABELS[i]}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bans */}
            <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bans</h3>
                <div className={cn("flex flex-wrap gap-1.5", isRightSide ? "justify-end" : "justify-start")}>
                    {banSlots.map((_, i) => {
                        const ban = bans[i];
                        const icon = ban ? getHeroIcon(ban.hero_name) : null;
                        return (
                            <div key={i} className={cn(
                                "w-10 h-10 relative rounded-md border flex items-center justify-center overflow-hidden group/ban transition-all duration-300",
                                ban ? "border-destructive/40 bg-destructive/5" : "border-border border-dashed bg-muted/30",
                                i === nextBanIndex && cn(
                                    themeBorderClass, themeBgClass, "border-2 shadow-lg animate-pulse"
                                )
                            )}>
                                {ban ? (
                                    <>
                                        {icon && (
                                            <LazyImage src={icon} alt={ban.hero_name} className="w-full h-full grayscale opacity-40 absolute inset-0" />
                                        )}
                                        <Ban className="w-5 h-5 text-destructive z-10" />
                                        {isAdmin && (
                                            <div className={cn(
                                                "absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md z-20 transition-all duration-200",
                                                "opacity-0 pointer-events-none group-hover/ban:opacity-100 group-hover/ban:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto"
                                            )}>
                                                <CharacterPickerPopover
                                                    slotIndex={i}
                                                    characters={characters}
                                                    takenCharacters={takenCharacters}
                                                    isAdmin={isAdmin}
                                                    onPick={(char) => onSwapCharacter(ban.id, char)}
                                                    isSwapMode={true}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════
// Character Card (Hero Pool)
// ══════════════════════════════════

function CharacterCard({ character, isTaken, isSelectable, onClick }: {
    character: GameCharacter;
    isTaken: boolean;
    isSelectable: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isTaken || !isSelectable}
            className={cn(
                "aspect-square relative rounded-lg overflow-hidden border transition-all",
                "bg-card hover:bg-accent",
                isTaken ? "opacity-30 grayscale border-border" : "hover:scale-105 hover:ring-2 hover:ring-primary border-border/50",
            )}
        >
            <LazyImage src={character.icon_url} alt={character.name} className="w-full h-full" />

            <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm p-0.5">
                <p className="text-[9px] text-foreground truncate text-center font-medium">{character.name}</p>
            </div>

            {isTaken && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
            )}
        </button>
    );
}

// ══════════════════════════════════
// Skeleton
// ══════════════════════════════════

function DraftPanelSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-3 h-96 rounded-xl" />
                <Skeleton className="col-span-6 h-96 rounded-xl" />
                <Skeleton className="col-span-3 h-96 rounded-xl" />
            </div>
        </div>
    );
}
