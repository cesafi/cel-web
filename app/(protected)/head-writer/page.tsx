'use client';

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
import { usePaginatedArticles } from '@/hooks/use-articles';
import { useMemo } from 'react';

export default function HeadWriterOverviewPage() {
  // Get all articles data for head-writer management
  const { data: articlesData, isLoading } = usePaginatedArticles({
    page: 1,
    pageSize: 100, // Get more articles for stats
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Calculate stats from real data
  const headWriterStats = useMemo(() => {
    if (!articlesData?.data) {
      return {
        totalArticles: 0,
        activeWriters: 0,
        pendingReviews: 0,
        publishedThisWeek: 0,
        averageReviewTime: 0,
        teamPerformance: 0
      };
    }

    const articles = articlesData.data;
    const totalArticles = articles.length;
    const pendingReviews = articles.filter(a => a.status === 'review').length;
    const published = articles.filter(a => a.status === 'published').length;
    
    // Calculate published this week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const publishedThisWeek = articles.filter(a => 
      a.status === 'published' && new Date(a.updated_at) > oneWeekAgo
    ).length;

    // Get unique authors (writers)
    const uniqueAuthors = new Set(articles.map(a => a.authored_by)).size;
    
    // Calculate team performance (published vs total)
    const teamPerformance = totalArticles > 0 ? Math.round((published / totalArticles) * 100) : 0;

    return {
      totalArticles,
      activeWriters: uniqueAuthors,
      pendingReviews,
      publishedThisWeek,
      averageReviewTime: 2.5, // This would need more complex calculation
      teamPerformance
    };
  }, [articlesData]);

  // Get recent activity from real data
  const recentActivity = useMemo(() => {
    if (!articlesData?.data) return [];
    
    return articlesData.data.slice(0, 4).map(article => ({
      id: article.id,
      title: article.title,
      status: article.status,
      author: article.authored_by || 'Unknown Author',
      date: new Date(article.created_at).toLocaleDateString()
    }));
  }, [articlesData]);

  // Calculate writer performance from real data
  const writerPerformance = useMemo(() => {
    if (!articlesData?.data) return [];
    
    const authorStats = new Map();
    
    articlesData.data.forEach(article => {
      const authorId = article.authored_by;
      const authorName = article.authored_by || 'Unknown Author';
      
      if (!authorStats.has(authorId)) {
        authorStats.set(authorId, {
          name: authorName,
          articles: 0,
          published: 0,
          pending: 0
        });
      }
      
      const stats = authorStats.get(authorId);
      stats.articles++;
      
      if (article.status === 'published') {
        stats.published++;
      } else if (article.status === 'review') {
        stats.pending++;
      }
    });
    
    return Array.from(authorStats.values()).slice(0, 4);
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
          <h1 className="text-3xl font-bold tracking-tight">Head Writer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage articles and oversee the writing team.
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
            <div className="text-2xl font-bold">{headWriterStats.totalArticles}</div>
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
            <div className="text-2xl font-bold">{headWriterStats.activeWriters}</div>
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
            <div className="text-2xl font-bold">{headWriterStats.pendingReviews}</div>
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
            <div className="text-2xl font-bold">{headWriterStats.publishedThisWeek}</div>
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
            <div className="text-2xl font-bold">{headWriterStats.averageReviewTime}d</div>
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
            <div className="text-2xl font-bold">{headWriterStats.teamPerformance}%</div>
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
                <p className="text-sm text-muted-foreground">{headWriterStats.pendingReviews} articles pending review</p>
              </div>
            </Link>
            
            <Link
              href="/head-writer/writers"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Writers</p>
                <p className="text-sm text-muted-foreground">{headWriterStats.activeWriters} active writers</p>
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
                      <p className="text-xs text-muted-foreground">by {activity.author} • {activity.date}</p>
                    </div>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
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
            {writerPerformance.map((writer, index) => (
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
                    {Math.round((writer.published / writer.articles) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
