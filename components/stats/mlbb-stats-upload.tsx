'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { extractMlbbStatsFromImage } from '@/actions/mlbb-ocr';
import { createMultipleMlbbStats, getMlbbStatsByGameId, deleteMlbbStatsByGameId, recalculateMatchScoresAction } from '@/actions/stats-mlbb';
import { upsertGameScoresForGame, getGameScoresByGameId } from '@/actions/game-scores';
import { updateGameById, getGameById } from '@/actions/games';
import { 
  uploadGameScreenshots, 
  saveExtractedStatsDraft, 
  clearExtractedStatsDraft 
} from '@/actions/stats-persistence';
import { getGameRosterByGameId } from '@/actions/game-roster';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw, Coins, FileImage, ShieldAlert, Swords, ArrowLeftRight, Star, Castle, Target, Users, Turtle, Crown, Clock, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { useAllGameCharactersWithEsport } from '@/hooks/use-game-characters';
import { useQueryClient } from '@tanstack/react-query';
import { matchKeys } from '@/hooks/use-matches';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface MlbbStatsUploadProps {
  gameId: number;
  matchId: number;
  team1: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
    matchParticipantId: number;
    players: Player[];
  };
  team2: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string | null;
    matchParticipantId: number;
    players: Player[];
  };
  coinTossWinnerId?: string;
  sideSelection?: string;
  onStatsSaved?: () => void;
}

export function MlbbStatsUpload({ gameId, matchId, team1, team2, coinTossWinnerId, sideSelection, onStatsSaved }: MlbbStatsUploadProps) {
  const queryClient = useQueryClient();
  const [isSwappingSides, setIsSwappingSides] = useState(false);
  const [equipmentFile, setEquipmentFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [equipmentPreviewUrl, setEquipmentPreviewUrl] = useState<string | null>(null);
  const [dataPreviewUrl, setDataPreviewUrl] = useState<string | null>(null);

  // Manage preview URLs
  useEffect(() => {
    if (equipmentFile) {
      const url = URL.createObjectURL(equipmentFile);
      setEquipmentPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEquipmentPreviewUrl(null);
    }
  }, [equipmentFile]);

  useEffect(() => {
    if (dataFile) {
      const url = URL.createObjectURL(dataFile);
      setDataPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setDataPreviewUrl(null);
    }
  }, [dataFile]);
  
  // Compute Blue/Red side teams
  const { blueTeam, redTeam } = useMemo(() => {
    let blue = team1;
    let red = team2;

    if (sideSelection === 'blue' && coinTossWinnerId) {
      blue = coinTossWinnerId === team1.id ? team1 : team2;
      red = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (sideSelection === 'red' && coinTossWinnerId) {
      red = coinTossWinnerId === team1.id ? team1 : team2;
      blue = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (coinTossWinnerId) {
      // Default: Coin toss winner gets blue side if no explicit side chosen
      blue = coinTossWinnerId === team1.id ? team1 : team2;
      red = coinTossWinnerId === team1.id ? team2 : team1;
    }

    return { blueTeam: blue, redTeam: red };
  }, [team1, team2, coinTossWinnerId, sideSelection]);

  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>(() => {
    // Compute sides inline for initializer (same logic as useMemo above)
    let initBlue = team1;
    let initRed = team2;
    if (sideSelection === 'blue' && coinTossWinnerId) {
      initBlue = coinTossWinnerId === team1.id ? team1 : team2;
      initRed = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (sideSelection === 'red' && coinTossWinnerId) {
      initRed = coinTossWinnerId === team1.id ? team1 : team2;
      initBlue = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (coinTossWinnerId) {
      initBlue = coinTossWinnerId === team1.id ? team1 : team2;
      initRed = coinTossWinnerId === team1.id ? team2 : team1;
    }

    const initialMapping: Record<string, string> = {};
    const bluePicks = initBlue.players.slice(0, 5);
    const redPicks = initRed.players.slice(0, 5);

    for (let i = 0; i < 5; i++) {
      if (bluePicks[i]) initialMapping[i.toString()] = bluePicks[i].id;
      if (redPicks[i]) initialMapping[(i + 5).toString()] = redPicks[i].id;
    }
    return initialMapping;
  });

  const [previewData, setPreviewData] = useState<MlbbScreenshotData>(() => {
    // Compute sides inline for initializer
    let initBlue = team1;
    let initRed = team2;
    if (sideSelection === 'blue' && coinTossWinnerId) {
      initBlue = coinTossWinnerId === team1.id ? team1 : team2;
      initRed = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (sideSelection === 'red' && coinTossWinnerId) {
      initRed = coinTossWinnerId === team1.id ? team1 : team2;
      initBlue = coinTossWinnerId === team1.id ? team2 : team1;
    } else if (coinTossWinnerId) {
      initBlue = coinTossWinnerId === team1.id ? team1 : team2;
      initRed = coinTossWinnerId === team1.id ? team2 : team1;
    }

    const emptyPlayers = [];
    for (let i = 0; i < 5; i++) {
      emptyPlayers.push({
        playerName: initBlue.players[i]?.ign || `Player ${i + 1}`,
        team: 'Blue' as const,
        heroName: '',
        kda: { kills: 0, deaths: 0, assists: 0 },
        gold: 0,
        rating: 0,
        badge: null,
        damageDealt: 0,
        turretDamage: 0,
        damageTaken: 0,
        teamfight: 0,
        turtlesSlain: 0,
        lordsSlain: 0
      });
    }
    for (let i = 0; i < 5; i++) {
      emptyPlayers.push({
        playerName: initRed.players[i]?.ign || `Player ${i + 6}`,
        team: 'Red' as const,
        heroName: '',
        kda: { kills: 0, deaths: 0, assists: 0 },
        gold: 0,
        rating: 0,
        badge: null,
        damageDealt: 0,
        turretDamage: 0,
        damageTaken: 0,
        teamfight: 0,
        turtlesSlain: 0,
        lordsSlain: 0
      });
    }

    return {
      matchResult: 'VICTORY',
      duration: '',
      score: { blue: 0, red: 0 },
      players: emptyPlayers
    };
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mvpIndex, setMvpIndex] = useState<number | null>(null);
  const [hasExistingStats, setHasExistingStats] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isRestored, setIsRestored] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const hasFetched = useRef(false);
  const [playerSwapSlot, setPlayerSwapSlot] = useState<number | null>(null);

  const MLBB_DEFAULT_ROLES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];
  const [slotRoles, setSlotRoles] = useState<string[]>([
    ...MLBB_DEFAULT_ROLES, ...MLBB_DEFAULT_ROLES
  ]);

  const { data: gameDraftActions, isFetched: isDraftActionsFetched } = useGameDraftActions(gameId);
  const { data: gameCharacters, isFetched: isCharactersFetched } = useAllGameCharactersWithEsport();
  const [heroMapping, setHeroMapping] = useState<Record<string, string>>({});

  const [gameRosters, setGameRosters] = useState<any[]>([]);
  const [isRostersFetched, setIsRostersFetched] = useState(false);

  useEffect(() => {
    async function fetchRosters() {
      const res = await getGameRosterByGameId(gameId);
      if (res.success && res.data) {
        setGameRosters(res.data);
      }
      setIsRostersFetched(true);
    }
    fetchRosters();
  }, [gameId]);

  const STORAGE_KEY = `stats-v1-mlbb-${gameId}`;

  // Save draft to localStorage
  useEffect(() => {
    if (isFetchingStats || isSaving) return;

    const draftData = {
      previewData,
      playerMapping,
      mvpIndex,
      heroMapping,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, [previewData, playerMapping, mvpIndex, heroMapping, isFetchingStats, isSaving, STORAGE_KEY]);

  // Restore draft from localStorage or Database
  useEffect(() => {
    if (isFetchingStats || isRestored) return;

    async function restoreDraft() {
      // 1. Try Database Draft first
      const res = await getGameById(gameId);
      if (res.success && res.data?.extracted_stats_draft) {
        const draft = res.data.extracted_stats_draft as unknown as MlbbScreenshotData;
        setPreviewData(draft);
        if (res.data.mlbb_equipment_image_url) setEquipmentPreviewUrl(res.data.mlbb_equipment_image_url);
        if (res.data.mlbb_data_image_url) setDataPreviewUrl(res.data.mlbb_data_image_url);
        
        const mIndex = draft.players.findIndex(p => p.badge === 'MVP');
        if (mIndex !== -1) setMvpIndex(mIndex);
        
        setIsRestored(true);
        toast.info('Draft restored from server');
        return;
      }

      // 2. Fallback to LocalStorage
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setPreviewData(parsed.previewData);
          setPlayerMapping(parsed.playerMapping);
          setMvpIndex(parsed.mvpIndex);
          if (parsed.heroMapping) setHeroMapping(parsed.heroMapping);
          setIsRestored(true);
          toast.success('Unsaved draft restored');
        } catch (e) {
          console.error('Failed to restore draft:', e);
        }
      }
    }

    restoreDraft();
  }, [gameId, isFetchingStats, isRestored, STORAGE_KEY]);



  // Helper: find the draft pick for a given player using roster-based correlation
  const findPickForPlayer = (playerId: string, draftActions: any[]) => {
    if (!draftActions?.length || !gameRosters?.length) return null;
    // Find the player's roster entry to get their team and slot
    const rosterEntry = gameRosters.find((r: any) => r.player_id === playerId);
    if (!rosterEntry) return null;
    // Get the ordered picks for this player's team
    const teamPicks = draftActions
      .filter((a: any) => a.action_type === 'pick' && a.team_id === rosterEntry.team_id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    // The roster sort_order (0-4) maps to the pick index
    return teamPicks[rosterEntry.sort_order] || null;
  };

  // Effect 1: Fetch existing stats (only needs characters to be loaded for hero name resolution)
  useEffect(() => {
    if (hasFetched.current || !isCharactersFetched) return;

    let mounted = true;
    async function fetchExistingStats() {
      try {
        const [result, scoresResult, gameResult] = await Promise.all([
          getMlbbStatsByGameId(gameId),
          getGameScoresByGameId(gameId),
          getGameById(gameId),
        ]);
        if (!mounted) return;

        // Load existing game duration
        if (gameResult?.success && gameResult.data) {
          const dur = (gameResult.data as any).duration;
          if (dur && dur !== '00:00:00') {
            const parts = dur.split(':');
            let fetchedDuration = '';
            if (parts.length === 3 && parts[0] === '00') {
              fetchedDuration = `${parts[1]}:${parts[2]}`;
            } else if (parts.length === 3) {
              fetchedDuration = `${parts[0]}:${parts[1]}`;
            } else {
              fetchedDuration = dur;
            }
            if (fetchedDuration) {
              setPreviewData(prev => ({ ...prev, duration: fetchedDuration }));
            }
          }
        }

        // Load existing game_scores
        if (scoresResult?.success && scoresResult.data && scoresResult.data.length >= 2) {
          const sBlue = scoresResult.data.find((s: any) => s.match_participant_id === blueTeam.matchParticipantId);
          const sRed = scoresResult.data.find((s: any) => s.match_participant_id === redTeam.matchParticipantId);
          if (sBlue !== undefined || sRed !== undefined) {
            setPreviewData(prev => ({
              ...prev,
              score: {
                blue: sBlue?.score ?? 0,
                red: sRed?.score ?? 0,
              },
            }));
          }
        }

        if (result.success && result.data && result.data.length > 0) {
          // Rebuild previewData based on existing stats
          const newPreviewDataPlayers: any[] = [];
          const newPlayerMapping: Record<string, string> = {};
          const newHeroMapping: Record<string, string> = {};
          let mvpIdx: number | null = null;

          const bluePlayerIds = new Set(blueTeam.players.map(p => p.id));
          const redPlayerIds = new Set(redTeam.players.map(p => p.id));

          // Fill default empty slots
          for (let i = 0; i < 10; i++) {
            const isBlue = i < 5;
            const pList = isBlue ? blueTeam.players : redTeam.players;
            const defaultP = pList[i % 5];

            newPreviewDataPlayers.push({
              playerName: defaultP?.ign || `Player ${i + 1}`,
              team: isBlue ? 'Blue' : 'Red',
              heroName: '',
              kda: { kills: 0, deaths: 0, assists: 0 },
              gold: 0,
              rating: 0,
              badge: null,
              damageDealt: 0,
              turretDamage: 0,
              damageTaken: 0,
              teamfight: 0,
              turtlesSlain: 0,
              lordsSlain: 0
            });
          }

          let blueIndex = 0;
          let redIndex = 5;

          // Sort by order column if available for correct position placement
          const sortedStats = [...result.data].sort((a, b) => {
            if (a.order != null && b.order != null) return a.order - b.order;
            if (a.order != null) return -1;
            if (b.order != null) return 1;
            return 0;
          });

          sortedStats.forEach((stat) => {
            let slot = -1;
            // Use order column if available (1-5 = Blue, 6-10 = Red)
            if (stat.order != null) {
              slot = stat.order <= 5 ? stat.order - 1 : stat.order - 1;
            } else if (bluePlayerIds.has(stat.player_id)) {
              slot = blueIndex++;
            } else if (redPlayerIds.has(stat.player_id)) {
              slot = redIndex++;
            }

            if (slot !== -1 && slot < 10) {
              newPlayerMapping[slot.toString()] = stat.player_id;
              if (stat.game_character_id) {
                newHeroMapping[slot.toString()] = stat.game_character_id.toString();
              }
              if (stat.is_mvp) mvpIdx = slot;

              const char = gameCharacters?.find(c => c.id === stat.game_character_id);

              newPreviewDataPlayers[slot] = {
                playerName: stat.players?.ign || `Player ${slot + 1}`,
                team: slot < 5 ? 'Blue' : 'Red',
                heroName: char?.name || '',
                kda: {
                  kills: stat.kills ?? 0,
                  deaths: stat.deaths ?? 0,
                  assists: stat.assists ?? 0
                },
                gold: stat.gold ?? 0,
                rating: stat.rating ?? 0,
                badge: stat.is_mvp ? 'MVP' : null,
                damageDealt: stat.damage_dealt ?? 0,
                turretDamage: stat.turret_damage ?? 0,
                damageTaken: stat.damage_taken ?? 0,
                teamfight: stat.teamfight ?? 0,
                turtle_slain: stat.turtle_slain ?? 0,
                lord_slain: stat.lord_slain ?? 0
              };
            }
          });

          setPlayerMapping(newPlayerMapping);
          setHeroMapping(newHeroMapping);
          setMvpIndex(mvpIdx);
          setPreviewData(prev => ({ ...prev, players: newPreviewDataPlayers }));
          setHasExistingStats(true);
        }

        // Initialize roles from roster data (always, not just when stats exist)
        if (gameRosters?.length) {
          const newSlotRoles = [...MLBB_DEFAULT_ROLES, ...MLBB_DEFAULT_ROLES];
          for (const r of gameRosters) {
            const isBlueTeam = r.team_id === blueTeam.id;
            const slotIdx = isBlueTeam ? r.sort_order : r.sort_order + 5;
            if (r.player_role && slotIdx >= 0 && slotIdx < 10) {
              newSlotRoles[slotIdx] = r.player_role;
            }
          }
          setSlotRoles(newSlotRoles);
        }
      } catch (e) {
        console.error("Failed to fetch existing stats", e);
      } finally {
        hasFetched.current = true;
        setIsFetchingStats(false);
      }
    }

    fetchExistingStats();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isCharactersFetched]);

  // Effect 2: Once draft, characters, and rosters are all loaded AND no existing stats were found,
  // apply heroes from draft data using roster-based correlation
  useEffect(() => {
    if (!hasFetched.current || hasExistingStats) return;
    if (!isDraftActionsFetched || !isCharactersFetched || !isRostersFetched) return;
    if (!gameDraftActions?.length || !gameRosters?.length) return;

    const newHeroMapping: Record<string, string> = {};
    setPreviewData(prev => {
      const newPlayers = [...prev.players];
      for (let i = 0; i < 10; i++) {
        const pId = playerMapping[i.toString()];
        if (pId) {
          const pick = findPickForPlayer(pId, gameDraftActions);
          if (pick?.hero_id) {
            const char = gameCharacters?.find(c => c.id === pick.hero_id);
            if (char) {
              newHeroMapping[i.toString()] = char.id.toString();
              newPlayers[i] = { ...newPlayers[i], heroName: char.name };
            }
          } else if (pick?.hero_name) {
            const normalizedPickHero = pick.hero_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const char = gameCharacters?.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedPickHero);
            if (char) {
              newHeroMapping[i.toString()] = char.id.toString();
              newPlayers[i] = { ...newPlayers[i], heroName: char.name };
            }
          }
        }
      }
      setHeroMapping(newHeroMapping);
      return { ...prev, players: newPlayers };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftActionsFetched, isCharactersFetched, isRostersFetched, hasExistingStats, gameDraftActions, gameRosters, gameCharacters, playerMapping]);

  // Effect 3: Sync player mapping from rosters whenever they change
  useEffect(() => {
    if (!isRostersFetched || hasExistingStats || !gameRosters.length) return;

    setPlayerMapping(prev => {
      const newMapping = { ...prev };
      gameRosters.forEach(r => {
        const isBlue = r.team_id === blueTeam.id;
        const slot = isBlue ? r.sort_order : r.sort_order + 5;
        if (slot >= 0 && slot < 10) {
          newMapping[slot.toString()] = r.player_id;
        }
      });
      if (JSON.stringify(newMapping) === JSON.stringify(prev)) return prev;
      return newMapping;
    });

    setPreviewData(prev => {
      const newPlayers = [...prev.players];
      let changed = false;
      gameRosters.forEach(r => {
        const isBlue = r.team_id === blueTeam.id;
        const slot = isBlue ? r.sort_order : r.sort_order + 5;
        if (slot >= 0 && slot < 10) {
          const allPlayers = [...team1.players, ...team2.players];
          const player = allPlayers.find(p => p.id === r.player_id);
          if (player && (newPlayers[slot].playerName !== player.ign || newPlayers[slot].team !== (isBlue ? 'Blue' : 'Red'))) {
            newPlayers[slot] = {
              ...newPlayers[slot],
              playerName: player.ign || (player.first_name ? `${player.first_name} ${player.last_name || ''}`.trim() : `Player ${slot + 1}`),
              team: isBlue ? 'Blue' : 'Red'
            };
            changed = true;
          }
        }
      });
      return changed ? { ...prev, players: newPlayers } : prev;
    });
  }, [gameRosters, isRostersFetched, hasExistingStats, blueTeam.id, redTeam.id, team1.players, team2.players]);

  // Effect 3: Sync slot roles from game_rosters whenever rosters or player mappings change
  useEffect(() => {
    if (!gameRosters?.length) return;

    const newSlotRoles = [...MLBB_DEFAULT_ROLES, ...MLBB_DEFAULT_ROLES];
    for (let i = 0; i < 10; i++) {
      const pId = playerMapping[i.toString()];
      if (pId && pId !== 'skip') {
        const rosterEntry = gameRosters.find((r: any) => r.player_id === pId);
        if (rosterEntry?.player_role) {
          newSlotRoles[i] = rosterEntry.player_role;
        }
      }
    }
    setSlotRoles(newSlotRoles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRosters, playerMapping]);

  // Handle file analysis once both are provided
  const handleAnalyze = async () => {
    if (!equipmentFile || !dataFile) {
      toast.error('Please upload both the Equipment and Data screenshots first.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('equipment', equipmentFile);
    formData.append('data', dataFile);

    try {
      const result = await extractMlbbStatsFromImage(formData);
      if (result.success && result.data) {

        // Prepare the extracted data
        const convertedData = { ...result.data };

        // Auto-map players by IGN
        const allPlayers = [...team1.players, ...team2.players];
        const newMapping: Record<string, string> = { ...playerMapping };
        const newHeroMapping: Record<string, string> = {};

        convertedData.players.forEach((stat, index) => {
          if (!stat.playerName) return;
          const statNameLower = stat.playerName.toLowerCase();
          const matchedPlayer = allPlayers.find(p => {
            if (!p.ign) return false;
            const ignLower = p.ign.toLowerCase();
            return statNameLower.includes(ignLower) || ignLower.includes(statNameLower);
          });

          if (matchedPlayer) {
            newMapping[index.toString()] = matchedPlayer.id;
          }

          if (stat.heroName && gameCharacters) {
            const normalizedStatHero = stat.heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchedChar = gameCharacters.find((c: any) => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedStatHero);
            if (matchedChar) {
              newHeroMapping[index.toString()] = matchedChar.id.toString();
              stat.heroName = matchedChar.name; // ensure matched casing
            }
          }
        });

        // Auto-map draft mapping after setting initial mappings using roster-based correlation
        if (gameDraftActions && gameRosters?.length) {
          convertedData.players.forEach((stat, index) => {
            const pId = newMapping[index.toString()];
            if (pId) {
              const pick = findPickForPlayer(pId, gameDraftActions);
              if (pick?.hero_id) {
                const matchedChar = gameCharacters?.find((c: any) => c.id === pick.hero_id);
                if (matchedChar) {
                  newHeroMapping[index.toString()] = matchedChar.id.toString();
                  stat.heroName = matchedChar.name;
                }
              } else if (pick?.hero_name) {
                const normalizedPickHero = pick.hero_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const matchedChar = gameCharacters?.find((c: any) => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedPickHero);
                if (matchedChar) {
                  newHeroMapping[index.toString()] = matchedChar.id.toString();
                  stat.heroName = matchedChar.name;
                }
              }
            }
          });
        }

        setPlayerMapping(newMapping);
        setHeroMapping(newHeroMapping);

        // Update roles from game_rosters for all mapped players
        if (gameRosters?.length) {
          const newSlotRoles = [...slotRoles];
          convertedData.players.forEach((_, index) => {
            const pId = newMapping[index.toString()];
            if (pId && pId !== 'skip') {
              const rosterEntry = gameRosters.find((r: any) => r.player_id === pId);
              if (rosterEntry?.player_role) {
                newSlotRoles[index] = rosterEntry.player_role;
              }
            }
          });
          setSlotRoles(newSlotRoles);
        }

        // When AI extracts stats, override the empty structure
        setPreviewData(convertedData);

        const extractedMvpIndex = convertedData.players.findIndex(p => p.badge === 'MVP');
        if (extractedMvpIndex !== -1) {
          setMvpIndex(extractedMvpIndex);
        }

        // --- PERSISTENCE START ---
        // 1. Upload images to Cloudinary
        const uploadRes = await uploadGameScreenshots(gameId, {
          mlbbEquipment: equipmentFile,
          mlbbData: dataFile
        });
        
        if (uploadRes.success && uploadRes.data) {
          if (uploadRes.data.mlbb_equipment_image_url) setEquipmentPreviewUrl(uploadRes.data.mlbb_equipment_image_url);
          if (uploadRes.data.mlbb_data_image_url) setDataPreviewUrl(uploadRes.data.mlbb_data_image_url);
        }

        // 2. Save JSON draft to DB
        await saveExtractedStatsDraft(gameId, convertedData);
        // --- PERSISTENCE END ---

        toast.success('Stats extracted and saved as draft');
      } else {
        toast.error(result.error || 'Failed to extract stats');
      }
    } catch (error) {
      toast.error('An error occurred during extraction');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyFromDraft = async () => {
    const { getGameDraftActionsByGameId } = await import('@/actions/game-draft');
    const [freshDraftResult, rosterResult] = await Promise.all([
      getGameDraftActionsByGameId(gameId),
      getGameRosterByGameId(gameId),
    ]);

    const freshDraftActions = freshDraftResult.success ? freshDraftResult.data : null;
    const freshRosters = rosterResult.success ? rosterResult.data : null;

    if (!freshDraftActions || freshDraftActions.length === 0) {
      toast.error('No draft data available for this game.');
      return;
    }
    if (!freshRosters || freshRosters.length === 0) {
      toast.error('No roster data available. Please set up rosters in the draft panel first.');
      return;
    }

    setGameRosters(freshRosters);

    setPreviewData(prevData => {
      const newPlayers = [...prevData.players];
      const newHeroMapping = { ...heroMapping };

      for (let i = 0; i < 10; i++) {
        const pId = playerMapping[i.toString()];
        if (pId && pId !== 'skip') {
          const pick = findPickForPlayer(pId, freshDraftActions);
          if (pick?.hero_id) {
            const matchingChar = gameCharacters?.find(c => c.id === pick.hero_id);
            if (matchingChar) {
              newHeroMapping[i.toString()] = matchingChar.id.toString();
              newPlayers[i] = { ...newPlayers[i], heroName: matchingChar.name };
            }
          } else if (pick?.hero_name) {
            const normalizedPickHero = pick.hero_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchingChar = gameCharacters?.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedPickHero);
            if (matchingChar) {
              newHeroMapping[i.toString()] = matchingChar.id.toString();
              newPlayers[i] = { ...newPlayers[i], heroName: matchingChar.name };
            }
          }
        }
      }
      setHeroMapping(newHeroMapping);
      return { ...prevData, players: newPlayers };
    });
    toast.success('Heroes mapped from draft');
  };

  const handleStatChange = (index: number, field: string, value: string) => {
    const newPlayers = [...previewData.players];
    const player = JSON.parse(JSON.stringify(newPlayers[index]));

    if (field === 'k') {
      player.kda.kills = Number(value) || 0;
    } else if (field === 'd') {
      player.kda.deaths = Number(value) || 0;
    } else if (field === 'a') {
      player.kda.assists = Number(value) || 0;
    } else if (field === 'gold') {
      const cleanValue = value.replace(/,/g, '');
      player.gold = Number(cleanValue) || 0;
    } else if (field === 'rating') {
      player.rating = Number(value) || 0;
    } else if (field === 'heroName') {
      player.heroName = value;
    } else if (field === 'damageDealt') {
      player.damageDealt = Number(value) || 0;
    } else if (field === 'turretDamage') {
      player.turretDamage = Number(value) || 0;
    } else if (field === 'damageTaken') {
      player.damageTaken = Number(value) || 0;
    } else if (field === 'teamfight') {
      player.teamfight = Number(value) || 0;
    } else if (field === 'turtlesSlain') {
      player.turtlesSlain = Number(value) || 0;
    } else if (field === 'lordsSlain') {
      player.lordsSlain = Number(value) || 0;
    }

    newPlayers[index] = player;
    setPreviewData({ ...previewData, players: newPlayers });
  };

  const validateStats = () => {
    const newErrors: Record<string, boolean> = {};

    if (!previewData.duration || previewData.duration.trim() === '') {
      newErrors.duration = true;
    }

    if (previewData.score.blue === 0 && previewData.score.red === 0) {
      newErrors.score = true;
    }

    if (mvpIndex === null) {
      newErrors.mvp = true;
    }

    previewData.players.forEach((_, i) => {
      if (!heroMapping[i.toString()] || heroMapping[i.toString()] === '') {
        newErrors[`hero-${i}`] = true;
      }

      const mapping = playerMapping[i.toString()];
      if (!mapping || mapping === 'skip') {
        newErrors[`player-${i}`] = true;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateStats()) {
      toast.error('Please fill in all required fields highlighted in red.');
      return;
    }
    setIsSaving(true);
    try {
      const statsToSave = previewData.players
        .map((stat, index) => {
          const playerId = playerMapping[index.toString()];
          if (!playerId || playerId === 'skip') return null;

          const playerInTeam1 = team1.players.find(p => p.id === playerId);
          const playerInTeam2 = team2.players.find(p => p.id === playerId);

          const teamId = playerInTeam1 ? team1.id : playerInTeam2 ? team2.id : null;

          return {
            game_id: gameId,
            player_id: playerId,
            team_id: teamId,
            game_character_id: heroMapping[index.toString()] ? Number(heroMapping[index.toString()]) : null,
            kills: stat.kda.kills,
            deaths: stat.kda.deaths,
            assists: stat.kda.assists,
            gold: stat.gold,
            rating: stat.rating,
            damage_dealt: stat.damageDealt,
            turret_damage: stat.turretDamage,
            damage_taken: stat.damageTaken,
            teamfight: stat.teamfight,
            turtle_slain: stat.turtlesSlain,
            lord_slain: stat.lordsSlain,
            is_mvp: index === mvpIndex,
            order: index + 1
          };
        })
        .filter((stat): stat is NonNullable<typeof stat> => stat !== null);

      if (statsToSave.length === 0) {
        toast.error('No players mapped. Please map players before saving.');
        setIsSaving(false);
        return;
      }

      await deleteMlbbStatsByGameId(gameId);
      const result = await createMultipleMlbbStats(statsToSave);

      const gameUpdate: any = { id: gameId, status: 'completed' as const };
      if (previewData.duration) {
        let durationToSave = previewData.duration;
        if (durationToSave.split(':').length === 2) {
          durationToSave = `${durationToSave}:00`;
        }
        gameUpdate.duration = durationToSave;
      }

      if (previewData.score.blue > 0 || previewData.score.red > 0) {
        await upsertGameScoresForGame(gameId, [
          { game_id: gameId, match_participant_id: blueTeam.matchParticipantId, score: previewData.score.blue },
          { game_id: gameId, match_participant_id: redTeam.matchParticipantId, score: previewData.score.red },
        ]);
      }

      if (result.success) {
        localStorage.removeItem(STORAGE_KEY);
        toast.success(`${hasExistingStats ? 'Updated' : 'Saved'} stats for ${statsToSave.length} players`);
        setHasExistingStats(true);
        await updateGameById(gameUpdate);
        await clearExtractedStatsDraft(gameId); // Clear draft on success
        try {
          await recalculateMatchScoresAction(matchId);
        } catch (e) {
          console.error('Failed to recalculate match scores:', e);
        }
        onStatsSaved?.();
      } else {
        toast.error(result.error || 'Failed to save stats');
      }
    } catch (error) {
      toast.error('Failed to save stats');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwapSides = async () => {
    setIsSwappingSides(true);
    try {
      // Logic to flip side_selection. 
      // If blue -> red, If red -> blue, If none -> check coin toss default and flip
      let newSide: 'blue' | 'red' = 'blue';

      if (sideSelection === 'blue') {
        newSide = 'red';
      } else if (sideSelection === 'red') {
        newSide = 'blue';
      } else if (coinTossWinnerId) {
        // Default is blue for coin toss winner, so flip to red
        newSide = 'red';
      } else {
        // No coin toss, no side, default is red for team2
        newSide = 'red';
      }

      const res = await updateGameById({ id: gameId, side_selection: newSide });
      if (res.success) {
        toast.success(`Game sides officially swapped to ${newSide.toUpperCase()}`);
        setPreviewData(prev => ({
          ...prev,
          score: {
            blue: prev.score.red,
            red: prev.score.blue
          }
        }));
        queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
        queryClient.invalidateQueries({ queryKey: ['active-api-exports'] });
      } else {
        toast.error(res.error || 'Failed to swap sides in database');
      }
    } catch (e) {
      console.error('Swap side error:', e);
      toast.error('An unexpected error occurred during side swap');
    } finally {
      setIsSwappingSides(false);
    }
  };

  const getTeamForPlayer = (playerId: string) => {
    if (team1.players.some(p => p.id === playerId)) return team1;
    if (team2.players.some(p => p.id === playerId)) return team2;
    return null;
  };

  const handleSwapPlayers = (slotA: number, slotB: number) => {
    const newPlayers = [...previewData.players];
    [newPlayers[slotA], newPlayers[slotB]] = [newPlayers[slotB], newPlayers[slotA]];
    setPreviewData({ ...previewData, players: newPlayers });

    const newMapping = { ...playerMapping };
    const tempPlayer = newMapping[slotA.toString()];
    newMapping[slotA.toString()] = newMapping[slotB.toString()];
    newMapping[slotB.toString()] = tempPlayer;
    setPlayerMapping(newMapping);

    const newHeroMapping = { ...heroMapping };
    const tempHero = newHeroMapping[slotA.toString()];
    newHeroMapping[slotA.toString()] = newHeroMapping[slotB.toString()];
    newHeroMapping[slotB.toString()] = tempHero;
    setHeroMapping(newHeroMapping);

    const newRoles = [...slotRoles];
    [newRoles[slotA], newRoles[slotB]] = [newRoles[slotB], newRoles[slotA]];
    setSlotRoles(newRoles);

    if (mvpIndex === slotA) setMvpIndex(slotB);
    else if (mvpIndex === slotB) setMvpIndex(slotA);

    setPlayerSwapSlot(null);
    toast.success('Players swapped');
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full relative">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Screenshots</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Provide BOTH the Equipment and Data screenshots from the post-game scoreboard to extract all stats.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
              <div className="flex flex-col items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="equipment-upload-mlbb"
                  onChange={(e) => setEquipmentFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                />
                <Button asChild variant={equipmentFile ? "default" : "outline"} className="w-48 relative">
                  <label htmlFor="equipment-upload-mlbb" className="cursor-pointer flex items-center h-full">
                    <FileImage className="mr-2 h-4 w-4" />
                    {equipmentFile ? "Equipment Ready" : "Select Equipment"}
                  </label>
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="data-upload-mlbb"
                  onChange={(e) => setDataFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                />
                <Button asChild variant={dataFile ? "default" : "outline"} className="w-48 relative">
                  <label htmlFor="data-upload-mlbb" className="cursor-pointer flex items-center h-full">
                    <FileImage className="mr-2 h-4 w-4" />
                    {dataFile ? "Data Ready" : "Select Data"}
                  </label>
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isUploading || !equipmentFile || !dataFile}
              className="mt-6 w-full max-w-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing via AI...
                </>
              ) : (
                'Extract Statistics'
              )}
            </Button>
          </div>

          {(equipmentPreviewUrl || dataPreviewUrl) && (
            <div className="mt-8 pt-8 border-t border-dashed w-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Reference View</h4>
                <p className="text-[10px] text-muted-foreground lowercase italic">Click image to pop out</p>
              </div>
              <div className="flex gap-4 justify-center">
                {equipmentPreviewUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="group relative cursor-zoom-in rounded-lg border bg-muted/50 p-1 transition-all hover:ring-2 hover:ring-primary overflow-hidden w-40 h-24 sm:w-60 sm:h-36">
                        <img src={equipmentPreviewUrl} alt="Equipment Screenshot" className="h-full w-full object-cover rounded shadow-inner" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[10px] font-bold text-white text-center opacity-0 transition-opacity group-hover:opacity-100 uppercase">
                          Equipment View
                        </div>
                        <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100 border border-white/20">
                          <ZoomIn className="h-3 w-3" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 border-none bg-transparent shadow-none">
                      <DialogTitle asChild>
                        <VisuallyHidden>Equipment Screenshot Preview</VisuallyHidden>
                      </DialogTitle>
                      <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 flex-col gap-4">
                         <img src={equipmentPreviewUrl} alt="Equipment Screenshot" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" />
                         <div className="px-4 py-1.5 bg-black/80 backdrop-blur rounded-full text-white text-sm font-bold border border-white/20 shadow-xl pointer-events-none uppercase tracking-widest">
                            EQUIPMENT SCOREBOARD
                         </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {dataPreviewUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="group relative cursor-zoom-in rounded-lg border bg-muted/50 p-1 transition-all hover:ring-2 hover:ring-primary overflow-hidden w-40 h-24 sm:w-60 sm:h-36">
                        <img src={dataPreviewUrl} alt="Data Screenshot" className="h-full w-full object-cover rounded shadow-inner" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[10px] font-bold text-white text-center opacity-0 transition-opacity group-hover:opacity-100 uppercase">
                          Damage/KDA View
                        </div>
                        <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100 border border-white/20">
                          <ZoomIn className="h-3 w-3" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 border-none bg-transparent shadow-none">
                      <DialogTitle asChild>
                        <VisuallyHidden>Data Screenshot Preview</VisuallyHidden>
                      </DialogTitle>
                      <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 flex-col gap-4">
                         <img src={dataPreviewUrl} alt="Data Screenshot" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" />
                         <div className="px-4 py-1.5 bg-black/80 backdrop-blur rounded-full text-white text-sm font-bold border border-white/20 shadow-xl pointer-events-none uppercase tracking-widest">
                            DATA SCOREBOARD
                         </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isFetchingStats ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading initial data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Extracted Statistics</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSwapSides} disabled={isSwappingSides}>
                  {isSwappingSides ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
                  Swap Sides
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCopyFromDraft}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Copy from Draft
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setPreviewData({
                    matchResult: 'VICTORY',
                    duration: '',
                    score: { blue: 0, red: 0 },
                    players: Array.from({ length: 10 }).map((_, i) => ({
                      playerName: '',
                      team: i < 5 ? 'Blue' : 'Red',
                      heroName: '',
                      kda: { kills: 0, deaths: 0, assists: 0 },
                      gold: 0,
                      rating: 0,
                      badge: null,
                      damageDealt: 0,
                      turretDamage: 0,
                      damageTaken: 0,
                      teamfight: 0,
                      turtlesSlain: 0,
                      lordsSlain: 0
                    }))
                  });
                  setEquipmentFile(null);
                  setDataFile(null);
                  setMvpIndex(null);
                  setHeroMapping({});
                  setErrors({});
                  localStorage.removeItem(STORAGE_KEY);
                  setEquipmentPreviewUrl(null);
                  setDataPreviewUrl(null);
                  toast.success('Form reset');
                }}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${errors.score ? 'border-destructive bg-destructive/5' : 'bg-muted/30'}`}>
              {/* Blue Team Winner Selection */}
              <button
                type="button"
                onClick={() => {
                  setPreviewData({ ...previewData, score: { blue: 1, red: 0 } });
                  if (errors.score) setErrors(prev => { const { score: _, ...rest } = prev; return rest; });
                }}
                className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-lg border transition-all",
                  previewData.score.blue === 1
                    ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "bg-transparent border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                )}
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-blue-500 uppercase tracking-tight">{blueTeam.abbreviation}</span>
                  <span className="text-[10px] text-muted-foreground">Blue Side</span>
                </div>
                <div className="flex flex-col items-center min-w-[60px]">
                  <Badge variant={previewData.score.blue === 1 ? "default" : "outline"} className={cn(
                    "mt-1 text-[10px] px-2 h-5 leading-none transition-all duration-300",
                    previewData.score.blue === 1 
                      ? "bg-blue-600 hover:bg-blue-600 scale-110 shadow-lg shadow-blue-500/50" 
                      : "text-muted-foreground border-muted-foreground/30 opacity-60"
                  )}>
                    {previewData.score.blue === 1 ? "WINNER" : "LOSER"}
                  </Badge>
                </div>
              </button>

              <div className="flex flex-col items-center gap-1 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Match Duration</span>
                </div>
                <Input
                  type="text"
                  value={previewData.duration || ''}
                  onChange={(e) => {
                    setPreviewData({ ...previewData, duration: e.target.value });
                    if (errors.duration) {
                      setErrors(prev => { const { duration: _, ...rest } = prev; return rest; });
                    }
                  }}
                  className={`h-8 w-24 text-center font-mono text-lg bg-transparent border-none focus-visible:ring-0 ${errors.duration ? 'text-destructive placeholder:text-destructive' : ''}`}
                  placeholder="MM:SS"
                />
              </div>

              {/* Red Team Winner Selection */}
              <button
                type="button"
                onClick={() => {
                  setPreviewData({ ...previewData, score: { blue: 0, red: 1 } });
                  if (errors.score) setErrors(prev => { const { score: _, ...rest } = prev; return rest; });
                }}
                className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-lg border transition-all",
                  previewData.score.red === 1
                    ? "bg-red-500/10 border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    : "bg-transparent border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                )}
              >
                <div className="flex flex-col items-center min-w-[60px]">
                  <Badge variant={previewData.score.red === 1 ? "default" : "outline"} className={cn(
                    "mt-1 text-[10px] px-2 h-5 leading-none transition-all duration-300",
                    previewData.score.red === 1 
                      ? "bg-red-600 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50" 
                      : "text-muted-foreground border-muted-foreground/30 opacity-60"
                  )}>
                    {previewData.score.red === 1 ? "WINNER" : "LOSER"}
                  </Badge>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-red-500 uppercase tracking-tight">{redTeam.abbreviation}</span>
                  <span className="text-[10px] text-muted-foreground">Red Side</span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { side: 'Blue' as const, team: blueTeam, startIdx: 0, themeColor: 'blue' },
              { side: 'Red' as const, team: redTeam, startIdx: 5, themeColor: 'red' },
            ].map(({ side, team, startIdx, themeColor }) => (
              <div key={side} className="rounded-xl border bg-card overflow-hidden">
                <div className={`p-3 border-b flex items-center gap-3 ${themeColor === 'blue' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="w-8 h-8 rounded-full bg-background border overflow-hidden flex items-center justify-center shrink-0">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.abbreviation} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-[10px] font-bold ${themeColor === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>
                        {team.abbreviation.substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{team.abbreviation}</h3>
                    <p className={`text-[10px] font-medium ${themeColor === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>{side} Side</p>
                  </div>
                </div>

                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const index = startIdx + i;
                    const stat = previewData.players[index];
                    const mappedPlayerId = playerMapping[index.toString()];

                    return (
                      <div key={i} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                            {slotRoles[index]}
                          </span>

                          <Select
                            value={mappedPlayerId || ''}
                            onValueChange={(value) => {
                              setPlayerMapping(prev => ({ ...prev, [index.toString()]: value }));
                              if (errors[`player-${index}`] && value && value !== 'skip') {
                                setErrors(prev => {
                                  const { [`player-${index}`]: _, ...rest } = prev;
                                  return rest;
                                });
                              }

                              if (value !== 'skip' && gameDraftActions && gameRosters?.length) {
                                const rosterEntry = gameRosters.find((r: any) => r.player_id === value);
                                if (rosterEntry?.player_role) {
                                  setSlotRoles(prev => {
                                    const updated = [...prev];
                                    updated[index] = rosterEntry.player_role;
                                    return updated;
                                  });
                                }

                                const pick = findPickForPlayer(value, gameDraftActions);
                                if (pick?.hero_id) {
                                  const matchingChar = gameCharacters?.find(c => c.id === pick.hero_id);
                                  if (matchingChar) {
                                    setHeroMapping(prev => ({ ...prev, [index.toString()]: matchingChar.id.toString() }));
                                    setPreviewData(prevData => {
                                      const newPlayers = [...prevData.players];
                                      newPlayers[index] = { ...newPlayers[index], heroName: matchingChar.name };
                                      return { ...prevData, players: newPlayers };
                                    });
                                  }
                                }
                              }
                            }}
                          >
                            <SelectTrigger className={`h-8 flex-1 bg-background/50 border-white/10 ${errors[`player-${index}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}>
                              <SelectValue placeholder="Select player..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">-- Skip --</SelectItem>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{blueTeam.abbreviation}</div>
                              {blueTeam.players.map(p => (<SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>))}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{redTeam.abbreviation}</div>
                              {redTeam.players.map(p => (<SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={heroMapping[index.toString()]}
                            onValueChange={(value) => {
                              setHeroMapping(prev => ({ ...prev, [index.toString()]: value }));
                              const char = gameCharacters?.find(c => c.id === Number(value));
                              if (char) {
                                const newPlayers = [...previewData.players];
                                newPlayers[index] = { ...newPlayers[index], heroName: char.name };
                                setPreviewData({ ...previewData, players: newPlayers });
                              }
                              if (errors[`hero-${index}`]) {
                                setErrors(prev => {
                                  const { [`hero-${index}`]: _, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                          >
                            <SelectTrigger className={`h-8 w-[140px] bg-background/50 border-white/10 ${errors[`hero-${index}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}>
                              <SelectValue placeholder="Select Hero" />
                            </SelectTrigger>
                            <SelectContent>
                              {gameCharacters?.map(char => (
                                <SelectItem key={char.id} value={char.id.toString()}>{char.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-colors ${mvpIndex === index ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : errors.mvp ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30 border-transparent text-muted-foreground'}`}>
                            <Checkbox
                              id={`mvp-${index}`}
                              checked={mvpIndex === index}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setMvpIndex(index);
                                  if (errors.mvp) {
                                    setErrors(prev => { const { mvp: _, ...rest } = prev; return rest; });
                                  }
                                } else if (mvpIndex === index) {
                                  setMvpIndex(null);
                                }
                              }}
                              className={`h-5 w-5 rounded-full border-2 border-current data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 ${errors.mvp ? 'border-destructive' : ''}`}
                            />
                            <span className="text-[10px] text-muted-foreground">MVP</span>
                          </div>

                          {playerSwapSlot === null ? (
                            <button onClick={() => setPlayerSwapSlot(index)} className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          ) : playerSwapSlot === index ? (
                            <button onClick={() => setPlayerSwapSlot(null)} className="text-[10px] font-semibold text-muted-foreground shrink-0 hover:text-foreground">Cancel</button>
                          ) : (
                            playerSwapSlot >= startIdx && playerSwapSlot < startIdx + 5 ? (
                              <button onClick={() => handleSwapPlayers(playerSwapSlot, index)} className={`text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded transition-colors ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>Swap Here</button>
                            ) : (
                              <div className="w-6 shrink-0" />
                            )
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-end gap-2">
                            <div className="flex-shrink-0">
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">K / D / A</span>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Input type="number" value={stat.kda.kills} onChange={(e) => handleStatChange(index, 'k', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input type="number" value={stat.kda.deaths} onChange={(e) => handleStatChange(index, 'd', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input type="number" value={stat.kda.assists} onChange={(e) => handleStatChange(index, 'a', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" />
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Coins className="h-2.5 w-2.5 text-yellow-500" /> Gold</span>
                              <Input type="number" value={stat.gold} onChange={(e) => handleStatChange(index, 'gold', e.target.value)} className="h-7 w-[72px] text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-amber-400" /> Rating</span>
                              <Input type="number" value={stat.rating} onChange={(e) => handleStatChange(index, 'rating', e.target.value)} className="h-7 w-[55px] text-xs mt-0.5" step="0.1" />
                            </div>
                          </div>

                          <div className="grid grid-cols-6 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">Dmg</span>
                              <Input type="number" value={stat.damageDealt} onChange={(e) => handleStatChange(index, 'damageDealt', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">Turr</span>
                              <Input type="number" value={stat.turretDamage} onChange={(e) => handleStatChange(index, 'turretDamage', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">Taken</span>
                              <Input type="number" value={stat.damageTaken} onChange={(e) => handleStatChange(index, 'damageTaken', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">TF%</span>
                              <Input type="number" value={stat.teamfight} onChange={(e) => handleStatChange(index, 'teamfight', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">Turtle</span>
                              <Input type="number" value={stat.turtlesSlain ?? 0} onChange={(e) => handleStatChange(index, 'turtlesSlain', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5">Lord</span>
                              <Input type="number" value={stat.lordsSlain ?? 0} onChange={(e) => handleStatChange(index, 'lordsSlain', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => { setEquipmentFile(null); setDataFile(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="mr-2 h-4 w-4" /> {hasExistingStats ? 'Update Statistics' : 'Save Statistics'}</>)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
