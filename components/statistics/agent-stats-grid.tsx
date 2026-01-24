'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Crosshair, Zap, Users } from 'lucide-react';
import { AgentStats, AgentRole } from '@/lib/types/stats-enhanced';

interface AgentStatsGridProps {
    data: AgentStats[];
    isLoading?: boolean;
    className?: string;
}

const roleConfig: Record<AgentRole, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    duelist: {
        label: 'Duelists',
        icon: <Crosshair className="w-4 h-4" />,
        color: 'text-red-500',
        bgColor: 'from-red-500/20 to-red-600/30'
    },
    initiator: {
        label: 'Initiators',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-green-500',
        bgColor: 'from-green-500/20 to-green-600/30'
    },
    controller: {
        label: 'Controllers',
        icon: <Target className="w-4 h-4" />,
        color: 'text-purple-500',
        bgColor: 'from-purple-500/20 to-purple-600/30'
    },
    sentinel: {
        label: 'Sentinels',
        icon: <Shield className="w-4 h-4" />,
        color: 'text-yellow-500',
        bgColor: 'from-yellow-500/20 to-yellow-600/30'
    },
};

function AgentCard({ agent, maxACS }: { agent: AgentStats; maxACS: number }) {
    const role = agent.role ? roleConfig[agent.role] : null;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Agent Icon */}
                    <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                        'bg-gradient-to-br',
                        role ? role.bgColor : 'from-gray-500/20 to-gray-600/30'
                    )}>
                        {agent.icon_url ? (
                            <img src={agent.icon_url} alt={agent.agent_name} className="w-10 h-10 rounded" />
                        ) : (
                            <span className={cn('text-lg font-bold', role?.color || 'text-muted-foreground')}>
                                {agent.agent_name.charAt(0)}
                            </span>
                        )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{agent.agent_name}</h4>
                            {role && (
                                <span className={cn('text-xs', role.color)}>
                                    {role.icon}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.games_played} games</p>
                    </div>

                    {/* Pick Rate */}
                    <Badge variant="outline" className="text-xs">
                        {agent.pick_rate.toFixed(1)}%
                    </Badge>
                </div>

                {/* ACS Bar */}
                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Avg ACS</span>
                        <span className="font-semibold text-red-500">{agent.avg_acs.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                            style={{ width: `${(agent.avg_acs / maxACS) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-1 text-center">
                    <div>
                        <p className="text-sm font-semibold text-green-500">{agent.avg_kills.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">K</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-500">{agent.avg_deaths.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">D</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-500">{agent.avg_assists.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">A</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-yellow-500">{agent.avg_first_bloods.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">FB</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AgentStatsGrid({ data, isLoading = false, className }: AgentStatsGridProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No agent statistics available yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxACS = Math.max(...data.map(a => a.avg_acs), 1);

    // Group agents by role
    const groupedAgents = data.reduce((acc, agent) => {
        const role = agent.role || 'unknown';
        if (!acc[role]) acc[role] = [];
        acc[role].push(agent);
        return acc;
    }, {} as Record<string, AgentStats[]>);

    const roleOrder: (AgentRole | 'unknown')[] = ['duelist', 'initiator', 'controller', 'sentinel', 'unknown'];

    return (
        <div className={cn('space-y-8', className)}>
            {roleOrder.map((roleKey) => {
                const agents = groupedAgents[roleKey];
                if (!agents || agents.length === 0) return null;

                const role = roleKey !== 'unknown' ? roleConfig[roleKey as AgentRole] : null;

                return (
                    <div key={roleKey}>
                        {/* Role Header */}
                        <div className="flex items-center gap-2 mb-4">
                            {role ? (
                                <>
                                    <span className={role.color}>{role.icon}</span>
                                    <h3 className="text-lg font-semibold">{role.label}</h3>
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold text-muted-foreground">Other Agents</h3>
                                </>
                            )}
                            <Badge variant="secondary" className="text-xs">
                                {agents.length}
                            </Badge>
                        </div>

                        {/* Agent Grid - 2 columns on mobile */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {agents
                                .sort((a, b) => b.pick_rate - a.pick_rate)
                                .map((agent) => (
                                    <AgentCard key={agent.agent_name} agent={agent} maxACS={maxACS} />
                                ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
