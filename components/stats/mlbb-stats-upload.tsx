'use client';

import { useState, useEffect, useRef } from 'react';
import { extractMlbbStatsFromImage } from '@/actions/mlbb-ocr';
import { createMultipleMlbbStats, getMlbbStatsByGameId, deleteMlbbStatsByGameId } from '@/actions/stats-mlbb';
import { updateGameById } from '@/actions/games';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw, Coins, FileImage, ShieldAlert, Swords, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { useAllGameCharactersWithEsport } from '@/hooks/use-game-characters';
import { cn } from '@/lib/utils';

interface MlbbStatsUploadProps {
  gameId: number;
  team1: {
    id: string;
    name: string;
    abbreviation: string;
    players: Player[];
  };
  team2: {
    id: string;
    name: string;
    abbreviation: string;
    players: Player[];
  };
  onStatsSaved?: () => void;
}

export function MlbbStatsUpload({ gameId, team1, team2, onStatsSaved }: MlbbStatsUploadProps) {
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

  const { data: gameDraftActions } = useGameDraftActions(gameId);
  const { data: gameCharacters } = useAllGameCharactersWithEsport();
  const [heroMapping, setHeroMapping] = useState<Record<string, string>>({});

  const [equipmentFile, setEquipmentFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || !gameCharacters || !gameDraftActions) return;

    let mounted = true;
    async function fetchInitialData() {
      try {
        const result = await getMlbbStatsByGameId(gameId);
        if (!mounted) return;

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

          result.data.forEach((stat) => {
            let slot = -1;
            if (team1PlayerIds.has(stat.player_id)) {
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
        } else {
          // No existing stats: auto-assign heroes based on draft actions if available
          const newHeroMapping: Record<string, string> = {};
          setPreviewData(prev => {
            const newPlayers = [...prev.players];
            for (let i = 0; i < 10; i++) {
              const pId = playerMapping[i.toString()]; // playerMapping has default initial picks
              if (pId) {
                const pickAction = gameDraftActions?.find(a => a.action_type === 'pick' && a.player_id === pId);
                if (pickAction && pickAction.hero_name) {
                  const char = gameCharacters?.find(c => c.name.toLowerCase() === pickAction.hero_name?.toLowerCase());
                  if (char) {
                    newHeroMapping[i.toString()] = char.id.toString();
                    newPlayers[i].heroName = char.name;
                  }
                }
              }
            }
            setHeroMapping(newHeroMapping);
            return { ...prev, players: newPlayers };
          });
        }
      } catch (e) {
        console.error("Failed to fetch existing stats", e);
      } finally {
        setIsFetchingStats(false);
      }
    }

    hasFetched.current = true;
    fetchInitialData();

    return () => { mounted = false; };
  }, [gameId, gameCharacters, gameDraftActions, playerMapping, team1.players, team2.players]);

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
        // When AI extracts stats, override the empty structure
        setPreviewData(result.data);
        autoMapPlayers(result.data, gameCharacters);
        const extractedMvpIndex = result.data.players.findIndex(p => p.badge === 'MVP');
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

  // Auto-map extracted players to system players based on IGN
  const autoMapPlayers = (data: MlbbScreenshotData, chars: any[] | undefined) => {
    const allPlayers = [...team1.players, ...team2.players];
    const newMapping: Record<string, string> = {};
    const newHeroMapping: Record<string, string> = {};

    data.players.forEach((stat, index) => {
      const matchedPlayer = allPlayers.find(p =>
        stat.playerName.toLowerCase().includes(p.ign.toLowerCase()) ||
        p.ign.toLowerCase().includes(stat.playerName.toLowerCase())
      );

      if (matchedPlayer) {
        newMapping[index.toString()] = matchedPlayer.id;
      }

      if (stat.heroName && chars) {
        const matchedChar = chars.find((c: any) => c.name.toLowerCase() === stat.heroName.toLowerCase());
        if (matchedChar) {
          newHeroMapping[index.toString()] = matchedChar.id.toString();
        }
      }
    });

    setPlayerMapping(newMapping);
    setHeroMapping(newHeroMapping);

    // Auto-map draft mapping after setting initial mappings
    if (gameDraftActions) {
      setPreviewData(prevData => {
        const newPlayers = [...prevData.players];
        const updatedHeroMapping = { ...newHeroMapping };

        for (let i = 0; i < 10; i++) {
          const pId = newMapping[i.toString()];
          if (pId) {
            const pickAction = gameDraftActions.find(a => a.action_type === 'pick' && a.player_id === pId);
            if (pickAction && pickAction.hero_name) {
              const matchedChar = chars?.find((c: any) => c.name.toLowerCase() === pickAction.hero_name?.toLowerCase());
              if (matchedChar) {
                updatedHeroMapping[i.toString()] = matchedChar.id.toString();
                newPlayers[i].heroName = matchedChar.name;
              }
            }
          }
        }
        setHeroMapping(updatedHeroMapping);
        return { ...prevData, players: newPlayers };
      });
    }
  };

  const handleCopyFromDraft = () => {
    if (!gameDraftActions || gameDraftActions.length === 0) {
      toast.error('No draft data available for this game.');
      return;
    }

    setPreviewData(prevData => {
      const newPlayers = [...prevData.players];
      const newHeroMapping = { ...heroMapping };

      for (let i = 0; i < 10; i++) {
        const pId = playerMapping[i.toString()];
        if (pId && pId !== 'skip') {
          const pickAction = gameDraftActions.find(a => a.action_type === 'pick' && a.player_id === pId);
          if (pickAction && pickAction.hero_name) {
            const matchingChar = gameCharacters?.find(c => c.name.toLowerCase() === pickAction.hero_name?.toLowerCase());
            if (matchingChar) {
              newHeroMapping[i.toString()] = matchingChar.id.toString();
              newPlayers[i].heroName = matchingChar.name;
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
            is_mvp: index === mvpIndex
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

      // Also save the extracted/edited match duration into the games table
      if (previewData.duration) {
        let durationToSave = previewData.duration;
        if (durationToSave.split(':').length === 2) {
          durationToSave = `${durationToSave}:00`;
        }
        await updateGameById({ id: gameId, duration: durationToSave });
      }

      if (result.success) {
        toast.success(`Saved stats for ${statsToSave.length} players`);
        setPreviewData(() => {
          const allPlayers = [...team1.players, ...team2.players];
          return {
            matchResult: 'VICTORY',
            duration: '',
            score: { blue: 0, red: 0 },
            players: allPlayers.map(p => {
              const isTeam1 = team1.players.some(t1p => t1p.id === p.id);
              return {
                playerName: p.ign,
                team: isTeam1 ? 'Blue' : 'Red',
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
              };
            })
          };
        });
        setPlayerMapping({});
        setHeroMapping({});
        setEquipmentFile(null);
        setDataFile(null);
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Extracted Statistics
            </h3>
            <div className="flex items-center gap-4">
              {previewData.duration !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Duration:</span>
                  <Input
                    type="text"
                    value={previewData.duration}
                    onChange={(e) => setPreviewData({ ...previewData, duration: e.target.value })}
                    className="h-8 w-16 text-center font-mono"
                    placeholder="MM:SS"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Badge variant="outline" className="text-blue-500">
                  Blue: {previewData.score.blue}
                </Badge>
                <Badge variant="outline" className="text-red-500">
                  Red: {previewData.score.red}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCopyFromDraft}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Copy from Draft
              </Button>
              <Button variant="outline" onClick={() => {
                // Reset simply clears uploaded data and re-initializes empty framework
                setPreviewData(() => {
                  return {
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
                  };
                });
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Player & Team</TableHead>
                  <TableHead className="w-[120px]">Hero</TableHead>
                  <TableHead className="w-[60px] text-center">MVP</TableHead>
                  <TableHead className="w-[160px] text-center">K / D / A</TableHead>
                  <TableHead className="w-[80px]">Gold</TableHead>
                  <TableHead className="w-[80px]">Rating</TableHead>
                  {/* Advanced Stats */}
                  <TableHead className="w-[100px]">Damage</TableHead>
                  <TableHead className="w-[100px]">Turret</TableHead>
                  <TableHead className="w-[100px]">Taken</TableHead>
                  <TableHead className="w-[80px]">TF %</TableHead>
                  <TableHead className="w-[60px] text-center">Turtles</TableHead>
                  <TableHead className="w-[60px] text-center">Lords</TableHead>

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
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {stat.playerName}
                            {stat.badge === 'Gold' && mvpIndex !== index && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-[10px] px-1 h-5">Gold</Badge>}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={cn("w-2 h-2 rounded-full", stat.team === 'Blue' ? "bg-blue-500" : "bg-red-500")} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={heroMapping[index.toString()] || ''}
                          onValueChange={(value) => {
                            setHeroMapping(prev => ({ ...prev, [index.toString()]: value }));
                            handleStatChange(index, 'heroName', value);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue placeholder="Hero" />
                          </SelectTrigger>
                          <SelectContent>
                            {gameCharacters?.map(char => (
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
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          <Input
                            type="number"
                            value={stat.gold}
                            onChange={(e) => handleStatChange(index, 'gold', e.target.value)}
                            className="h-8 w-[80px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.rating}
                          onChange={(e) => handleStatChange(index, 'rating', e.target.value)}
                          className="h-8 w-[60px]"
                          step="0.1"
                        />
                      </TableCell>

                      {/* Advanced Stats */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Swords className="h-3 w-3 text-red-500" />
                          <Input
                            type="number"
                            value={stat.damageDealt}
                            onChange={(e) => handleStatChange(index, 'damageDealt', e.target.value)}
                            className="h-8 w-[80px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.turretDamage}
                          onChange={(e) => handleStatChange(index, 'turretDamage', e.target.value)}
                          className="h-8 w-[80px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3 text-blue-500" />
                          <Input
                            type="number"
                            value={stat.damageTaken}
                            onChange={(e) => handleStatChange(index, 'damageTaken', e.target.value)}
                            className="h-8 w-[80px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={stat.teamfight}
                            onChange={(e) => handleStatChange(index, 'teamfight', e.target.value)}
                            className="h-8 w-[50px]"
                          />
                          <span className="text-xs text-muted-foreground ml-1">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.turtlesSlain ?? 0}
                          onChange={(e) => handleStatChange(index, 'turtlesSlain', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={stat.lordsSlain ?? 0}
                          onChange={(e) => handleStatChange(index, 'lordsSlain', e.target.value)}
                          className="h-8 w-[50px] px-2 text-center mx-auto"
                        />
                      </TableCell>

                      <TableCell>
                        <Select
                          value={mappedPlayerId || ''}
                          onValueChange={(value) => {
                            setPlayerMapping(prev => ({ ...prev, [index.toString()]: value }));

                            // Auto-fill hero if mapped from draft
                            if (value !== 'skip' && gameDraftActions) {
                              const pickAction = gameDraftActions.find(a => a.action_type === 'pick' && a.player_id === value);
                              if (pickAction && pickAction.hero_name) {
                                const matchingChar = gameCharacters?.find(c => c.name.toLowerCase() === pickAction.hero_name?.toLowerCase());
                                if (matchingChar) {
                                  setHeroMapping(prev => ({ ...prev, [index.toString()]: matchingChar.id.toString() }));
                                }
                                setPreviewData(prevData => {
                                  const newPlayers = [...prevData.players];
                                  newPlayers[index] = { ...newPlayers[index], heroName: pickAction.hero_name! };
                                  return { ...prevData, players: newPlayers };
                                });
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
                  Save Statistics
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
