'use client';

import { useState } from 'react';
import { extractMlbbStatsFromImage } from '@/actions/mlbb-ocr';
import { createMultipleMlbbStats } from '@/actions/stats-mlbb';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { Player } from '@/lib/types/players';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Save, RefreshCcw, Coins } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<MlbbScreenshotData | null>(null);
  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>({}); // index -> playerId
  const [isSaving, setIsSaving] = useState(false);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const result = await extractMlbbStatsFromImage(formData);
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
  const autoMapPlayers = (data: MlbbScreenshotData) => {
    const newMapping: Record<string, string> = {};
    const allPlayers = [...team1.players, ...team2.players];

    data.players.forEach((stat, index) => {
      // Clean OCR name (remove team prefix if possible)
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
    if (!previewData) return;
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
    }

    newPlayers[index] = player;
    setPreviewData({ ...previewData, players: newPlayers });
  };

  // Handle Save
  const handleSave = async () => {
    if (!previewData) return;
    
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
            hero_name: stat.heroName,
            kills: stat.kda.kills,
            deaths: stat.kda.deaths,
            assists: stat.kda.assists,
            gold: stat.gold,
            // MLBB stats table doesn't have rating/score column yet, so we verify what we have
            // db types: kills, deaths, assists, gold, hero_name
          };
        })
        .filter((stat): stat is NonNullable<typeof stat> => stat !== null);

      if (statsToSave.length === 0) {
        toast.error('No players mapped. Please map players before saving.');
        setIsSaving(false);
        return;
      }

      const result = await createMultipleMlbbStats(statsToSave);
      if (result.success) {
        toast.success(`Saved stats for ${statsToSave.length} players`);
        setPreviewData(null);
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
      {!previewData ? (
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
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload-mlbb"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button asChild disabled={isUploading}>
                  <label htmlFor="image-upload-mlbb" className="cursor-pointer">
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
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Extracted Statistics ({previewData.matchResult})
            </h3>
            <div className="flex gap-2">
               <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">
                 Blue: {previewData.score.blue}
               </Badge>
               <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                 Red: {previewData.score.red}
               </Badge>
            </div>
            <Button variant="outline" onClick={() => setPreviewData(null)}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extracted Name</TableHead>
                  <TableHead>Hero</TableHead>
                  <TableHead>K/D/A</TableHead>
                  <TableHead>Gold</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-[250px]">Map to Player</TableHead>
                  <TableHead>Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.players.map((stat, index) => {
                  const mappedPlayerId = playerMapping[index.toString()];
                  const team = mappedPlayerId && mappedPlayerId !== 'skip' ? getTeamForPlayer(mappedPlayerId) : null;

                  return (
                    <TableRow key={index} className={stat.team === 'Blue' ? 'bg-blue-50/10' : 'bg-red-50/10'}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {stat.playerName} 
                            {stat.badge === 'MVP' && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[10px] px-1 h-5">MVP</Badge>}
                            {stat.badge === 'Gold' && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-[10px] px-1 h-5">Gold</Badge>}
                          </span>
                          <span className={cn("text-xs font-semibold", stat.team === 'Blue' ? "text-blue-500" : "text-red-500")}>
                            {stat.team} Team
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={stat.heroName} 
                          onChange={(e) => handleStatChange(index, 'heroName', e.target.value)}
                          className="h-8 w-[100px]"
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
                      <TableCell>
                        <Select
                          value={mappedPlayerId || ''}
                          onValueChange={(value) => setPlayerMapping(prev => ({ ...prev, [index.toString()]: value }))}
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
             <Button variant="outline" onClick={() => setPreviewData(null)}>Cancel</Button>
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
