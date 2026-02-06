'use client';

import { useState } from 'react';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { StatsValorantPlayer } from '@/services/game-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

interface ValorantStatsVerificationFormProps {
    initialData: ValorantScreenshotData;
    gameId: number;
    team1Id: string; // "Ally" usually implies Team 1 perspective in OCR context, but we need mapping logic
    team2Id: string;
    onSave: (data: StatsValorantPlayer[]) => void;
    isSaving: boolean;
}

export function ValorantStatsVerificationForm({
    initialData,
    gameId,
    team1Id,
    team2Id,
    onSave,
    isSaving
}: ValorantStatsVerificationFormProps) {
    const [players, setPlayers] = useState(initialData.players);

    // Helper to update a row
    const updatePlayer = (index: number, field: string, value: any) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);
    };

    const handleSave = () => {
        // Convert to DB format
        const dbPayload: StatsValorantPlayer[] = players.map(p => ({
            game_id: gameId,
            team_id: p.team === 'Ally' ? team1Id : team2Id, // Simplistic mapping, ideally verified
            // player_id needs to be resolved from DB based on name match
            // For this UI demo we might need a PlayerSelect dropdown or mock it
            player_id: 'mock-player-id', // Placeholder - User needs to select actual player if not auto-matched
            game_character_id: 0, // Placeholder - Need to lookup Agent ID by name
            kills: p.kda.kills,
            deaths: p.kda.deaths,
            assists: p.kda.assists,
            acs: p.acs,
            econ_rating: p.econRating,
            first_bloods: p.firstBloods,
            plants: p.plants,
            defuses: p.defuses,
            is_mvp: false // Logic to determine MVP
        }));

        onSave(dbPayload);
    };

    return (
        <Card>
            <CardContent className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="w-16">ACS</TableHead>
                            <TableHead className="w-16">K</TableHead>
                            <TableHead className="w-16">D</TableHead>
                            <TableHead className="w-16">A</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {players.map((player, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <Select 
                                        value={player.team} 
                                        onValueChange={(val) => updatePlayer(idx, 'team', val)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ally">Team 1</SelectItem>
                                            <SelectItem value="Enemy">Team 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>{player.agentName}</TableCell>
                                <TableCell>
                                    <Input 
                                        value={player.playerName} 
                                        onChange={(e) => updatePlayer(idx, 'playerName', e.target.value)} 
                                        className="h-8 w-32"
                                    />
                                </TableCell>
                                <TableCell>{player.acs}</TableCell>
                                <TableCell>{player.kda.kills}</TableCell>
                                <TableCell>{player.kda.deaths}</TableCell>
                                <TableCell>{player.kda.assists}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Stats
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
