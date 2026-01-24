import {
  FileText,
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getWriterDashboardStats } from '@/actions/dashboard';
import { getCurrentUserAction } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function WriterOverviewPage() {
  // Get current user
  const userResult = await getCurrentUserAction();

  if (!userResult.success || !userResult.data) {
    redirect('/login');
  }

  // Get stats for the user
  const dashboardData = await getWriterDashboardStats(userResult.data.id);

  const stats = dashboardData.success && dashboardData.data ? dashboardData.data.stats : {
    total: 0,
    draft: 0,
    review: 0,
    published: 0,
    archived: 0,
    featured: 0
  };

  const recentActivity = dashboardData.success && dashboardData.data ? dashboardData.data.recentActivity : [];

  // Calculate acceptance rate
  const acceptanceRate = stats.total > 0
    ? Math.round((stats.published / stats.total) * 100)
    : 0;

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
        <h1 className="text-3xl font-bold tracking-tight">Writer Dashboard</h1>
        <p className="text-muted-foreground">
          Create and manage your articles. Focus on writing quality content.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Total articles written
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Revision</CardTitle>
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
            <p className="text-xs text-muted-foreground">
              Articles requiring updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">
              Articles published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.review}</div>
            <p className="text-xs text-muted-foreground">
              Articles being reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Articles</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Articles in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Acceptance rate
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
              href="/writer/articles/new"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Plus className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Create New Article</p>
                <p className="text-sm text-muted-foreground">Start writing a new article</p>
              </div>
            </Link>

            <Link
              href="/writer/articles"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Edit3 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Edit Drafts</p>
                <p className="text-sm text-muted-foreground">{stats.draft} draft articles to continue</p>
              </div>
            </Link>

            <Link
              href="/writer/articles"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Revise Articles</p>
                <p className="text-sm text-muted-foreground">{stats.archived} articles need revision</p>
              </div>
            </Link>

            <Link
              href="/writer/articles"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">View All Articles</p>
                <p className="text-sm text-muted-foreground">Manage your article portfolio</p>
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
                        <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
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
    </div>
  );
}
