'use client';

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
import { usePaginatedArticles } from '@/hooks/use-articles';
import { useMemo } from 'react';

export default function WriterOverviewPage() {
  // Get articles data for the current user
  const { data: articlesData, isLoading } = usePaginatedArticles({
    page: 1,
    pageSize: 100, // Get more articles for stats
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Calculate stats from real data
  const writerStats = useMemo(() => {
    if (!articlesData?.data) {
      return {
        totalArticles: 0,
        needRevision: 0,
        published: 0,
        underReview: 0,
        drafts: 0,
        acceptanceRate: 0
      };
    }

    const articles = articlesData.data;
    const totalArticles = articles.length;
    const needRevision = articles.filter(a => a.status === 'archived').length;
    const published = articles.filter(a => a.status === 'published').length;
    const underReview = articles.filter(a => a.status === 'review').length;
    const drafts = articles.filter(a => a.status === 'draft').length;
    const acceptanceRate = totalArticles > 0 ? Math.round((published / totalArticles) * 100) : 0;

    return {
      totalArticles,
      needRevision,
      published,
      underReview,
      drafts,
      acceptanceRate
    };
  }, [articlesData]);

  // Get recent activity from real data
  const recentActivity = useMemo(() => {
    if (!articlesData?.data) return [];
    
    return articlesData.data.slice(0, 4).map(article => ({
      id: article.id,
      title: article.title,
      status: article.status,
      date: new Date(article.created_at).toLocaleDateString()
    }));
  }, [articlesData]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
      review: { label: "Under Review", className: "bg-blue-100 text-blue-800 border-blue-200" },
      published: { label: "Published", className: "bg-green-100 text-green-800 border-green-200" },
      archived: { label: "Archived", className: "bg-red-100 text-red-800 border-red-200" },
      featured: { label: "Featured", className: "bg-purple-100 text-purple-800 border-purple-200" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Writer Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage your articles. Focus on writing quality content.
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
            <div className="text-2xl font-bold">{writerStats.totalArticles}</div>
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
            <div className="text-2xl font-bold">{writerStats.needRevision}</div>
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
            <div className="text-2xl font-bold">{writerStats.published}</div>
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
            <div className="text-2xl font-bold">{writerStats.underReview}</div>
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
            <div className="text-2xl font-bold">{writerStats.drafts}</div>
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
            <div className="text-2xl font-bold">{writerStats.acceptanceRate}%</div>
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
                <p className="text-sm text-muted-foreground">{writerStats.drafts} draft articles to continue</p>
              </div>
            </Link>
            
            <Link
              href="/writer/articles"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Revise Articles</p>
                <p className="text-sm text-muted-foreground">{writerStats.needRevision} articles need revision</p>
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'published' ? 'bg-green-500' :
                      activity.status === 'featured' ? 'bg-purple-500' :
                      activity.status === 'review' ? 'bg-blue-500' :
                      activity.status === 'archived' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
