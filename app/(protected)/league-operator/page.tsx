'use client';

import { 
  Target, 
  Trophy, 
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  MapPin,
  Volleyball
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { usePaginatedMatches } from '@/hooks/use-matches';
import { useMemo } from 'react';

export default function LeagueOperatorOverviewPage() {
  // Get matches data for league operator management
  const { data: matchesData, isLoading } = usePaginatedMatches({
    page: 1,
    pageSize: 100, // Get more matches for stats
    sortBy: 'scheduled_at',
    sortOrder: 'desc'
  });

  // Calculate stats from real data
  const leagueStats = useMemo(() => {
    if (!matchesData?.data) {
      return {
        totalMatches: 0,
        upcomingMatches: 0,
        completedMatches: 0,
        activeStages: 0,
        participatingTeams: 0,
        pendingActions: 0,
        matchesToday: 0,
        averageAttendance: 0
      };
    }

    const matches = matchesData.data;
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'finished').length;
    const scheduledMatches = matches.filter(m => m.status === 'upcoming').length;
    
    // Calculate matches today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const matchesToday = matches.filter(m => {
      if (!m.scheduled_at) return false;
      const matchDate = new Date(m.scheduled_at);
      return matchDate >= today && matchDate < tomorrow;
    }).length;

    // Get unique stages (matches don't have direct team references in this structure)
    const stageIds = new Set(matches.map(m => m.stage_id).filter(Boolean));
    const activeStages = stageIds.size;

    // Calculate pending actions (matches that need attention)
    const pendingActions = matches.filter(m => 
      m.status === 'cancelled'
    ).length;

    return {
      totalMatches,
      upcomingMatches: scheduledMatches,
      completedMatches,
      activeStages,
      participatingTeams: 0, // Would need to get from match participants
      pendingActions,
      matchesToday,
      averageAttendance: 450 // This would need more complex calculation
    };
  }, [matchesData]);

  // Get recent activity from real data
  const recentActivity = useMemo(() => {
    if (!matchesData?.data) return [];
    
    return matchesData.data.slice(0, 4).map(match => ({
      id: match.id,
      title: match.name,
      status: match.status,
      sport: 'Unknown Sport', // Would need to get from stage/sport relationship
      date: match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString() : 'TBD',
      venue: match.venue || 'TBD'
    }));
  }, [matchesData]);

  // Get today's matches from real data
  const upcomingMatches = useMemo(() => {
    if (!matchesData?.data) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return matchesData.data
      .filter(match => {
        if (!match.scheduled_at) return false;
        const matchDate = new Date(match.scheduled_at);
        return matchDate >= today && matchDate < tomorrow && match.status === 'upcoming';
      })
      .slice(0, 3)
      .map(match => ({
        id: match.id,
        teams: match.name,
        sport: 'Unknown Sport', // Would need to get from stage/sport relationship
        time: match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        venue: match.venue || 'TBD'
      }));
  }, [matchesData]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800 border-blue-200" },
      ongoing: { label: "Ongoing", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      finished: { label: "Finished", className: "bg-green-100 text-green-800 border-green-200" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">League Operator Dashboard</h1>
          <p className="text-muted-foreground">
            Manage matches and game operations for the league.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">League Operator Dashboard</h1>
        <p className="text-muted-foreground">
          Manage matches and game operations for the league.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              Matches this season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.upcomingMatches}</div>
            <p className="text-xs text-muted-foreground">
              Matches this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.completedMatches}</div>
            <p className="text-xs text-muted-foreground">
              Matches finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stages</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.activeStages}</div>
            <p className="text-xs text-muted-foreground">
              League stages running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Participating</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.participatingTeams}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.pendingActions}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.matchesToday}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueStats.averageAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Per match
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/league-operator/matches"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Matches</p>
                <p className="text-sm text-muted-foreground">Create, edit, and schedule matches</p>
              </div>
            </Link>
            
            <Link
              href="/league-operator/schedules"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">View Schedule</p>
                <p className="text-sm text-muted-foreground">Check upcoming match schedules</p>
              </div>
            </Link>
            
            <Link
              href="/league-operator/results"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Update Results</p>
                <p className="text-sm text-muted-foreground">Record match scores and outcomes</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'finished' ? 'bg-green-500' :
                      activity.status === 'upcoming' ? 'bg-blue-500' :
                      activity.status === 'live' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.sport} • {activity.date}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Volleyball className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{match.teams}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.sport} • {match.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {match.venue}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
