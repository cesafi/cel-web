'use client';

import { useState, useEffect, useRef } from 'react';
import { extractValorantStatsFromImage } from '@/actions/valorant-ocr';
import { createMultipleValorantStats, getValorantStatsByGameId, deleteValorantStatsByGameId } from '@/actions/stats-valorant';
import { recalculateMatchScoresAction } from '@/actions/stats-mlbb';
import { updateGameById, getGameById } from '@/actions/games';
import { upsertGameScoresForGame, getGameScoresByGameId } from '@/actions/game-scores';
import { getGameRosterByGameId } from '@/actions/game-roster';
import { useQueryClient } from '@tanstack/react-query';
import { matchKeys } from '@/hooks/use-matches';
import { cn } from '@/lib/utils';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw, ArrowLeftRight, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAllGameCharactersWithEsport } from '@/hooks/use-game-characters';
import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { 
  uploadGameScreenshots, 
  saveExtractedStatsDraft, 
  clearExtractedStatsDraft 
} from '@/actions/stats-persistence';

interface ValorantStatsUploadProps {
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

export function ValorantStatsUpload({ gameId, matchId, team1, team2, onStatsSaved }: ValorantStatsUploadProps) {
  const queryClient = useQueryClient();
  const [isSwappingSides, setIsSwappingSides] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);

  // Manage preview URL
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setScreenshotPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setScreenshotPreviewUrl(null);
    }
  }, [uploadedFile]);
  
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

  const [previewData, setPreviewData] = useState<ValorantScreenshotData>(() => {
    const emptyPlayers = [];
    for (let i = 0; i < 5; i++) {
      emptyPlayers.push({
        playerName: team1.players[i]?.ign || `Player ${i + 1}`,
        team: 'Ally' as const,
        agentName: '',
        acs: 0,
        kda: { kills: 0, deaths: 0, assists: 0 },
        econRating: 0,
        firstBloods: 0,
        plants: 0,
        defuses: 0
      });
    }
    for (let i = 0; i < 5; i++) {
      emptyPlayers.push({
        playerName: team2.players[i]?.ign || `Player ${i + 6}`,
        team: 'Enemy' as const,
        agentName: '',
        acs: 0,
        kda: { kills: 0, deaths: 0, assists: 0 },
        econRating: 0,
        firstBloods: 0,
        plants: 0,
        defuses: 0
      });
    }

    return {
      matchResult: 'VICTORY',
      matchDuration: '',
      mapName: '',
      score: { ally: 0, enemy: 0 },
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

  const { data: gameDraftActions, isFetched: isDraftActionsFetched } = useGameDraftActions(gameId);
  const { data: globalCharacters } = useAllGameCharactersWithEsport();
  const [gameCharacters, setGameCharacters] = useState<any[]>([]);
  const [isCharactersFetched, setIsCharactersFetched] = useState(false);
  const [gameRosters, setGameRosters] = useState<any[]>([]);
  const [isRostersFetched, setIsRostersFetched] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      const res = await getGameCharactersByEsportId(2);
      if (res.success && res.data) {
        setGameCharacters(res.data);
      }
      setIsCharactersFetched(true);
    }
    fetchAgents();
  }, []);

  const STORAGE_KEY = `stats-v1-valorant-${gameId}`;

  useEffect(() => {
    if (isFetchingStats || isSaving) return;

    const draftData = {
      previewData,
      playerMapping,
      mvpIndex,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, [previewData, playerMapping, mvpIndex, isFetchingStats, isSaving, STORAGE_KEY]);

  // Restore draft from localStorage or Database
  useEffect(() => {
    if (isFetchingStats || isRestored) return;

    async function restoreDraft() {
      // 1. Try Database Draft first
      const res = await getGameById(gameId);
      if (res.success && res.data?.extracted_stats_draft) {
        const draft = res.data.extracted_stats_draft as unknown as ValorantScreenshotData;
        setPreviewData(draft);
        if (res.data.valorant_screenshot_url) setScreenshotPreviewUrl(res.data.valorant_screenshot_url);
        
        // Auto-set MVP if present in draft
        const mIndex = draft.players.findIndex(p => (p as any).is_mvp); // Check if MVP flag is in draft
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
          setIsRestored(true);
          toast.success('Unsaved draft restored');
        } catch (e) {
          console.error('Failed to restore draft:', e);
        }
      }
    }

    restoreDraft();
  }, [gameId, isFetchingStats, isRestored, STORAGE_KEY]);

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


  const getAgent = (idOrName: string | number) => {
    if (!gameCharacters.length) return undefined;
    if (typeof idOrName === 'number' || !isNaN(Number(idOrName))) {
      return gameCharacters.find(c => c.id === Number(idOrName));
    }
    const normalized = String(idOrName).toLowerCase().replace(/[^a-z0-9]/g, '');
    return gameCharacters.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
  };

  const findPickForPlayer = (playerId: string, draftActions: any[]) => {
    if (!draftActions?.length || !gameRosters?.length) return null;
    const rosterEntry = gameRosters.find((r: any) => r.player_id === playerId);
    if (!rosterEntry) return null;
    const teamPicks = draftActions
      .filter((a: any) => a.action_type === 'pick' && a.team_id === rosterEntry.team_id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    return teamPicks[rosterEntry.sort_order] || null;
  };

  useEffect(() => {
    if (hasFetched.current || !isCharactersFetched) return;

    let mounted = true;
    async function fetchExistingStats() {
      try {
        const result = await getValorantStatsByGameId(gameId);
        if (!mounted) return;

        if (result.success && result.data && result.data.length > 0) {
          const newPreviewDataPlayers: any[] = [];
          const newPlayerMapping: Record<string, string> = {};
          let mvpIdx: number | null = null;

          const team1PlayerIds = new Set(team1.players.map(p => p.id));
          const team2PlayerIds = new Set(team2.players.map(p => p.id));

          for (let i = 0; i < 10; i++) {
            const isAlly = i < 5;
            const pList = isAlly ? team1.players : team2.players;
            const defaultP = pList[i % 5];

            newPreviewDataPlayers.push({
              playerName: defaultP?.ign || `Player ${i + 1}`,
              team: isAlly ? 'Ally' : 'Enemy',
              agentName: '',
              acs: 0,
              kda: { kills: 0, deaths: 0, assists: 0 },
              econRating: 0,
              firstBloods: 0,
              plants: 0,
              defuses: 0
            });
          }

          let team1Index = 0;
          let team2Index = 5;

          result.data.forEach((stat) => {
            let slot = -1;
            if (team1PlayerIds.has(stat.player_id)) {
              slot = team1Index++;
            } else if (team2PlayerIds.has(stat.player_id)) {
              slot = team2Index++;
            }

            if (slot !== -1 && slot < 10) {
              newPlayerMapping[slot.toString()] = stat.player_id;
              if (stat.is_mvp) mvpIdx = slot;

              const char = getAgent(stat.game_character_id ?? 0) || globalCharacters?.find(c => c.id === stat.game_character_id);

              newPreviewDataPlayers[slot] = {
                playerName: stat.players?.ign || `Player ${slot + 1}`,
                team: slot < 5 ? 'Ally' : 'Enemy',
                agentName: char?.id?.toString() || '',
                acs: stat.acs ?? 0,
                kda: {
                  kills: stat.kills ?? 0,
                  deaths: stat.deaths ?? 0,
                  assists: stat.assists ?? 0
                },
                econRating: stat.econ_rating ?? 0,
                first_bloods: stat.first_bloods ?? 0,
                plants: stat.plants ?? 0,
                defuses: stat.defuses ?? 0
              };
            }
          });

          setPlayerMapping(newPlayerMapping);
          setMvpIndex(mvpIdx);
          setPreviewData(prev => ({ ...prev, players: newPreviewDataPlayers }));
          setHasExistingStats(true);
        }

        const [gameResult, scoresResult] = await Promise.all([
          getGameById(gameId),
          getGameScoresByGameId(gameId),
        ]);
        if (!mounted) return;

        let fetchedDuration = '';
        let fetchedAllyScore = 0;
        let fetchedEnemyScore = 0;

        if (gameResult?.success && gameResult.data) {
          const dur = (gameResult.data as any).duration;
          if (dur && dur !== '00:00:00') {
            const parts = dur.split(':');
            if (parts.length === 3 && parts[0] === '00') {
              fetchedDuration = `${parts[1]}:${parts[2]}`;
            } else if (parts.length === 3) {
              fetchedDuration = `${parts[0]}:${parts[1]}`;
            } else {
              fetchedDuration = dur;
            }
          }
        }

        if (scoresResult?.success && scoresResult.data && scoresResult.data.length >= 2) {
          const s1 = scoresResult.data.find((s: any) => s.match_participant_id === team1.matchParticipantId);
          const s2 = scoresResult.data.find((s: any) => s.match_participant_id === team2.matchParticipantId);
          fetchedAllyScore = s1?.score ?? 0;
          fetchedEnemyScore = s2?.score ?? 0;
        }

        if (fetchedDuration || fetchedAllyScore > 0 || fetchedEnemyScore > 0) {
          setPreviewData(prev => ({
            ...prev,
            matchDuration: fetchedDuration || prev.matchDuration,
            score: {
              ally: fetchedAllyScore || prev.score.ally,
              enemy: fetchedEnemyScore || prev.score.enemy,
            },
          }));
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
  }, [gameId, isCharactersFetched]);

  useEffect(() => {
    if (!hasFetched.current || hasExistingStats) return;
    if (!isDraftActionsFetched || !isCharactersFetched || !isRostersFetched) return;
    if (!gameDraftActions?.length || !gameRosters?.length) return;

    setPreviewData(prev => {
      const newPlayers = [...prev.players];
      for (let i = 0; i < 10; i++) {
        const pId = playerMapping[i.toString()];
        if (pId) {
          const pick = findPickForPlayer(pId, gameDraftActions);
          if (pick?.hero_id) {
            newPlayers[i] = { ...newPlayers[i], agentName: pick.hero_id.toString() };
          } else if (pick?.hero_name) {
            const matchedAgent = getAgent(pick.hero_name);
            if (matchedAgent) {
              newPlayers[i] = { ...newPlayers[i], agentName: matchedAgent.id.toString() };
            }
          }
        }
      }
      return { ...prev, players: newPlayers };
    });
  }, [isDraftActionsFetched, isCharactersFetched, isRostersFetched, hasExistingStats, gameDraftActions, gameRosters, playerMapping]);

  useEffect(() => {
    if (!isRostersFetched || hasExistingStats || !gameRosters.length) return;

    setPlayerMapping(prev => {
      const newMapping = { ...prev };
      gameRosters.forEach(r => {
        const isTeam1 = r.team_id === team1.id;
        const slot = isTeam1 ? r.sort_order : r.sort_order + 5;
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
        const isTeam1 = r.team_id === team1.id;
        const slot = isTeam1 ? r.sort_order : r.sort_order + 5;
        if (slot >= 0 && slot < 10) {
          const allPlayers = [...team1.players, ...team2.players];
          const player = allPlayers.find(p => p.id === r.player_id);
          if (player && (newPlayers[slot].playerName !== player.ign || newPlayers[slot].team !== (isTeam1 ? 'Ally' : 'Enemy'))) {
            newPlayers[slot] = {
              ...newPlayers[slot],
              playerName: player.ign || `Player ${slot + 1}`,
              team: isTeam1 ? 'Ally' : 'Enemy'
            };
            changed = true;
          }
        }
      });
      return changed ? { ...prev, players: newPlayers } : prev;
    });
  }, [gameRosters, isRostersFetched, hasExistingStats, team1.id, team2.id, team1.players, team2.players]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFile(file);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const result = await extractValorantStatsFromImage(formData);
      if (result.success && result.data) {
        const convertedData = { ...result.data };
        convertedData.players = convertedData.players.map(p => {
          if (p.agentName) {
            const char = getAgent(p.agentName);
            if (char) {
              return { ...p, agentName: char.id.toString() };
            }
          }
          return p;
        });

        const newMapping: Record<string, string> = { ...playerMapping };
        const allPlayers = [...team1.players, ...team2.players];

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
        });

        if (gameDraftActions && gameRosters?.length) {
          convertedData.players.forEach((stat, index) => {
            const pId = newMapping[index.toString()];
            if (pId) {
              const pick = findPickForPlayer(pId, gameDraftActions);
              if (pick?.hero_id) {
                stat.agentName = pick.hero_id.toString();
              } else if (pick?.hero_name) {
                const matchedAgent = getAgent(pick.hero_name);
                if (matchedAgent) {
                  stat.agentName = matchedAgent.id.toString();
                }
              }
            }
          });
        }

        setPlayerMapping(newMapping);
        setPreviewData(convertedData);

        // --- PERSISTENCE START ---
        // 1. Upload screenshot to Cloudinary
        const uploadRes = await uploadGameScreenshots(gameId, {
          valorantScreenshot: file
        });
        
        if (uploadRes.success && uploadRes.data?.valorant_screenshot_url) {
          setScreenshotPreviewUrl(uploadRes.data.valorant_screenshot_url);
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

  const handleSwapSides = async () => {
    setIsSwappingSides(true);
    try {
      const gameRes = await getGameById(gameId);
      if (!gameRes.success || !gameRes.data) {
        toast.error('Failed to fetch current game state');
        return;
      }

      const sideSelection = gameRes.data.side_selection;
      const coinTossWinnerId = gameRes.data.coin_toss_winner;

      let newSide: 'blue' | 'red' = 'blue';
      if (sideSelection === 'blue') {
        newSide = 'red';
      } else if (sideSelection === 'red') {
        newSide = 'blue';
      } else if (coinTossWinnerId) {
        newSide = 'red';
      } else {
        newSide = 'red';
      }

      const res = await updateGameById({ id: gameId, side_selection: newSide });
      if (res.success) {
        toast.success(`Game sides officially swapped to ${newSide.toUpperCase()}`);
        setPreviewData(prev => ({
          ...prev,
          score: {
            ally: prev.score.enemy,
            enemy: prev.score.ally
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
      for (let i = 0; i < 10; i++) {
        const pId = playerMapping[i.toString()];
        if (pId && pId !== 'skip') {
          const pick = findPickForPlayer(pId, freshDraftActions);
          if (pick?.hero_id) {
            newPlayers[i] = { ...newPlayers[i], agentName: pick.hero_id.toString() };
          } else if (pick?.hero_name) {
            const matchedAgent = getAgent(pick.hero_name);
            if (matchedAgent) {
              newPlayers[i] = { ...newPlayers[i], agentName: matchedAgent.id.toString() };
            }
          }
        }
      }
      return { ...prevData, players: newPlayers };
    });
    toast.success('Agents mapped from draft');
  };

  const handleReset = () => {
    setPreviewData(() => {
      return {
        matchResult: 'VICTORY',
        matchDuration: '',
        mapName: '',
        score: { ally: 0, enemy: 0 },
        players: Array.from({ length: 10 }).map((_, i) => ({
          playerName: '',
          team: i < 5 ? 'Ally' : 'Enemy',
          agentName: '',
          acs: 0,
          kda: { kills: 0, deaths: 0, assists: 0 },
          econRating: 0,
          firstBloods: 0,
          plants: 0,
          defuses: 0
        }))
      };
    });
    setMvpIndex(null);
    setUploadedFile(null);
    setScreenshotPreviewUrl(null);
    toast.success('Stats reset');
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
    } else if (field === 'acs') {
      player.acs = Number(value) || 0;
    } else if (field === 'agentName') {
      player.agentName = value;
    } else if (field === 'econRating') {
      player.econRating = Number(value) || 0;
    } else if (field === 'firstBloods') {
      player.firstBloods = Number(value) || 0;
    } else if (field === 'plants') {
      player.plants = Number(value) || 0;
    } else if (field === 'defuses') {
      player.defuses = Number(value) || 0;
    }

    newPlayers[index] = player;
    setPreviewData({ ...previewData, players: newPlayers });
    if (errors[`agent-${index}`]) {
      setErrors(prev => {
        const { [`agent-${index}`]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateStats = () => {
    const newErrors: Record<string, boolean> = {};

    if (!previewData.matchDuration || previewData.matchDuration.trim() === '') {
      newErrors.matchDuration = true;
    }

    if (previewData.score.ally === 0 && previewData.score.enemy === 0) {
      newErrors.score = true;
    }

    if (mvpIndex === null) {
      newErrors.mvp = true;
    }

    previewData.players.forEach((p, i) => {
      if (!p.agentName || p.agentName === '') {
        newErrors[`agent-${i}`] = true;
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

          const matchingChar = getAgent(stat.agentName);

          return {
            game_id: gameId,
            player_id: playerId,
            team_id: teamId,
            game_character_id: matchingChar ? matchingChar.id : null,
            kills: stat.kda.kills,
            deaths: stat.kda.deaths,
            assists: stat.kda.assists,
            acs: stat.acs,
            econ_rating: stat.econRating,
            first_bloods: stat.firstBloods,
            plants: stat.plants,
            defuses: stat.defuses,
            is_mvp: index === mvpIndex,
          };
        })
        .filter((stat): stat is NonNullable<typeof stat> => stat !== null);

      if (statsToSave.length === 0) {
        toast.error('No players mapped. Please map players before saving.');
        setIsSaving(false);
        return;
      }

      await deleteValorantStatsByGameId(gameId);

      const result = await createMultipleValorantStats(statsToSave);

      if (previewData.matchDuration) {
        let durationToSave = previewData.matchDuration;
        if (durationToSave.split(':').length === 2) {
          durationToSave = `${durationToSave}:00`;
        }
        await updateGameById({ id: gameId, duration: durationToSave });
      }

      if (previewData.score.ally > 0 || previewData.score.enemy > 0) {
        await upsertGameScoresForGame(gameId, [
          { game_id: gameId, match_participant_id: team1.matchParticipantId, score: previewData.score.ally },
          { game_id: gameId, match_participant_id: team2.matchParticipantId, score: previewData.score.enemy },
        ]);
      }

      if (result.success) {
        localStorage.removeItem(STORAGE_KEY);
        toast.success(`${hasExistingStats ? 'Updated' : 'Saved'} stats for ${statsToSave.length} players`);
        setHasExistingStats(true);
        await updateGameById({ id: gameId, status: 'completed' });
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

  const getTeamForPlayer = (playerId: string) => {
    if (team1.players.some(p => p.id === playerId)) return team1;
    if (team2.players.some(p => p.id === playerId)) return team2;
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Screenshot</h3>
              <p className="text-sm text-muted-foreground">
                Upload the end-game scoreboard to automatically extract stats
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload-valorant"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading}>
                <label htmlFor="image-upload-valorant" className="cursor-pointer flex items-center h-full">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Select Image'
                  )}
                </label>
              </Button>
            </div>
          </div>
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
                  Copy Agents from Draft
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setPreviewData({
                    matchResult: 'VICTORY',
                    matchDuration: '',
                    mapName: '',
                    score: { ally: 0, enemy: 0 },
                    players: Array.from({ length: 10 }).map((_, i) => ({
                      playerName: '',
                      team: i < 5 ? 'Ally' : 'Enemy',
                      agentName: '',
                      acs: 0,
                      kda: { kills: 0, deaths: 0, assists: 0 },
                      econRating: 0,
                      firstBloods: 0,
                      plants: 0,
                      defuses: 0
                    }))
                  });
                  setMvpIndex(null);
                  setErrors({});
                  localStorage.removeItem(STORAGE_KEY);
                  toast.success('Stats reset');
                }}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Rounds Won & Duration Header */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              {/* Team 1 */}
              <div className="flex items-center gap-3">
                {team1.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={team1.logoUrl} alt={team1.abbreviation} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {team1.abbreviation.substring(0, 2)}
                  </div>
                )}
                <span className="text-sm font-semibold">{team1.abbreviation}</span>
                <Input
                  type="number"
                  value={previewData.score.ally}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPreviewData({ ...previewData, score: { ...previewData.score, ally: val } });
                    if (errors.score && (val > 0 || previewData.score.enemy > 0)) {
                      setErrors(prev => { const { score: _, ...rest } = prev; return rest; });
                    }
                  }}
                  className={`h-8 w-14 text-center font-mono font-bold text-lg ${errors.score ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  min={0}
                />
              </div>

              {/* Duration (center) */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duration</span>
                <Input
                  type="text"
                  value={previewData.matchDuration || ''}
                  onChange={(e) => {
                    setPreviewData({ ...previewData, matchDuration: e.target.value });
                    if (errors.matchDuration) {
                      setErrors(prev => { const { matchDuration: _, ...rest } = prev; return rest; });
                    }
                  }}
                  className={`h-8 w-20 text-center font-mono ${errors.matchDuration ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  placeholder="MM:SS"
                />
              </div>

              {/* Team 2 */}
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={previewData.score.enemy}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPreviewData({ ...previewData, score: { ...previewData.score, enemy: val } });
                    if (errors.score && (val > 0 || previewData.score.ally > 0)) {
                      setErrors(prev => { const { score: _, ...rest } = prev; return rest; });
                    }
                  }}
                  className={`h-8 w-14 text-center font-mono font-bold text-lg ${errors.score ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  min={0}
                />
                <span className="text-sm font-semibold">{team2.abbreviation}</span>
                {team2.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={team2.logoUrl} alt={team2.abbreviation} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {team2.abbreviation.substring(0, 2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Player & Team</TableHead>
                  <TableHead className="w-[120px]">Agent</TableHead>
                  <TableHead className="w-[60px] text-center">MVP</TableHead>
                  <TableHead>ACS</TableHead>
                  <TableHead className="w-[160px] text-center">K / D / A</TableHead>
                  <TableHead>Econ</TableHead>
                  <TableHead>FB</TableHead>
                  <TableHead>PL</TableHead>
                  <TableHead>DF</TableHead>
                  <TableHead className="w-[200px]">Map to Player</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.players.map((stat, index) => {
                  const mappedPlayerId = playerMapping[index.toString()];
                  const team = mappedPlayerId && mappedPlayerId !== 'skip' ? getTeamForPlayer(mappedPlayerId) : null;

                  return (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team?.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={team.logoUrl} alt={team.abbreviation} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                              {team ? team.abbreviation.substring(0, 2) : (stat.team === 'Ally' ? team1.abbreviation.substring(0, 2) : team2.abbreviation.substring(0, 2))}
                            </div>
                          )}
                          <span>{stat.playerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={stat.agentName}
                          onValueChange={(value) => handleStatChange(index, 'agentName', value)}
                        >
                          <SelectTrigger className={`h-8 w-[120px] ${errors[`agent-${index}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}>
                            <SelectValue placeholder="Agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {gameCharacters.map(char => (
                              <SelectItem key={char.id} value={char.id.toString()}>{char.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={mvpIndex === index}
                            onCheckedChange={() => {
                              setMvpIndex(index);
                              if (errors.mvp) {
                                setErrors(prev => { const { mvp: _, ...rest } = prev; return rest; });
                              }
                            }}
                            className={`border-muted-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background ${errors.mvp ? 'border-destructive ring-1 ring-destructive' : ''}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.acs}
                          onChange={(e) => handleStatChange(index, 'acs', e.target.value)}
                          className="h-8 w-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={stat.kda.kills}
                            onChange={(e) => handleStatChange(index, 'k', e.target.value)}
                            className="h-8 w-[50px] px-2 text-center"
                            placeholder="K"
                          />
                          <span className="text-muted-foreground">/</span>
                          <Input
                            type="number"
                            value={stat.kda.deaths}
                            onChange={(e) => handleStatChange(index, 'd', e.target.value)}
                            className="h-8 w-[50px] px-2 text-center"
                            placeholder="D"
                          />
                          <span className="text-muted-foreground">/</span>
                          <Input
                            type="number"
                            value={stat.kda.assists}
                            onChange={(e) => handleStatChange(index, 'a', e.target.value)}
                            className="h-8 w-[50px] px-2 text-center"
                            placeholder="A"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.econRating || 0}
                          onChange={(e) => handleStatChange(index, 'econRating', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.firstBloods || 0}
                          onChange={(e) => handleStatChange(index, 'firstBloods', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.plants || 0}
                          onChange={(e) => handleStatChange(index, 'plants', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.defuses || 0}
                          onChange={(e) => handleStatChange(index, 'defuses', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center"
                        />
                      </TableCell>
                      <TableCell>
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
                              const pick = findPickForPlayer(value, gameDraftActions);
                              if (pick?.hero_id) {
                                setPreviewData(prevData => {
                                  if (!prevData) return prevData;
                                  const newPlayers = [...prevData.players];
                                  newPlayers[index] = { ...newPlayers[index], agentName: pick.hero_id!.toString() };
                                  return { ...prevData, players: newPlayers };
                                });
                              } else if (pick?.hero_name) {
                                const matchedAgent = getAgent(pick.hero_name);
                                if (matchedAgent) {
                                  setPreviewData(prevData => {
                                    if (!prevData) return prevData;
                                    const newPlayers = [...prevData.players];
                                    newPlayers[index] = { ...newPlayers[index], agentName: matchedAgent.id.toString() };
                                    return { ...prevData, players: newPlayers };
                                  });
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger className={errors[`player-${index}`] ? 'border-destructive ring-1 ring-destructive' : ''}>
                            <SelectValue placeholder="Select player..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">-- Skip --</SelectItem>
                            {/* Group by Team */}
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
                        {team ? (
                          <div className="mt-1 text-[10px] text-muted-foreground font-medium">Mapped to • {team.abbreviation}</div>
                        ) : mappedPlayerId === 'skip' ? (
                          <div className="mt-1 text-[10px] text-muted-foreground font-medium text-amber-500">Row Skipped</div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
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

          {screenshotPreviewUrl && (
            <div className="mt-8 pt-8 border-t border-dashed w-full text-center">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Reference View</h4>
                <p className="text-[10px] text-muted-foreground lowercase italic">Click image to pop out</p>
              </div>
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="group relative cursor-zoom-in rounded-lg border bg-muted/50 p-1 transition-all hover:ring-2 hover:ring-primary overflow-hidden w-64 h-40">
                      <img src={screenshotPreviewUrl} alt="Valorant Screenshot" className="h-full w-full object-cover rounded shadow-inner" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[10px] font-bold text-white text-center opacity-0 transition-opacity group-hover:opacity-100 uppercase">
                        Scoreboard View
                      </div>
                      <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100 border border-white/20">
                        <ZoomIn className="h-3 w-3" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 border-none bg-transparent shadow-none">
                    <DialogTitle asChild>
                      <VisuallyHidden>Valorant Screenshot Preview</VisuallyHidden>
                    </DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 flex-col gap-4">
                        <img src={screenshotPreviewUrl} alt="Valorant Screenshot" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" />
                        <div className="px-4 py-1.5 bg-black/80 backdrop-blur rounded-full text-white text-sm font-bold border border-white/20 shadow-xl pointer-events-none uppercase tracking-widest">
                          VALORANT MATCH SUMMARY
                        </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
