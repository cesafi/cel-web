'use client';

import { cn } from '@/lib/utils';
import { Users, Swords, Target, Map, Trophy } from 'lucide-react';
import { StatisticsViewType, STATISTICS_VIEWS } from '@/lib/types/stats-enhanced';

interface StatisticsNavbarProps {
    game: 'mlbb' | 'valorant';
    activeView: StatisticsViewType;
    onViewChange: (view: StatisticsViewType) => void;
    className?: string;
}

const viewIcons: Record<StatisticsViewType, React.ReactNode> = {
    players: <Users className="w-4 h-4" />,
    heroes: <Swords className="w-4 h-4" />,
    agents: <Target className="w-4 h-4" />,
    maps: <Map className="w-4 h-4" />,
    teams: <Trophy className="w-4 h-4" />,
};

export function StatisticsNavbar({
    game,
    activeView,
    onViewChange,
    className,
}: StatisticsNavbarProps) {
    // Filter views based on current game
    const availableViews = STATISTICS_VIEWS.filter(
        (view) => (game === 'mlbb' ? view.mlbb : view.valorant)
    );

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop: Horizontal tabs with underline */}
            <div className="hidden sm:block">
                <div className="border-b border-border">
                    <nav className="flex gap-1 -mb-px" aria-label="Statistics navigation">
                        {availableViews.map((view) => {
                            const isActive = activeView === view.type;
                            return (
                                <button
                                    key={view.type}
                                    onClick={() => onViewChange(view.type)}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-3 text-sm font-medium',
                                        'transition-colors duration-200',
                                        'hover:text-foreground',
                                        isActive
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    {viewIcons[view.type]}
                                    <span>{view.label}</span>

                                    {/* Active underline */}
                                    {isActive && (
                                        <span
                                            className={cn(
                                                'absolute bottom-0 left-0 right-0 h-0.5',
                                                game === 'mlbb'
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                            )}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Mobile: Scrollable pill tabs */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 p-1">
                    {availableViews.map((view) => {
                        const isActive = activeView === view.type;
                        return (
                            <button
                                key={view.type}
                                onClick={() => onViewChange(view.type)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                                    'whitespace-nowrap transition-all duration-200',
                                    isActive
                                        ? cn(
                                            'text-white shadow-md',
                                            game === 'mlbb'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                : 'bg-gradient-to-r from-red-500 to-red-600'
                                        )
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                            >
                                {viewIcons[view.type]}
                                <span>{view.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
