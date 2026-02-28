'use client';

import { useState } from 'react';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { StatsValorantPlayer } from '@/services/game-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { getGameDraftActionsByGameId } from '@/actions/game-draft';
import { toast } from 'sonner';
import { useEffect } from 'react';

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

    // Fetch Agents for Dropdown
    const { data: agents = [] } = useQuery({
        queryKey: ['valorant-agents'],
        queryFn: async () => {
            // Assuming esport_id 2 is Valorant. adjust if needed
            const result = await getGameCharactersByEsportId(2);
            if (!result.success) throw new Error(result.error);
            return result.data;
        }
    });

    const [isCopyingDraft, setIsCopyingDraft] = useState(false);

    const handleCopyFromDraft = async () => {
        setIsCopyingDraft(true);
        try {
            const result = await getGameDraftActionsByGameId(gameId);
            if (!result.success || !result.data) {
                toast.error('Failed to load draft data');
                return;
            }

            const draftActions = result.data;
            const picks = draftActions.filter(a => a.action_type === 'pick' && a.hero_id);

            // Separate picks by team
            const team1Picks = picks.filter(a => a.team_id === team1Id);
            const team2Picks = picks.filter(a => a.team_id === team2Id);

            // Map to current players based on team
            const newPlayers = [...players];

            let t1Idx = 0;
            let t2Idx = 0;

            for (let i = 0; i < newPlayers.length; i++) {
                const p = newPlayers[i];
                if (p.team === 'Ally' && t1Idx < team1Picks.length) {
                    const agent = agents.find((a: any) => a.id === team1Picks[t1Idx].hero_id);
                    if (agent) p.agentName = agent.name;
                    t1Idx++;
                } else if (p.team === 'Enemy' && t2Idx < team2Picks.length) {
                    const agent = agents.find((a: any) => a.id === team2Picks[t2Idx].hero_id);
                    if (agent) p.agentName = agent.name;
                    t2Idx++;
                }
            }

            setPlayers(newPlayers);
            toast.success('Agents copied from draft');
        } catch (error) {
            console.error('Error copying draft:', error);
            toast.error('Error copying draft data');
        } finally {
            setIsCopyingDraft(false);
        }
    };

    // Auto-map on initial load
    useEffect(() => {
        if (agents.length > 0 && players.some(p => !p.agentName)) {
            handleCopyFromDraft();
        }
    }, [agents.length]); // Run once agents are loaded

    const handleSave = () => {
        // Convert to DB format
        const dbPayload: StatsValorantPlayer[] = players.map(p => {
            // Find selected agent
            const agent = agents.find((a: any) => a.name === p.agentName);

            return {
                game_id: gameId,
                team_id: p.team === 'Ally' ? team1Id : team2Id, // Kept team matching logic for DB but removed from UI
                player_id: 'mock-player-id', // Placeholder - User needs to select actual player if not auto-matched
                game_character_id: agent?.id || 0, // Lookup Agent ID by name
                kills: p.kda.kills,
                deaths: p.kda.deaths,
                assists: p.kda.assists,
                acs: p.acs,
                econ_rating: p.econRating,
                first_bloods: p.firstBloods,
                plants: p.plants,
                defuses: p.defuses,
                is_mvp: p.isMvp || false
            };
        });

        onSave(dbPayload);
    };

    return (
        <Card>
            <CardContent className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">MVP</TableHead>
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
                                    <Checkbox
                                        checked={player.isMvp}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                // if checked, uncheck all others
                                                const newPlayers = players.map((p, i) => ({
                                                    ...p,
                                                    isMvp: i === idx,
                                                }));
                                                setPlayers(newPlayers);
                                            } else {
                                                updatePlayer(idx, 'isMvp', false);
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={player.agentName}
                                        onValueChange={(val) => updatePlayer(idx, 'agentName', val)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Select Agent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agents.map((agent: any) => (
                                                <SelectItem key={agent.id} value={agent.name}>
                                                    {agent.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={player.playerName}
                                        onChange={(e) => updatePlayer(idx, 'playerName', e.target.value)}
                                        className="h-8 w-32"
                                    />
                                </TableCell>
                                <TableCell>{player.acs}</TableCell>
                                <TableCell>
                                    <Input
                                        value={player.kda.kills}
                                        onChange={(e) => {
                                            const newPlayers = [...players];
                                            newPlayers[idx].kda.kills = parseInt(e.target.value) || 0;
                                            setPlayers(newPlayers);
                                        }}
                                        className="h-8 w-16"
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={player.kda.deaths}
                                        onChange={(e) => {
                                            const newPlayers = [...players];
                                            newPlayers[idx].kda.deaths = parseInt(e.target.value) || 0;
                                            setPlayers(newPlayers);
                                        }}
                                        className="h-8 w-16"
                                        type="number"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={player.kda.assists}
                                        onChange={(e) => {
                                            const newPlayers = [...players];
                                            newPlayers[idx].kda.assists = parseInt(e.target.value) || 0;
                                            setPlayers(newPlayers);
                                        }}
                                        className="h-8 w-16"
                                        type="number"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleCopyFromDraft}
                        disabled={isCopyingDraft || agents.length === 0}
                    >
                        {isCopyingDraft ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy from Draft
                    </Button>
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
