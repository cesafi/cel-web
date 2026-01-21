import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionsProps {
  stats: {
    schools: number;
    sports: number;
    articles: number;
    volunteers: number;
    seasons: number;
    games: number;
  };
  quickActions: {
    schools: number;
    seasons: number;
    articles: number;
  };
}

export function QuickActions({ stats, quickActions }: QuickActionsProps) {

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <>
          <p className="text-sm text-muted-foreground">
            • Add new school ({quickActions.schools} existing)
          </p>
          <p className="text-sm text-muted-foreground">
            • Create new season ({quickActions.seasons} existing)
          </p>
          <p className="text-sm text-muted-foreground">
            • Manage articles ({quickActions.articles} existing)
          </p>
          <p className="text-sm text-muted-foreground">
            • Add new sport ({stats.sports} existing)
          </p>
          <p className="text-sm text-muted-foreground">
            • Schedule games ({stats.games} existing)
          </p>
        </>
      </CardContent>
    </Card>
  );
}
