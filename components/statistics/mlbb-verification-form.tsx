'use client';

import { useState } from 'react';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { StatsMlbbPlayer } from '@/services/game-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

interface __MlbbStatsVerificationFormProps {
    initialData: MlbbScreenshotData;
    gameId: number;
    team1Id: string;
    team2Id: string;
    onSave: (data: StatsMlbbPlayer[]) => void;
    isSaving: boolean;
}

export function MlbbStatsVerificationForm({
    initialData,
    gameId,
    team1Id,
    team2Id,
    onSave,
    isSaving
}: __MlbbStatsVerificationFormProps) {
    const [players, setPlayers] = useState(initialData.players);

    const updatePlayer = (index: number, field: string, value: any) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);
    };

    const handleSave = () => {
         const dbPayload: StatsMlbbPlayer[] = players.map(p => ({
            game_id: gameId,
            team_id: p.team === 'Blue' ? team1Id : team2Id, // Verify logic based on screenshot context
            player_id: 'mock-player-id', // Needs actual player mapping
            game_character_id: 0, // Needs hero lookup
            kills: p.kda.kills,
            deaths: p.kda.deaths,
            assists: p.kda.assists,
            gold: p.gold,
            teamfight: 0, // Not in OCR usually
            rating: p.rating,
            is_mvp: p.badge === 'MVP',
            // Default 0 for missing fields in this specific OCR mock
            damage_dealt: 0,
            damage_taken: 0,
            turret_damage: 0,
            lord_slain: 0,
            turtle_slain: 0 
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
                            <TableHead>Hero</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="w-16">Gold</TableHead>
                            <TableHead className="w-16">K</TableHead>
                            <TableHead className="w-16">D</TableHead>
                            <TableHead className="w-16">A</TableHead>
                            <TableHead className="w-16">Rating</TableHead>
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
                                            <SelectItem value="Blue">Team 1</SelectItem>
                                            <SelectItem value="Red">Team 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>{player.heroName}</TableCell>
                                <TableCell>
                                    <Input 
                                        value={player.playerName} 
                                        onChange={(e) => updatePlayer(idx, 'playerName', e.target.value)} 
                                        className="h-8 w-32"
                                    />
                                </TableCell>
                                <TableCell>{player.gold}</TableCell>
                                <TableCell>{player.kda.kills}</TableCell>
                                <TableCell>{player.kda.deaths}</TableCell>
                                <TableCell>{player.kda.assists}</TableCell>
                                <TableCell>{player.rating}</TableCell>
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
