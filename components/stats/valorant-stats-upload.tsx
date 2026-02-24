'use client';

import { useState } from 'react';
import { extractValorantStatsFromImage } from '@/actions/valorant-ocr';
import { createMultipleValorantStats } from '@/actions/stats-valorant';
import { updateGameById } from '@/actions/games';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Save, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useGameDraftActions } from '@/hooks/use-game-draft';
import { cn } from '@/lib/utils';

interface ValorantStatsUploadProps {
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

  const { data: gameDraftActions } = useGameDraftActions(gameId);

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
        setPreviewData(result.data);
        autoMapPlayers(result.data);
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
  const autoMapPlayers = (data: ValorantScreenshotData) => {
    const newMapping: Record<string, string> = {};
    const allPlayers = [...team1.players, ...team2.players];

    data.players.forEach((stat, index) => {
      // Clean OCR name (remove team prefix if possible, though OCR mock has full name)
      // Mock data has "USJR Astababy". Matches IGN "Astababy"?
      // We'll simplistic fuzzy match: if system IGN is contained in OCR name or vice versa
      const matchedPlayer = allPlayers.find(p => 
        stat.playerName.toLowerCase().includes(p.ign.toLowerCase()) || 
        p.ign.toLowerCase().includes(stat.playerName.toLowerCase())
      );

      if (matchedPlayer) {
        newMapping[index.toString()] = matchedPlayer.id;
      }
    });

    setPlayerMapping(newMapping);
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

          return {
            game_id: gameId,
            player_id: playerId,
            team_id: teamId,
            agent_name: stat.agentName,
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

      const result = await createMultipleValorantStats(statsToSave);
      
      if (previewData.matchDuration) {
        await updateGameById({ id: gameId, duration: previewData.matchDuration });
      }

      if (result.success) {
        toast.success(`Saved stats for ${statsToSave.length} players`);
        setPreviewData(() => {
          const allPlayers = [...team1.players, ...team2.players];
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
        setPlayerMapping({});
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
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Extracted Statistics</h3>
            <div className="flex items-center gap-4">
               {previewData.matchDuration !== undefined && (
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground font-medium">Duration:</span>
                   <Input 
                     type="text" 
                     value={previewData.matchDuration} 
                     onChange={(e) => setPreviewData({ ...previewData, matchDuration: e.target.value })}
                     className="h-8 w-16 text-center font-mono"
                     placeholder="MM:SS"
                   />
                 </div>
               )}
               <div className="flex gap-2">
                 <Badge variant="outline" className="text-blue-500">
                   Ally: {previewData.score.ally}
                 </Badge>
                 <Badge variant="outline" className="text-red-500">
                   Enemy: {previewData.score.enemy}
                 </Badge>
               </div>
            </div>
            <Button variant="outline" onClick={() => {
              setPreviewData(() => {
                const allPlayers = [...team1.players, ...team2.players];
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extracted Name</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>ACS</TableHead>
                  <TableHead className="w-[180px]">K / D / A</TableHead>
                  <TableHead>Econ</TableHead>
                  <TableHead>FB</TableHead>
                  <TableHead>PL</TableHead>
                  <TableHead>DF</TableHead>
                  <TableHead className="w-[200px]">Map to Player</TableHead>
                  <TableHead>Team</TableHead>
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
                            <Checkbox 
                              checked={mvpIndex === index}
                              onCheckedChange={() => setMvpIndex(index)}
                              className="border-muted-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
                            />
                            {stat.playerName} 
                            {mvpIndex === index && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[10px] px-1 h-5">MVP</Badge>}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className={cn("w-2 h-2 rounded-full", stat.team === 'Ally' ? "bg-blue-500" : "bg-red-500")} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={stat.agentName} 
                          onChange={(e) => handleStatChange(index, 'agentName', e.target.value)}
                          className="h-8 w-[100px]"
                        />
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
                            
                            if (value !== 'skip' && gameDraftActions) {
                              const pickAction = gameDraftActions.find(a => a.action_type === 'pick' && a.player_id === value);
                              if (pickAction && pickAction.hero_name) {
                                setPreviewData(prevData => {
                                  if (!prevData) return prevData;
                                  const newPlayers = [...prevData.players];
                                  newPlayers[index] = { ...newPlayers[index], agentName: pickAction.hero_name! };
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
                      </TableCell>
                      <TableCell>
                        {team ? (
                          <Badge variant="outline">{team.abbreviation}</Badge>
                        ) : mappedPlayerId === 'skip' ? (
                          <Badge variant="secondary">Skipped</Badge>
                        ) : mappedPlayerId ? (
                          <Badge variant="destructive">Unknown Team</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                   Save Statistics
                 </>
               )}
             </Button>
          </div>
        </div>
    </div>
  );
}
