'use client';

import { useState, useEffect, useRef } from 'react';
import { extractMlbbStatsFromImage } from '@/actions/mlbb-ocr';
import { createMultipleMlbbStats, getMlbbStatsByGameId, deleteMlbbStatsByGameId, recalculateMatchScoresAction } from '@/actions/stats-mlbb';
import { upsertGameScoresForGame, getGameScoresByGameId } from '@/actions/game-scores';
import { updateGameById, getGameById } from '@/actions/games';
import { getGameRosterByGameId } from '@/actions/game-roster';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw, Coins, FileImage, ShieldAlert, Swords, ArrowLeftRight, Star, Castle, Target, Users, Turtle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { useAllGameCharactersWithEsport } from '@/hooks/use-game-characters';

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
  onStatsSaved?: () => void;
}

export function MlbbStatsUpload({ gameId, matchId, team1, team2, onStatsSaved }: MlbbStatsUploadProps) {
  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {};
    const team1Picks = team1.players.slice(0, 5);
    const team2Picks = team2.players.slice(0, 5);

    for (let i = 0; i < 5; i++) {
      if (team1Picks[i]) initialMapping[i.toString()] = team1Picks[i].id;
      if (team2Picks[i]) initialMapping[(i + 5).toString()] = team2Picks[i].id;
    }
    return initialMapping;
  });

  const [previewData, setPreviewData] = useState<MlbbScreenshotData>(() => {
    const emptyPlayers = [];
    for (let i = 0; i < 5; i++) {
      emptyPlayers.push({
        playerName: team1.players[i]?.ign || `Player ${i + 1}`,
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
        playerName: team2.players[i]?.ign || `Player ${i + 6}`,
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
  const [playerSwapSlot, setPlayerSwapSlot] = useState<number | null>(null);

  const MLBB_DEFAULT_ROLES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];
  const [slotRoles, setSlotRoles] = useState<string[]>([
    ...MLBB_DEFAULT_ROLES, ...MLBB_DEFAULT_ROLES
  ]);

  const { data: gameDraftActions, isFetched: isDraftActionsFetched } = useGameDraftActions(gameId);
  const { data: gameCharacters, isFetched: isCharactersFetched } = useAllGameCharactersWithEsport();
  const [heroMapping, setHeroMapping] = useState<Record<string, string>>({});

  const [equipmentFile, setEquipmentFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const hasFetched = useRef(false);
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
          const s1 = scoresResult.data.find((s: any) => s.match_participant_id === team1.matchParticipantId);
          const s2 = scoresResult.data.find((s: any) => s.match_participant_id === team2.matchParticipantId);
          if (s1 !== undefined || s2 !== undefined) {
            setPreviewData(prev => ({
              ...prev,
              score: {
                blue: s1?.score ?? 0,
                red: s2?.score ?? 0,
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

          const team1PlayerIds = new Set(team1.players.map(p => p.id));
          const team2PlayerIds = new Set(team2.players.map(p => p.id));

          // Fill default empty slots
          for (let i = 0; i < 10; i++) {
            const isBlue = i < 5;
            const pList = isBlue ? team1.players : team2.players;
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

          let team1Index = 0;
          let team2Index = 5;

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
            } else if (team1PlayerIds.has(stat.player_id)) {
              slot = team1Index++;
            } else if (team2PlayerIds.has(stat.player_id)) {
              slot = team2Index++;
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
                turtlesSlain: stat.turtle_slain ?? 0,
                lordsSlain: stat.lord_slain ?? 0
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
            const isTeam1 = r.team_id === team1.id;
            const slotIdx = isTeam1 ? r.sort_order : r.sort_order + 5;
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
  }, [isDraftActionsFetched, isCharactersFetched, isRostersFetched, hasExistingStats]);

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
        toast.success('Stats extracted successfully');
      } else {
        toast.error(result.error || 'Failed to extract stats');
      }
    } catch (error) {
      toast.error('An error occurred during extraction');
    } finally {
      setIsUploading(false);
    }
  };

  // (autoMapPlayers removed since it's now integrated in handleAnalyze)

  const handleCopyFromDraft = async () => {
    // Fetch fresh draft actions and rosters directly to avoid stale cached data
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

    // Update local state so future calls also have fresh data
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

  // Handle manual stat edits
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
      // Remove commas if present
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

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out players who aren't mapped
      const statsToSave = previewData.players
        .map((stat, index) => {
          const playerId = playerMapping[index.toString()];
          if (!playerId || playerId === 'skip') return null;

          // Determine team ID
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
            order: index < 5 ? index + 1 : index + 1 // 1-5 for Blue, 6-10 for Red
          };
        })
        .filter((stat): stat is NonNullable<typeof stat> => stat !== null);

      if (statsToSave.length === 0) {
        toast.error('No players mapped. Please map players before saving.');
        setIsSaving(false);
        return;
      }

      // First delete existing stats for this game to avoid duplicate keys/errors when replacing
      await deleteMlbbStatsByGameId(gameId);

      const result = await createMultipleMlbbStats(statsToSave);

      // Build a single game update payload with duration + status
      const gameUpdate: any = { id: gameId, status: 'completed' as const };
      if (previewData.duration) {
        let durationToSave = previewData.duration;
        if (durationToSave.split(':').length === 2) {
          durationToSave = `${durationToSave}:00`;
        }
        gameUpdate.duration = durationToSave;
      }

      // Save game scores (Blue/Red) which determine match winner
      if (previewData.score.blue > 0 || previewData.score.red > 0) {
        await upsertGameScoresForGame(gameId, [
          { game_id: gameId, match_participant_id: team1.matchParticipantId, score: previewData.score.blue },
          { game_id: gameId, match_participant_id: team2.matchParticipantId, score: previewData.score.red },
        ]);
      }

      if (result.success) {
        toast.success(`${hasExistingStats ? 'Updated' : 'Saved'} stats for ${statsToSave.length} players`);
        setHasExistingStats(true);
        // Auto-transition game status to completed (combined with duration save)
        await updateGameById(gameUpdate);
        // Recalculate match scores and update description
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

  const getTeamForPlayer = (playerId: string) => {
    if (team1.players.some(p => p.id === playerId)) return team1;
    if (team2.players.some(p => p.id === playerId)) return team2;
    return null;
  };

  // Handle swap of two player positions within the same team side
  const handleSwapPlayers = (slotA: number, slotB: number) => {
    // Swap previewData players
    const newPlayers = [...previewData.players];
    [newPlayers[slotA], newPlayers[slotB]] = [newPlayers[slotB], newPlayers[slotA]];
    setPreviewData({ ...previewData, players: newPlayers });

    // Swap playerMapping
    const newMapping = { ...playerMapping };
    const tempPlayer = newMapping[slotA.toString()];
    newMapping[slotA.toString()] = newMapping[slotB.toString()];
    newMapping[slotB.toString()] = tempPlayer;
    setPlayerMapping(newMapping);

    // Swap heroMapping
    const newHeroMapping = { ...heroMapping };
    const tempHero = newHeroMapping[slotA.toString()];
    newHeroMapping[slotA.toString()] = newHeroMapping[slotB.toString()];
    newHeroMapping[slotB.toString()] = tempHero;
    setHeroMapping(newHeroMapping);

    // Swap roles (roles follow the player, not the slot)
    const newRoles = [...slotRoles];
    [newRoles[slotA], newRoles[slotB]] = [newRoles[slotB], newRoles[slotA]];
    setSlotRoles(newRoles);

    // Update MVP index if affected
    if (mvpIndex === slotA) setMvpIndex(slotB);
    else if (mvpIndex === slotB) setMvpIndex(slotA);

    setPlayerSwapSlot(null);
    toast.success('Players swapped');
  };

  return (
    <div className="space-y-6">
      {/* ALWAYS SHOW UPLOAD */}
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
              {/* Equipment Upload */}
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

              {/* Data Upload */}
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
        </CardContent>
      </Card>

      {/* ALWAYS SHOW TABLE */}
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
                <Button size="sm" variant="secondary" onClick={handleCopyFromDraft}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Copy from Draft
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setPreviewData(() => ({
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
                  }));
                  setEquipmentFile(null);
                  setDataFile(null);
                  setMvpIndex(null);
                  setHeroMapping({});
                }}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Blue/Red Score Header */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              {/* Team 1 (Blue) */}
              <div
                className={`flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 transition-colors ${previewData.score.blue > previewData.score.red ? 'bg-green-500/10 ring-1 ring-green-500/40' : 'hover:bg-muted/50'
                  }`}
                onClick={() => setPreviewData(prev => ({ ...prev, score: { blue: 1, red: 0 } }))}
              >
                <Checkbox
                  checked={previewData.score.blue > previewData.score.red}
                  onCheckedChange={() => setPreviewData(prev => ({ ...prev, score: { blue: 1, red: 0 } }))}
                  className="border-muted-foreground data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                {team1.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={team1.logoUrl} alt={team1.abbreviation} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {team1.abbreviation.substring(0, 2)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{team1.abbreviation}</span>
                  <span className="text-[10px] text-blue-500 font-medium">Blue Side</span>
                </div>
                {previewData.score.blue > previewData.score.red && (
                  <span className="text-xs font-bold text-green-500 uppercase">Winner</span>
                )}
              </div>

              {/* Duration (center) */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duration</span>
                <Input
                  type="text"
                  value={previewData.duration || ''}
                  onChange={(e) => setPreviewData({ ...previewData, duration: e.target.value })}
                  className="h-8 w-20 text-center font-mono"
                  placeholder="MM:SS"
                />
              </div>

              {/* Team 2 (Red) */}
              <div
                className={`flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 transition-colors ${previewData.score.red > previewData.score.blue ? 'bg-green-500/10 ring-1 ring-green-500/40' : 'hover:bg-muted/50'
                  }`}
                onClick={() => setPreviewData(prev => ({ ...prev, score: { blue: 0, red: 1 } }))}
              >
                {previewData.score.red > previewData.score.blue && (
                  <span className="text-xs font-bold text-green-500 uppercase">Winner</span>
                )}
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold">{team2.abbreviation}</span>
                  <span className="text-[10px] text-red-500 font-medium">Red Side</span>
                </div>
                {team2.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={team2.logoUrl} alt={team2.abbreviation} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-600">
                    {team2.abbreviation.substring(0, 2)}
                  </div>
                )}
                <Checkbox
                  checked={previewData.score.red > previewData.score.blue}
                  onCheckedChange={() => setPreviewData(prev => ({ ...prev, score: { blue: 0, red: 1 } }))}
                  className="border-muted-foreground data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Blue (Left) vs Red (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Blue Side */}
            {[
              { side: 'Blue' as const, team: team1, startIdx: 0, themeColor: 'blue' },
              { side: 'Red' as const, team: team2, startIdx: 5, themeColor: 'red' },
            ].map(({ side, team, startIdx, themeColor }) => (
              <div key={side} className="rounded-xl border bg-card overflow-hidden">
                {/* Team Header */}
                <div className={`p-3 border-b flex items-center gap-3 ${themeColor === 'blue' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="w-8 h-8 rounded-full bg-background border overflow-hidden flex items-center justify-center shrink-0">
                    {team.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
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

                {/* Player Rows */}
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const index = startIdx + i;
                    const stat = previewData.players[index];
                    const mappedPlayerId = playerMapping[index.toString()];
                    const mappedTeam = mappedPlayerId && mappedPlayerId !== 'skip' ? getTeamForPlayer(mappedPlayerId) : null;

                    return (
                      <div key={i} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
                        {/* Row 1: Role, Player Mapping, Hero, MVP, Swap */}
                        <div className="flex items-center gap-2">
                          {/* Role Badge */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {slotRoles[index]}
                          </span>

                          {/* Player Mapping */}
                          <Select
                            value={mappedPlayerId || ''}
                            onValueChange={(value) => {
                              setPlayerMapping(prev => ({ ...prev, [index.toString()]: value }));
                              if (value !== 'skip' && gameRosters?.length) {
                                // Update role from game_rosters for the mapped player
                                const rosterEntry = gameRosters.find((r: any) => r.player_id === value);
                                if (rosterEntry?.player_role) {
                                  setSlotRoles(prev => {
                                    const updated = [...prev];
                                    updated[index] = rosterEntry.player_role;
                                    return updated;
                                  });
                                }

                                // Update hero from draft
                                if (gameDraftActions) {
                                  const pick = findPickForPlayer(value, gameDraftActions);
                                  if (pick?.hero_name) {
                                    const matchingChar = gameCharacters?.find(c => c.name.toLowerCase() === pick.hero_name?.toLowerCase());
                                    if (matchingChar) {
                                      setHeroMapping(prev => ({ ...prev, [index.toString()]: matchingChar.id.toString() }));
                                    }
                                    setPreviewData(prevData => {
                                      const newPlayers = [...prevData.players];
                                      newPlayers[index] = { ...newPlayers[index], heroName: pick.hero_name! };
                                      return { ...prevData, players: newPlayers };
                                    });
                                  }
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 flex-1 text-xs">
                              <SelectValue placeholder="Select player..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">-- Skip --</SelectItem>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {team1.abbreviation}
                              </div>
                              {team1.players.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>
                              ))}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {team2.abbreviation}
                              </div>
                              {team2.players.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.ign}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Hero Select */}
                          <Select
                            value={heroMapping[index.toString()] || ''}
                            onValueChange={(value) => {
                              setHeroMapping(prev => ({ ...prev, [index.toString()]: value }));
                              const char = gameCharacters?.find(c => c.id.toString() === value);
                              if (char) {
                                handleStatChange(index, 'heroName', char.name);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                              <SelectValue placeholder="Hero" />
                            </SelectTrigger>
                            <SelectContent>
                              {gameCharacters?.map(char => (
                                <SelectItem key={char.id} value={char.id.toString()}>{char.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* MVP Checkbox */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Checkbox
                              checked={mvpIndex === index}
                              onCheckedChange={() => {
                                setMvpIndex(index);
                                const mvpTeam = index < 5 ? 'Blue' : 'Red';
                                setPreviewData(prev => ({
                                  ...prev,
                                  score: {
                                    blue: mvpTeam === 'Blue' ? 1 : 0,
                                    red: mvpTeam === 'Red' ? 1 : 0,
                                  },
                                }));
                              }}
                              className="border-muted-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
                            />
                            <span className="text-[10px] text-muted-foreground">MVP</span>
                          </div>

                          {/* Swap Button */}
                          {playerSwapSlot === null ? (
                            <button
                              onClick={() => setPlayerSwapSlot(index)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                }`}
                              title="Swap position"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          ) : playerSwapSlot === index ? (
                            <button
                              onClick={() => setPlayerSwapSlot(null)}
                              className="text-[10px] font-semibold text-muted-foreground shrink-0 hover:text-foreground"
                            >
                              Cancel
                            </button>
                          ) : (
                            // Only show "Swap Here" for slots on the same team side
                            playerSwapSlot >= startIdx && playerSwapSlot < startIdx + 5 ? (
                              <button
                                onClick={() => handleSwapPlayers(playerSwapSlot, index)}
                                className={`text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded transition-colors ${themeColor === 'blue' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                  }`}
                              >
                                Swap Here
                              </button>
                            ) : (
                              <div className="w-6 shrink-0" /> // Placeholder when swap is active on other side
                            )
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="space-y-1.5">
                          {/* KDA + Gold + Rating */}
                          <div className="flex items-end gap-2">
                            <div className="flex-shrink-0">
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">K / D / A</span>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Input type="number" value={stat.kda.kills} onChange={(e) => handleStatChange(index, 'k', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" placeholder="K" />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input type="number" value={stat.kda.deaths} onChange={(e) => handleStatChange(index, 'd', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" placeholder="D" />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input type="number" value={stat.kda.assists} onChange={(e) => handleStatChange(index, 'a', e.target.value)} className="h-7 w-[42px] px-1 text-center text-xs" placeholder="A" />
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

                          {/* Advanced Stats Row */}
                          <div className="grid grid-cols-7 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Swords className="h-2.5 w-2.5 text-red-500" /> Dmg</span>
                              <Input type="number" value={stat.damageDealt} onChange={(e) => handleStatChange(index, 'damageDealt', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Castle className="h-2.5 w-2.5 text-orange-400" /> Turr</span>
                              <Input type="number" value={stat.turretDamage} onChange={(e) => handleStatChange(index, 'turretDamage', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><ShieldAlert className="h-2.5 w-2.5 text-blue-400" /> Taken</span>
                              <Input type="number" value={stat.damageTaken} onChange={(e) => handleStatChange(index, 'damageTaken', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Users className="h-2.5 w-2.5 text-purple-400" /> TF%</span>
                              <Input type="number" value={stat.teamfight} onChange={(e) => handleStatChange(index, 'teamfight', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Turtle className="h-2.5 w-2.5 text-teal-400" /> Turtle</span>
                              <Input type="number" value={stat.turtlesSlain ?? 0} onChange={(e) => handleStatChange(index, 'turtlesSlain', e.target.value)} className="h-7 w-full text-xs mt-0.5" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-0.5"><Crown className="h-2.5 w-2.5 text-yellow-400" /> Lord</span>
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setEquipmentFile(null);
              setDataFile(null);
            }}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasExistingStats ? 'Update Statistics' : 'Save Statistics'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
