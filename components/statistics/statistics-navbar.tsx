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
            <div className="w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-2 sm:p-3 overflow-x-auto scrollbar-hide">
                <nav className="flex gap-2" aria-label="Statistics navigation">
                    {availableViews.map((view) => {
                        const isActive = activeView === view.type;
                        return (
                            <button
                                key={view.type}
                                onClick={() => onViewChange(view.type)}
                                className={cn(
                                    'flex min-w-0 flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium',
                                    'whitespace-nowrap transition-all duration-200 border',
                                    isActive
                                        ? cn(
                                            game === 'mlbb' 
                                                ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20 text-blue-500' 
                                                : 'border-red-500 bg-red-500/10 shadow-sm shadow-red-500/20 text-red-500'
                                        )
                                        : 'border-border/50 bg-background text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground'
                                )}
                            >
                                {viewIcons[view.type]}
                                <span>{view.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
