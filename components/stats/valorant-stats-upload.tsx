'use client';

import { useState, useEffect, useRef } from 'react';
import { extractValorantStatsFromImage } from '@/actions/valorant-ocr';
import { createMultipleValorantStats, getValorantStatsByGameId, deleteValorantStatsByGameId } from '@/actions/stats-valorant';
import { updateGameById, getGameById } from '@/actions/games';
import { upsertGameScoresForGame, getGameScoresByGameId } from '@/actions/game-scores';
import { getGameRosterByGameId } from '@/actions/game-roster';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { useAllGameCharactersWithEsport } from '@/hooks/use-game-characters';
import { getGameCharactersByEsportId } from '@/actions/game-characters';

interface ValorantStatsUploadProps {
  gameId: number;
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

export function ValorantStatsUpload({ gameId, team1, team2, onStatsSaved }: ValorantStatsUploadProps) {
  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {};
    // Map first 5 players from each team to the initial 10 rows
    const team1Picks = team1.players.slice(0, 5);
    const team2Picks = team2.players.slice(0, 5);

    // Rows 0-4 are Team 1, Rows 5-9 are Team 2
    for (let i = 0; i < 5; i++) {
      if (team1Picks[i]) initialMapping[i.toString()] = team1Picks[i].id;
      if (team2Picks[i]) initialMapping[(i + 5).toString()] = team2Picks[i].id;
    }
    return initialMapping;
  });

  const [previewData, setPreviewData] = useState<ValorantScreenshotData>(() => {
    // Exactly 10 empty rows
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

  const { data: gameDraftActions, isFetched: isDraftActionsFetched } = useGameDraftActions(gameId);
  const { data: globalCharacters } = useAllGameCharactersWithEsport();
  const [gameCharacters, setGameCharacters] = useState<any[]>([]);
  const [isCharactersFetched, setIsCharactersFetched] = useState(false);
  const [gameRosters, setGameRosters] = useState<any[]>([]);
  const [isRostersFetched, setIsRostersFetched] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      const res = await getGameCharactersByEsportId(2); // ES_ID_VALORANT = 2
      if (res.success && res.data) {
        setGameCharacters(res.data);
      }
      setIsCharactersFetched(true);
    }
    fetchAgents();
  }, []);

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

  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const hasFetched = useRef(false);

  // Helper to fetch agent by name or ID
  const getAgent = (idOrName: string | number) => {
    if (!gameCharacters.length) return undefined;
    if (typeof idOrName === 'number' || !isNaN(Number(idOrName))) {
      return gameCharacters.find(c => c.id === Number(idOrName));
    }
    return gameCharacters.find(c => c.name.toLowerCase() === idOrName.toLowerCase());
  };

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

  // Effect 1: Fetch existing stats (only needs characters to be loaded for agent name resolution)
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
                firstBloods: stat.first_bloods ?? 0,
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

        // Also fetch game duration and game_scores (rounds won)
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
            // Convert HH:MM:SS or MM:SS:00 to MM:SS
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isCharactersFetched]);

  // Effect 2: Once draft, characters, and rosters are all loaded AND no existing stats were found,
  // apply agents from draft data using roster-based correlation
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftActionsFetched, isCharactersFetched, isRostersFetched, hasExistingStats]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const result = await extractValorantStatsFromImage(formData);
      if (result.success && result.data) {
        // Convert OCR agent name strings to character IDs for dropdown compatibility
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

        // Auto-map players by IGN
        const newMapping: Record<string, string> = {};
        const allPlayers = [...team1.players, ...team2.players];

        convertedData.players.forEach((stat, index) => {
          const matchedPlayer = allPlayers.find(p =>
            stat.playerName.toLowerCase().includes(p.ign.toLowerCase()) ||
            p.ign.toLowerCase().includes(stat.playerName.toLowerCase())
          );
          if (matchedPlayer) {
            newMapping[index.toString()] = matchedPlayer.id;
          }
        });

        // Auto-map draft agents using roster-based correlation
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

  // Auto-map extracted players to system players based on IGN
  // (autoMapPlayers removed since it's now integrated in handleFileUpload)

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

  // Handle manual stat edits
  const handleStatChange = (index: number, field: string, value: string) => {
    const newPlayers = [...previewData.players];
    // Deep copy the player object to avoid mutating state directly
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
          // Let's look up the player's current team from props
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

      // First delete existing stats for this game to avoid duplicate keys/errors when replacing
      await deleteValorantStatsByGameId(gameId);

      const result = await createMultipleValorantStats(statsToSave);

      if (previewData.matchDuration) {
        let durationToSave = previewData.matchDuration;
        if (durationToSave.split(':').length === 2) {
          durationToSave = `${durationToSave}:00`;
        }
        await updateGameById({ id: gameId, duration: durationToSave });
      }

      // Save rounds won as game_scores
      if (previewData.score.ally > 0 || previewData.score.enemy > 0) {
        await upsertGameScoresForGame(gameId, [
          { game_id: gameId, match_participant_id: team1.matchParticipantId, score: previewData.score.ally },
          { game_id: gameId, match_participant_id: team2.matchParticipantId, score: previewData.score.enemy },
        ]);
      }

      if (result.success) {
        toast.success(`${hasExistingStats ? 'Updated' : 'Saved'} stats for ${statsToSave.length} players`);
        setHasExistingStats(true);
        // Auto-transition game status to completed
        await updateGameById({ id: gameId, status: 'completed' });
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
      {/* ALWAYS SHOW UPLOAD */}
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
                  Copy Agents from Draft
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
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
                        firstBloods: 0
                      }))
                    };
                  });
                  setMvpIndex(null);
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
                  onChange={(e) => setPreviewData({ ...previewData, score: { ...previewData.score, ally: Number(e.target.value) || 0 } })}
                  className="h-8 w-14 text-center font-mono font-bold text-lg"
                  min={0}
                />
              </div>

              {/* Duration (center) */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duration</span>
                <Input
                  type="text"
                  value={previewData.matchDuration || ''}
                  onChange={(e) => setPreviewData({ ...previewData, matchDuration: e.target.value })}
                  className="h-8 w-20 text-center font-mono"
                  placeholder="MM:SS"
                />
              </div>

              {/* Team 2 */}
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={previewData.score.enemy}
                  onChange={(e) => setPreviewData({ ...previewData, score: { ...previewData.score, enemy: Number(e.target.value) || 0 } })}
                  className="h-8 w-14 text-center font-mono font-bold text-lg"
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
                          <SelectTrigger className="h-8 w-[120px]">
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
                            onCheckedChange={() => setMvpIndex(index)}
                            className="border-muted-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
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
                          <SelectTrigger>
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
        </div>
      )
      }
    </div >
  );
}
