import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getHeadWriterDashboardStats } from '@/actions/dashboard';

export default async function HeadWriterOverviewPage() {
  // Get data server-side
  const dashboardData = await getHeadWriterDashboardStats();

  const stats = dashboardData.success && dashboardData.data ? dashboardData.data.stats : {
    totalArticles: 0,
    activeWriters: 0,
    pendingReviews: 0,
    publishedThisWeek: 0,
    averageReviewTime: 0,
    teamPerformance: 0
  };

  const recentActivity = dashboardData.success && dashboardData.data ? dashboardData.data.recentActivity : [];
  const writerPerformance = dashboardData.success && dashboardData.data ? dashboardData.data.writerPerformance : [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
      review: { label: "Under Review", className: "bg-blue-100 text-blue-800 border-blue-200" },
      published: { label: "Published", className: "bg-green-100 text-green-800 border-green-200" },
      archived: { label: "Archived", className: "bg-red-100 text-red-800 border-red-200" },
      featured: { label: "Featured", className: "bg-purple-100 text-purple-800 border-purple-200" }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Head Writer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage articles and oversee the writing team.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">
              Articles this season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Writers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWriters}</div>
            <p className="text-xs text-muted-foreground">
              Writers in the team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Articles awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Articles published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageReviewTime}d</div>
            <p className="text-xs text-muted-foreground">
              Days to review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              Overall quality score
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
              href="/head-writer/articles"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Review Articles</p>
                <p className="text-sm text-muted-foreground">{stats.pendingReviews} articles pending review</p>
              </div>
            </Link>

            <Link
              href="/head-writer/writers"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Writers</p>
                <p className="text-sm text-muted-foreground">{stats.activeWriters} active writers</p>
              </div>
            </Link>

            <Link
              href="/head-writer/articles/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Plus className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Create Article</p>
                <p className="text-sm text-muted-foreground">Start a new article</p>
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
                      <div className={`h-2 w-2 rounded-full ${activity.status === 'published' ? 'bg-green-500' :
                          activity.status === 'featured' ? 'bg-purple-500' :
                            activity.status === 'review' ? 'bg-blue-500' :
                              activity.status === 'archived' ? 'bg-red-500' :
                                'bg-gray-500'
                        }`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        {/* @ts-expect-error - authored_by is not in the type definition but we know it's there now */}
                        <p className="text-xs text-muted-foreground">by {activity.authored_by || 'Unknown'} • {new Date(activity.created_at).toLocaleDateString()}</p>
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

      {/* Writer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Writer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {writerPerformance.length > 0 ? (
              writerPerformance.map((writer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{writer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {writer.articles} articles • {writer.published} published • {writer.pending} pending
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {writer.articles > 0 ? Math.round((writer.published / writer.articles) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Success rate</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No writer performance data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
