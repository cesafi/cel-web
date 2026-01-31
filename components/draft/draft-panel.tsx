'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

// Types
import { GameCharacter } from '@/lib/types/game-characters';
import { GameHeroBan } from '@/lib/types/game-hero-bans';
import { 
  DraftPhase,
  MLBB_DRAFT_SEQUENCE
} from '@/lib/types/game-draft';

// Actions
import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { getGameHeroBansByGameId, createGameHeroBan, deleteGameHeroBansByGameId } from '@/actions/game-hero-bans';

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
  onDraftComplete?: () => void;
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
  onDraftComplete
}: DraftPanelProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [timer, setTimer] = useState(30);

  // Fetch all characters for this esport
  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['game-characters', esportId],
    queryFn: async () => {
      const result = await getGameCharactersByEsportId(esportId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!esportId,
  });

  // Fetch current bans for this game
  const { data: bans = [], isLoading: isLoadingBans } = useQuery({
    queryKey: ['game-hero-bans', gameId],
    queryFn: async () => {
      const result = await getGameHeroBansByGameId(gameId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!gameId,
  });

  // Add ban mutation
  const addBanMutation = useMutation({
    mutationFn: async ({ heroName, teamId, banOrder }: { heroName: string; teamId: string; banOrder: number }) => {
      const result = await createGameHeroBan({ game_id: gameId, hero_name: heroName, team_id: teamId, ban_order: banOrder });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-hero-bans', gameId] });
    },
  });

  // Reset draft mutation
  const resetDraftMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteGameHeroBansByGameId(gameId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-hero-bans', gameId] });
      setCurrentStep(0);
      toast.success('Draft reset successfully');
    },
  });

  // Calculate banned heroes
  const bannedHeroNames = useMemo(() => 
    bans.map((ban: GameHeroBan) => ban.hero_name),
    [bans]
  );

  // Team-specific bans
  const team1Bans = useMemo(() => 
    bans.filter((ban: GameHeroBan) => ban.team_id === team1.id),
    [bans, team1.id]
  );
  
  const team2Bans = useMemo(() => 
    bans.filter((ban: GameHeroBan) => ban.team_id === team2.id),
    [bans, team2.id]
  );

  // Filter characters based on search and role
  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !selectedRole || char.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, selectedRole]);

  // Get unique roles
  const uniqueRoles = useMemo(() => 
    [...new Set(characters.map(char => char.role))].sort(),
    [characters]
  );

  // Current draft action
  const currentAction = currentStep < MLBB_DRAFT_SEQUENCE.length 
    ? MLBB_DRAFT_SEQUENCE[currentStep] 
    : null;

  // Handle character selection (ban or pick)
  const handleCharacterSelect = async (character: GameCharacter) => {
    if (!currentAction || !isAdmin) return;
    if (bannedHeroNames.includes(character.name)) {
      toast.error('This hero is already banned');
      return;
    }

    const teamId = currentAction.team === 'team1' ? team1.id : team2.id;
    
    if (currentAction.action === 'ban') {
      try {
        await addBanMutation.mutateAsync({
          heroName: character.name,
          teamId,
          banOrder: currentStep + 1
        });
        setCurrentStep(prev => prev + 1);
        setTimer(30);
      } catch (error) {
        toast.error('Failed to ban hero');
      }
    }
  };

  // Timer effect
  useEffect(() => {
    if (!isDraftActive || timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDraftActive, timer]);

  if (isLoadingCharacters || isLoadingBans) {
    return <DraftPanelSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Draft Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge 
            variant="outline" 
            className={cn(
              'text-lg px-4 py-2',
              currentAction?.action === 'ban' 
                ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                : 'border-green-500/50 text-green-400 bg-green-500/10'
            )}
          >
            {currentAction ? (
              <>
                {currentAction.action === 'ban' ? <Ban className="w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                {currentAction.action.toUpperCase()} Phase - {currentAction.team === 'team1' ? team1.abbreviation : team2.abbreviation}
              </>
            ) : (
              'Draft Complete'
            )}
          </Badge>
          
          {isDraftActive && (
            <Badge variant="outline" className="text-lg px-4 py-2 border-amber-500/50 text-amber-400 bg-amber-500/10">
              <Timer className="w-4 h-4 mr-2" />
              {timer}s
            </Badge>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDraftActive(!isDraftActive)}
            >
              {isDraftActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isDraftActive ? 'Pause' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetDraftMutation.mutate()}
              disabled={resetDraftMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Teams Ban Display */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team 1 Bans */}
        <BanRow 
          team={team1} 
          bans={team1Bans} 
          characters={characters}
          isActive={currentAction?.team === 'team1' && currentAction?.action === 'ban'}
          maxBans={5}
        />
        
        {/* Team 2 Bans */}
        <BanRow 
          team={team2} 
          bans={team2Bans} 
          characters={characters}
          isActive={currentAction?.team === 'team2' && currentAction?.action === 'ban'}
          maxBans={5}
        />
      </div>

      {/* Character Picker */}
      <Card className="bg-gradient-to-b from-background to-muted/20 border-muted">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-lg">Select Hero</CardTitle>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search heroes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-background/50"
              />
            </div>
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={selectedRole === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(null)}
            >
              All
            </Button>
            {uniqueRoles.map(role => (
              <Button
                key={role}
                variant={selectedRole === role ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole(role)}
                className={selectedRole === role ? '' : roleTextColors[role]}
              >
                {role}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filteredCharacters.map((character) => {
                const isBanned = bannedHeroNames.includes(character.name);
                
                return (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    isBanned={isBanned}
                    isPicked={false}
                    isSelectable={!isBanned && isAdmin && !!currentAction}
                    onClick={() => handleCharacterSelect(character)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Ban Row Component
interface BanRowProps {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
  };
  bans: GameHeroBan[];
  characters: GameCharacter[];
  isActive: boolean;
  maxBans: number;
}

function BanRow({ team, bans, characters, isActive, maxBans }: BanRowProps) {
  const getCharacterIcon = (heroName: string) => {
    const char = characters.find(c => c.name === heroName);
    return char?.icon_url;
  };

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300',
      isActive && 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/10'
    )}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {team.abbreviation.substring(0, 2)}
          </div>
          <div>
            <p className="font-semibold">{team.abbreviation}</p>
            <p className="text-xs text-muted-foreground">Bans</p>
          </div>
          {isActive && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              Your Turn
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {Array.from({ length: maxBans }).map((_, index) => {
            const ban = bans[index];
            const iconUrl = ban ? getCharacterIcon(ban.hero_name) : null;
            
            return (
              <div
                key={index}
                className={cn(
                  'w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center',
                  'transition-all duration-200',
                  ban 
                    ? 'border-red-500/50 bg-red-500/10' 
                    : 'border-muted-foreground/30 bg-muted/20'
                )}
              >
                {ban && iconUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={iconUrl}
                      alt={ban.hero_name}
                      fill
                      className="object-cover rounded-md grayscale opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Ban className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                ) : ban ? (
                  <span className="text-xs text-center text-muted-foreground line-through">
                    {ban.hero_name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Character Card Component
interface CharacterCardProps {
  character: GameCharacter;
  isBanned: boolean;
  isPicked: boolean;
  isSelectable: boolean;
  onClick: () => void;
}

function CharacterCard({ character, isBanned, isPicked, isSelectable, onClick }: CharacterCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isSelectable || isBanned || isPicked}
      className={cn(
        'relative group aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
        'bg-gradient-to-b',
        roleColors[character.role] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
        isSelectable && !isBanned && !isPicked && 'hover:scale-105 hover:shadow-lg hover:z-10 cursor-pointer',
        isBanned && 'grayscale opacity-40',
        isPicked && 'ring-2 ring-green-500 opacity-80'
      )}
    >
      {/* Character Icon */}
      {character.icon_url ? (
        <Image
          src={character.icon_url}
          alt={character.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs font-bold text-muted-foreground">
            {character.name.substring(0, 2)}
          </span>
        </div>
      )}

      {/* Banned Overlay */}
      {isBanned && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Ban className="w-6 h-6 text-red-500" />
        </div>
      )}

      {/* Name Tooltip */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent',
        'p-1 text-center transition-opacity duration-200',
        'opacity-0 group-hover:opacity-100'
      )}>
        <p className="text-[10px] font-medium text-white truncate">{character.name}</p>
      </div>
    </button>
  );
}

// Skeleton
function DraftPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
