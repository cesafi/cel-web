import {
  WelcomeHeader,
  DashboardStats,
  RecentActivity,
  QuickActions
} from '@/components/admin/overview';
import { getDashboardStats } from '@/actions/dashboard';
import { getCurrentUserAction } from '@/actions/auth';

export default async function AdminOverviewPage() {
  const [statsResult, userResult] = await Promise.all([
    getDashboardStats(),
    getCurrentUserAction()
  ]);

  const stats =
    statsResult.success && statsResult.data
      ? statsResult.data
      : {
        counts: { schools: 0, sports: 0, articles: 0, volunteers: 0, seasons: 0, games: 0 },
        recentActivity: { articles: [], games: [], matches: [] }
      };

  // Derive quick actions data directly from the main stats count
  // This avoids a redundant database call since we already have these counts
  const quickActions = {
    schools: stats.counts.schools,
    seasons: stats.counts.seasons,
    articles: stats.counts.articles
  };

  const user =
    userResult.success && userResult.data
      ? userResult.data
      : {
        userName: 'Admin',
        email: 'admin@cesafi.com'
      };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <WelcomeHeader userName={user.userName} />

      {/* Dashboard Stats */}
      <DashboardStats stats={stats.counts} />

      {/* Additional Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentActivity recentActivity={stats.recentActivity} />
        <QuickActions stats={stats.counts} quickActions={quickActions} />
      </div>
    </div>
  );
}
