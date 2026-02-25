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
import { getLeagueOperatorDashboardStats } from '@/actions/dashboard';

export default async function LeagueOperatorOverviewPage() {
  // Get data server-side
  const dashboardData = await getLeagueOperatorDashboardStats();

  const stats = dashboardData.success && dashboardData.data ? dashboardData.data.stats : {
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    activeStages: 0,
    participatingTeams: 0,
    pendingActions: 0,
    matchesToday: 0,
    averageAttendance: 0
  };

  const recentActivity = dashboardData.success && dashboardData.data ? dashboardData.data.recentActivity : [];
  const matchesToday = dashboardData.success && dashboardData.data ? dashboardData.data.matchesToday : [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-800 border-blue-200" },

      ongoing: { label: "Ongoing", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      live: { label: "Live", className: "bg-yellow-100 text-yellow-800 border-yellow-200" }, // Added live as likely alternative
      finished: { label: "Finished", className: "bg-green-100 text-green-800 border-green-200" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
      canceled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" } // Handle both spellings
    };


    const config = statusConfig[status] || statusConfig.upcoming;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

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
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
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
            <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
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
            <div className="text-2xl font-bold">{stats.completedMatches}</div>
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
            <div className="text-2xl font-bold">{stats.activeStages}</div>
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
            <div className="text-2xl font-bold">{stats.participatingTeams}</div>
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
            <div className="text-2xl font-bold">{stats.pendingActions}</div>
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
            <div className="text-2xl font-bold">{stats.matchesToday}</div>
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
            <div className="text-2xl font-bold">{stats.averageAttendance}</div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${activity.status === 'finished' ? 'bg-green-500' :
                        activity.status === 'upcoming' ? 'bg-blue-500' :
                          activity.status === 'live' ? 'bg-yellow-500' :
                            'bg-gray-500'
                        }`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.name || 'Match'}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.esports_seasons_stages?.esports_categories?.esports?.name || 'Unknown Sport'} • {activity.scheduled_at ? new Date(activity.scheduled_at).toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
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
            {matchesToday.length > 0 ? (
              matchesToday.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Volleyball className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{match.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {match.esports_seasons_stages?.esports_categories?.esports?.name || 'Match'} • {match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {match.venue || 'TBD'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No matches scheduled for today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
