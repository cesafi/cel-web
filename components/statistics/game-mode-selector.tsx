'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getEsports, EsportGame } from '@/actions/statistics';

interface GameModeSelectorProps {
    game: 'mlbb' | 'valorant';
    onGameChange: (game: 'mlbb' | 'valorant') => void;
    className?: string;
}

// Fallback game config when DB data isn't available
const fallbackGames = [
    {
        id: 'mlbb' as const,
        name: 'Mobile Legends',
        shortName: 'MLBB',
        description: 'Bang Bang',
        logo: null,
        gradient: 'from-blue-600 to-blue-800',
        accentColor: 'ring-blue-500',
        bgActive: 'bg-gradient-to-br from-blue-600/20 to-blue-800/30',
        textActive: 'text-blue-500',
    },
    {
        id: 'valorant' as const,
        name: 'Valorant',
        shortName: 'VAL',
        description: 'Tactical Shooter',
        logo: null,
        gradient: 'from-red-600 to-red-800',
        accentColor: 'ring-red-500',
        bgActive: 'bg-gradient-to-br from-red-600/20 to-red-800/30',
        textActive: 'text-red-500',
    },
];

// Map DB name to game ID
function getGameId(name: string): 'mlbb' | 'valorant' | null {
    const lowered = name.toLowerCase();
    if (lowered.includes('mobile legends') || lowered.includes('mlbb')) return 'mlbb';
    if (lowered.includes('valorant')) return 'valorant';
    return null;
}

// Get styling based on game ID
function getGameStyling(gameId: 'mlbb' | 'valorant') {
    if (gameId === 'mlbb') {
        return {
            gradient: 'from-blue-600 to-blue-800',
            bgActive: 'bg-gradient-to-br from-blue-600/20 to-blue-800/30',
            textActive: 'text-blue-500',
        };
    }
    return {
        gradient: 'from-red-600 to-red-800',
        bgActive: 'bg-gradient-to-br from-red-600/20 to-red-800/30',
        textActive: 'text-red-500',
    };
}

export function GameModeSelector({ game, onGameChange, className }: GameModeSelectorProps) {
    const [esportsData, setEsportsData] = useState<EsportGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEsports() {
            try {
                const result = await getEsports();
                if (result.success && result.data) {
                    setEsportsData(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch esports:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchEsports();
    }, []);

    // Build games array from DB data or fallback
    const games = esportsData.length > 0
        ? esportsData
            .map((esport) => {
                const gameId = getGameId(esport.name);
                if (!gameId) return null;
                const styling = getGameStyling(gameId);
                return {
                    id: gameId,
                    name: esport.name,
                    shortName: esport.abbreviation || gameId.toUpperCase(),
                    description: 'Click to view statistics',
                    logo: esport.logo_url,
                    ...styling,
                };
            })
            .filter(Boolean) as typeof fallbackGames
        : fallbackGames;

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop: Side by side */}
            <div className="hidden sm:grid grid-cols-2 gap-4">
                {games.map((g) => {
                    const isActive = game === g.id;
                    return (
                        <button
                            key={g.id}
                            onClick={() => onGameChange(g.id)}
                            className={cn(
                                'relative group overflow-hidden rounded-xl p-4 transition-all duration-300',
                                'border hover:scale-[1.02] shadow-sm',
                                isActive
                                    ? `${g.bgActive} border-current ${g.textActive} shadow-lg backdrop-blur-md`
                                    : 'bg-card/40 backdrop-blur-md border-border/50 hover:border-muted-foreground/50 hover:bg-card/60'
                            )}
                        >
                            {/* Background Glow Effect */}
                            {isActive && (
                                <div
                                    className={cn(
                                        'absolute inset-0 opacity-20 blur-2xl',
                                        `bg-gradient-to-br ${g.gradient}`
                                    )}
                                />
                            )}

                            <div className="relative flex items-center gap-4">
                                {/* Game Logo */}
                                <div
                                    className={cn(
                                        'w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden',
                                        'bg-muted/50 backdrop-blur-sm border border-border/50',
                                        isActive && 'border-current'
                                    )}
                                >
                                    {g.logo ? (
                                        <Image
                                            src={g.logo}
                                            alt={g.name}
                                            width={48}
                                            height={48}
                                            className="object-contain"
                                        />
                                    ) : (
                                        <span className={cn(
                                            'text-xl font-bold',
                                            isActive ? g.textActive : 'text-muted-foreground'
                                        )}>
                                            {g.shortName}
                                        </span>
                                    )}
                                </div>

                                {/* Game Info */}
                                <div className="text-left">
                                    <h3 className={cn(
                                        'font-bold text-lg transition-colors',
                                        isActive ? 'text-foreground' : 'text-muted-foreground'
                                    )}>
                                        {g.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{g.description}</p>
                                </div>
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className={cn(
                                    'absolute bottom-0 left-0 right-0 h-1',
                                    `bg-gradient-to-r ${g.gradient}`
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mobile: Stacked full-width buttons */}
            <div className="sm:hidden flex flex-col gap-3">
                {games.map((g) => {
                    const isActive = game === g.id;
                    return (
                        <button
                            key={g.id}
                            onClick={() => onGameChange(g.id)}
                            className={cn(
                                'relative w-full overflow-hidden rounded-xl p-4 transition-all duration-200',
                                'border active:scale-[0.98]',
                                isActive
                                    ? `${g.bgActive} border-current ${g.textActive} shadow-md backdrop-blur-md`
                                    : 'bg-card/40 backdrop-blur-md border-border/50'
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* Game Logo */}
                                <div
                                    className={cn(
                                        'w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden',
                                        'bg-muted/50 backdrop-blur-sm border border-border/50',
                                        isActive && 'border-current'
                                    )}
                                >
                                    {g.logo ? (
                                        <Image
                                            src={g.logo}
                                            alt={g.name}
                                            width={40}
                                            height={40}
                                            className="object-contain"
                                        />
                                    ) : (
                                        <span className={cn(
                                            'text-lg font-bold',
                                            isActive ? g.textActive : 'text-muted-foreground'
                                        )}>
                                            {g.shortName}
                                        </span>
                                    )}
                                </div>

                                {/* Game Info */}
                                <div className="text-left flex-1">
                                    <h3 className={cn(
                                        'font-semibold transition-colors',
                                        isActive ? 'text-foreground' : 'text-muted-foreground'
                                    )}>
                                        {g.name}
                                    </h3>
                                </div>

                                {/* Checkmark for active */}
                                {isActive && (
                                    <div className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center',
                                        `bg-gradient-to-br ${g.gradient}`
                                    )}>
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className={cn(
                                    'absolute bottom-0 left-0 right-0 h-0.5',
                                    `bg-gradient-to-r ${g.gradient}`
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
