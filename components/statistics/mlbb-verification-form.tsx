'use client';

import { useState } from 'react';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';
import { StatsMlbbPlayer } from '@/services/game-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGameCharactersByEsportId } from '@/actions/game-characters';
import { getGameDraftActionsByGameId } from '@/actions/game-draft';
import { toast } from 'sonner';
import { useEffect } from 'react';

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

    // Fetch Heroes for Dropdown
    const { data: heroes = [] } = useQuery({
        queryKey: ['mlbb-heroes'],
        queryFn: async () => {
            // Assuming esport_id 1 is MLBB. adjust if needed
            const result = await getGameCharactersByEsportId(1);
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
                if (p.team === 'Blue' && t1Idx < team1Picks.length) {
                    const hero = heroes.find((h: any) => h.id === team1Picks[t1Idx].hero_id);
                    if (hero) p.heroName = hero.name;
                    t1Idx++;
                } else if (p.team === 'Red' && t2Idx < team2Picks.length) {
                    const hero = heroes.find((h: any) => h.id === team2Picks[t2Idx].hero_id);
                    if (hero) p.heroName = hero.name;
                    t2Idx++;
                }
            }

            setPlayers(newPlayers);
            toast.success('Heroes copied from draft');
        } catch (error) {
            console.error('Error copying draft:', error);
            toast.error('Error copying draft data');
        } finally {
            setIsCopyingDraft(false);
        }
    };

    // Auto-map on initial load
    useEffect(() => {
        if (heroes.length > 0 && players.some(p => !p.heroName)) {
            handleCopyFromDraft();
        }
    }, [heroes.length]);

    const handleSave = () => {
        const dbPayload: StatsMlbbPlayer[] = players.map(p => {
            // Find selected hero
            const hero = heroes.find((h: any) => h.name === p.heroName);

            return {
                game_id: gameId,
                team_id: p.team === 'Blue' ? team1Id : team2Id, // Verify logic based on screenshot context
                player_id: 'mock-player-id', // Needs actual player mapping
                game_character_id: hero?.id || 0, // Hero lookup
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
                                <TableCell>
                                    <Select
                                        value={player.heroName}
                                        onValueChange={(val) => updatePlayer(idx, 'heroName', val)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Select Hero" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {heroes.map((hero: any) => (
                                                <SelectItem key={hero.id} value={hero.name}>
                                                    {hero.name}
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
                                <TableCell>{player.gold}</TableCell>
                                <TableCell>{player.kda.kills}</TableCell>
                                <TableCell>{player.kda.deaths}</TableCell>
                                <TableCell>{player.kda.assists}</TableCell>
                                <TableCell>{player.rating}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleCopyFromDraft}
                        disabled={isCopyingDraft || heroes.length === 0}
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
